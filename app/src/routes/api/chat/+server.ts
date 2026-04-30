import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { chatConversations, chatMessages, teamMembers, listings, fieldNotes, contacts, tasks } from '$lib/server/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { getAnthropicClient } from '$lib/server/llm.js';

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { message, conversationId } = await request.json();
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });
  }

  try {
    // Get team context
    const context = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const member = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
      });
      if (!member) throw new Error('Team member not found');

      // Get or create conversation
      let convId = conversationId;
      if (!convId) {
        convId = crypto.randomUUID();
        await db.insert(chatConversations).values({
          id: convId,
          teamId: member.teamId,
          userId: member.id,
          title: message.trim().slice(0, 100),
        });
      }

      // Save user message
      await db.insert(chatMessages).values({
        id: crypto.randomUUID(),
        conversationId: convId,
        role: 'user',
        content: message.trim(),
      });

      // Load conversation history
      const history = await db.query.chatMessages.findMany({
        where: eq(chatMessages.conversationId, convId),
        orderBy: chatMessages.createdAt,
      });

      // Build context — load team data summaries
      const teamListings = await db.query.listings.findMany({
        where: eq(listings.teamId, member.teamId),
        with: { property: true },
      });

      const recentNotes = await db.query.fieldNotes.findMany({
        where: eq(fieldNotes.teamId, member.teamId),
        orderBy: desc(fieldNotes.createdAt),
        limit: 20,
      });

      const teamContacts = await db.query.contacts.findMany({
        where: eq(contacts.teamId, member.teamId),
      });

      const teamTasks = await db.query.tasks.findMany({
        where: eq(tasks.teamId, member.teamId),
        limit: 50,
      });

      return {
        convId,
        member,
        history,
        teamListings,
        recentNotes,
        teamContacts,
        teamTasks,
      };
    });

    // Build system prompt
    const listingSummaries = context.teamListings.map((l: any) =>
      `- ${l.property?.address}, ${l.property?.city} (${l.phase}) ${l.price ? '$' + l.price.toLocaleString() : 'no price'}`
    ).join('\n');

    const noteSummaries = context.recentNotes.map((n: any) =>
      `- [${n.mediaType}] ${n.summary || n.textContent?.slice(0, 100) || 'No content'} (${new Date(n.createdAt).toLocaleDateString()})`
    ).join('\n');

    const contactSummaries = context.teamContacts.map((c: any) =>
      `- ${c.name} (${c.type || 'contact'}) ${c.email || ''} ${c.phone || ''}`
    ).join('\n');

    const taskSummaries = context.teamTasks.map((t: any) =>
      `- [${t.status}] ${t.title} ${t.dueDate ? 'due ' + new Date(t.dueDate).toLocaleDateString() : ''}`
    ).join('\n');

    const systemPrompt = `You are HomeTrack AI, an intelligent assistant for real estate listing teams. You help with managing listings, understanding field notes, tracking tasks, and providing insights about the team's portfolio.

Current user: ${context.member.name} (${context.member.roleLabel || 'Team Member'})

## Active Listings
${listingSummaries || 'No listings yet.'}

## Recent Field Notes (last 20)
${noteSummaries || 'No notes yet.'}

## Contacts
${contactSummaries || 'No contacts yet.'}

## Tasks
${taskSummaries || 'No tasks yet.'}

Be concise, helpful, and professional. When referencing specific listings or contacts, use their names. If asked about data you don't have, say so clearly. You can suggest actions like creating tasks, scheduling showings, or following up with contacts.`;

    // Build messages array for Claude
    const messages = context.history
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Stream response
    const client = getAnthropicClient(locals.user.id, context.convId);

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    // Create SSE response
    const encoder = new TextEncoder();
    let fullContent = '';
    let thinkingContent = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', id: context.convId })}\n\n`));

          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta as any;
              if (delta.type === 'text_delta') {
                fullContent += delta.text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: delta.text })}\n\n`));
              } else if (delta.type === 'thinking_delta') {
                thinkingContent += delta.thinking;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'thinking', text: delta.thinking })}\n\n`));
              }
            } else if (event.type === 'message_stop') {
              // Save assistant message
              await withRLS(locals.user!.id, 'authenticated', async (db) => {
                await db.insert(chatMessages).values({
                  id: crypto.randomUUID(),
                  conversationId: context.convId,
                  role: 'assistant',
                  content: fullContent,
                  thinking: thinkingContent || null,
                  metadata: {
                    model: 'claude-sonnet-4-6-20250514',
                  },
                });
              });

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    return new Response(JSON.stringify({ error: 'Chat failed' }), { status: 500 });
  }
};
