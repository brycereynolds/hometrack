import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import { chatConversations, chatMessages, teamMembers, listings, fieldNotes, contacts, tasks } from '$lib/server/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { getAnthropicClient } from '$lib/server/llm.js';
import { chatTools, executeToolCall } from '$lib/server/chat-tools.js';

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { message, conversationId, context: pageContext } = await request.json();
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

        // Build source context with a human-readable label
        let sourceContext = null;
        if (pageContext?.pathname) {
          const p = pageContext.pathname as string;
          let label: string | null = null;
          if (p.match(/^\/notes\/[^/]+$/)) label = 'Field Note';
          else if (p.match(/^\/listings\/[^/]+\/field-notes\/[^/]+$/)) label = 'Field Note';
          else if (p.match(/^\/listings\/[^/]+/)) label = 'Listing';
          else if (p === '/dashboard') label = 'Dashboard';
          else if (p === '/contacts') label = 'Contacts';
          else if (p === '/vendors') label = 'Vendors';
          else if (p === '/analytics') label = 'Analytics';
          else if (p === '/chat') label = null;
          else label = p;

          if (label) {
            sourceContext = {
              pathname: p,
              params: pageContext.params ?? {},
              label,
            };
          }
        }

        await db.insert(chatConversations).values({
          id: convId,
          teamId: member.teamId,
          userId: member.id,
          title: message.trim().slice(0, 100),
          sourceContext,
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
      `- [id:${l.id}] ${l.property?.address}, ${l.property?.city} (${l.phase}) ${l.price ? '$' + l.price.toLocaleString() : 'no price'}`
    ).join('\n');

    const noteSummaries = context.recentNotes.map((n: any) =>
      `- [id:${n.id}] [${n.mediaType}] ${n.summary || n.textContent?.slice(0, 100) || 'No content'} (${new Date(n.createdAt).toLocaleDateString()})`
    ).join('\n');

    const contactSummaries = context.teamContacts.map((c: any) =>
      `- ${c.name} (${c.type || 'contact'}) ${c.email || ''} ${c.phone || ''}`
    ).join('\n');

    const taskSummaries = context.teamTasks.map((t: any) =>
      `- [${t.status}] ${t.title} ${t.dueDate ? 'due ' + new Date(t.dueDate).toLocaleDateString() : ''}`
    ).join('\n');

    // Build page-specific context from the client's current route
    let pageContextPrompt = '';
    if (pageContext?.pathname) {
      const p = pageContext.pathname as string;
      const params = pageContext.params ?? {};
      if (p.match(/^\/notes\/[^/]+$/)) {
        pageContextPrompt = `\n## Current Page Context\nThe user is viewing field note "${params.noteId || p.split('/').pop()}". Focus answers on this note when relevant.`;
      } else if (p.match(/^\/listings\/[^/]+\/field-notes\/[^/]+$/)) {
        pageContextPrompt = `\n## Current Page Context\nThe user is viewing field note "${params.noteId || ''}" on listing "${params.id || ''}". Focus answers on this note and listing when relevant.`;
      } else if (p.match(/^\/listings\/[^/]+/)) {
        pageContextPrompt = `\n## Current Page Context\nThe user is viewing listing "${params.id || p.split('/')[2]}". Focus answers on this listing when relevant.`;
      } else if (p === '/contacts') {
        pageContextPrompt = '\n## Current Page Context\nThe user is on the Contacts page.';
      } else if (p === '/vendors') {
        pageContextPrompt = '\n## Current Page Context\nThe user is on the Vendors page.';
      } else if (p === '/analytics') {
        pageContextPrompt = '\n## Current Page Context\nThe user is on the Analytics page.';
      } else if (p === '/dashboard') {
        pageContextPrompt = '\n## Current Page Context\nThe user is on the Dashboard.';
      }
    }

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
${pageContextPrompt}
IMPORTANT RULES:
- Be concise, helpful, and professional.
- You have tools to look up detailed information about field notes, listings, tasks, contacts, vendors, and to search listings. When the user asks about specific data, use these tools rather than guessing. If the user is on a field note or listing page, you'll be told which one — use the appropriate tool to get details before answering.
- Use get_tasks to look up tasks (optionally filtered by listing or status). Use get_contacts and get_vendors to find people and service providers. Use search_listings to find listings by address, city, phase, or price range.
- You can ONLY read and discuss data. You CANNOT create, update, or delete anything.
- If the user asks you to create a note, task, or make any change, tell them you can't do that yet but suggest they use the app's UI (e.g., "You can create a note using the Capture Note button in the sidebar").
- NEVER pretend you performed an action. NEVER fabricate a confirmation of something you didn't do.
- When referencing listings or contacts, use their actual names from the data above.
- If asked about data not available through your tools or context, say you don't have that information.`;

    // Build messages array for Claude
    const messages: Array<{ role: 'user' | 'assistant'; content: any }> = context.history
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const client = getAnthropicClient(locals.user.id, context.convId);
    const encoder = new TextEncoder();
    let fullContent = '';
    let thinkingContent = '';
    const toolCallLog: Array<{ name: string; input: any; result_summary: string }> = [];

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', id: context.convId })}\n\n`));

          // Tool-use loop: stream, detect tool_use, execute, continue
          let continueLoop = true;
          const MAX_TOOL_ROUNDS = 5;
          let round = 0;

          while (continueLoop && round < MAX_TOOL_ROUNDS) {
            round++;
            continueLoop = false;

            const stream = client.messages.stream({
              model: 'claude-sonnet-4-6',
              max_tokens: 4096,
              system: systemPrompt,
              messages,
              tools: chatTools,
            });

            // Collect content blocks from the stream for building the assistant turn
            const contentBlocks: any[] = [];
            let currentToolUse: { id: string; name: string; input_json: string } | null = null;

            for await (const event of stream) {
              if (event.type === 'content_block_start') {
                const block = (event as any).content_block;
                if (block?.type === 'tool_use') {
                  currentToolUse = { id: block.id, name: block.name, input_json: '' };
                  // Notify client that a tool is being called
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_use', name: block.name })}\n\n`));
                }
              } else if (event.type === 'content_block_delta') {
                const delta = event.delta as any;
                if (delta.type === 'text_delta') {
                  fullContent += delta.text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: delta.text })}\n\n`));
                } else if (delta.type === 'thinking_delta') {
                  thinkingContent += delta.thinking;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'thinking', text: delta.thinking })}\n\n`));
                } else if (delta.type === 'input_json_delta' && currentToolUse) {
                  currentToolUse.input_json += delta.partial_json;
                }
              } else if (event.type === 'content_block_stop') {
                if (currentToolUse) {
                  contentBlocks.push({
                    type: 'tool_use',
                    id: currentToolUse.id,
                    name: currentToolUse.name,
                    input: JSON.parse(currentToolUse.input_json || '{}'),
                  });
                  currentToolUse = null;
                }
              }
            }

            // Check if Claude used any tools in this round
            const finalMessage = await stream.finalMessage();
            const toolUseBlocks = finalMessage.content.filter(
              (b): b is Extract<typeof b, { type: 'tool_use' }> => b.type === 'tool_use',
            );

            if (toolUseBlocks.length > 0 && finalMessage.stop_reason === 'tool_use') {
              // Add assistant message with all content blocks
              messages.push({ role: 'assistant', content: finalMessage.content as any });

              // Execute each tool and build tool_result messages
              const toolResults: any[] = [];
              for (const block of toolUseBlocks) {
                const result = await executeToolCall(
                  block.name,
                  block.input as Record<string, string>,
                  locals.user!.id,
                  context.member.teamId,
                );

                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: result,
                });

                // Log for DB
                const parsed = JSON.parse(result);
                toolCallLog.push({
                  name: block.name,
                  input: block.input as Record<string, string>,
                  result_summary: parsed.error || `Retrieved ${block.name.replace('get_', '')}`,
                });
              }

              // Add tool results as user message
              messages.push({ role: 'user', content: toolResults });

              // Reset text content for next round (tool text was intermediate)
              // fullContent is accumulated across rounds
              continueLoop = true;
            }
          }

          // Save assistant message with tool calls
          await withRLS(locals.user!.id, 'authenticated', async (db) => {
            await db.insert(chatMessages).values({
              id: crypto.randomUUID(),
              conversationId: context.convId,
              role: 'assistant',
              content: fullContent,
              thinking: thinkingContent || null,
              toolCalls: toolCallLog.length > 0 ? toolCallLog : null,
              metadata: {
                model: 'claude-sonnet-4-6',
              },
            });
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
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
