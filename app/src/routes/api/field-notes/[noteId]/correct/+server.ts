import type { RequestHandler } from './$types';
import { withRLS } from '$lib/server/db/index.js';
import {
  fieldNotes,
  fieldNoteActions,
  fieldNoteMoments,
  teamMembers,
} from '$lib/server/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getAnthropicClient } from '$lib/server/llm.js';

export const POST: RequestHandler = async ({ locals, request, params }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { actionId, correction } = await request.json();
  if (!actionId || !correction?.trim()) {
    return new Response(JSON.stringify({ error: 'actionId and correction are required' }), {
      status: 400,
    });
  }

  try {
    // Load context
    const context = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const member = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
      });
      if (!member) throw new Error('Team member not found');

      const action = await db.query.fieldNoteActions.findFirst({
        where: eq(fieldNoteActions.id, actionId),
        with: {
          fieldNote: true,
          actionMoments: {
            with: {
              moment: true,
            },
          },
          sourceMoment: true,
        },
      });
      if (!action) throw new Error('Action not found');

      // Verify the action belongs to the requested note
      if (action.fieldNoteId !== params.noteId) {
        throw new Error('Action does not belong to this note');
      }

      return { member, action };
    });

    const { action } = context;

    // Collect linked moments (from junction table + legacy sourceMoment)
    const linkedMoments: { id: string; description: string | null; transcriptContext: string | null; enrichedCaption: string | null }[] = [];
    if (action.actionMoments) {
      for (const am of action.actionMoments) {
        if (am.moment) {
          linkedMoments.push({
            id: am.moment.id,
            description: am.moment.description,
            transcriptContext: am.moment.transcriptContext,
            enrichedCaption: am.moment.enrichedCaption,
          });
        }
      }
    }
    if (action.sourceMoment && !linkedMoments.find((m) => m.id === action.sourceMoment!.id)) {
      linkedMoments.push({
        id: action.sourceMoment.id,
        description: action.sourceMoment.description,
        transcriptContext: action.sourceMoment.transcriptContext,
        enrichedCaption: action.sourceMoment.enrichedCaption,
      });
    }

    const noteSummary = action.fieldNote?.summary ?? '';

    // Build LLM prompt
    const systemPrompt = `You are correcting field note data based on user feedback. The user reviewed an AI-generated action item from a property walkthrough and noticed an error. Apply the user's correction to the action item and any linked moments that need updating.

Return a JSON object with this exact structure:
{
  "action": {
    "title": "corrected title",
    "description": "corrected description or null",
    "category": "corrected category or null"
  },
  "moments": [
    { "id": "moment-uuid", "description": "corrected description", "enrichedCaption": "corrected enriched caption or null" }
  ],
  "summaryUpdate": "corrected summary sentence or null"
}

Rules:
- Only modify fields that need correction based on the user's feedback
- Keep the same style and tone as the original
- For moments, only include ones that need changes
- For summaryUpdate, return null unless the note summary directly references the incorrect item
- Return ONLY valid JSON, no markdown fences or extra text`;

    const userMessage = `## Current Action Item
Title: ${action.title}
Description: ${action.description ?? '(none)'}
Category: ${action.category ?? '(none)'}
Priority: ${action.priority ?? '(none)'}

## Linked Moments
${linkedMoments.length > 0 ? linkedMoments.map((m) => `- [${m.id}] ${m.description ?? '(no description)'}${m.enrichedCaption ? `\n  Enriched caption: "${m.enrichedCaption}"` : ''}${m.transcriptContext ? `\n  Context: "${m.transcriptContext}"` : ''}`).join('\n') : '(no linked moments)'}

## Note Summary
${noteSummary || '(no summary)'}

## User's Correction
${correction}`;

    const client = getAnthropicClient(locals.user.id, `correct-${actionId}`);
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract text response
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from LLM');
    }

    // Parse JSON — strip markdown fences if present
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let result: {
      action: { title: string; description: string | null; category: string | null };
      moments: { id: string; description: string; enrichedCaption?: string | null }[];
      summaryUpdate: string | null;
    };

    try {
      result = JSON.parse(jsonStr);
    } catch {
      throw new Error('LLM returned invalid JSON');
    }

    // Apply updates
    await withRLS(locals.user.id, 'authenticated', async (db) => {
      // Update the action
      await db
        .update(fieldNoteActions)
        .set({
          title: result.action.title,
          description: result.action.description,
          category: result.action.category,
          updatedAt: new Date(),
        })
        .where(eq(fieldNoteActions.id, actionId));

      // Update linked moments
      if (result.moments && result.moments.length > 0) {
        for (const m of result.moments) {
          // Only update moments that are actually linked to this action
          const isLinked = linkedMoments.some((lm) => lm.id === m.id);
          if (isLinked) {
            const momentUpdate: { description: string; enrichedCaption?: string } = {
              description: m.description,
            };
            if (m.enrichedCaption) {
              momentUpdate.enrichedCaption = m.enrichedCaption;
            }
            await db
              .update(fieldNoteMoments)
              .set(momentUpdate)
              .where(eq(fieldNoteMoments.id, m.id));
          }
        }
      }

      // Update summary if needed
      if (result.summaryUpdate && action.fieldNoteId) {
        await db
          .update(fieldNotes)
          .set({ summary: result.summaryUpdate, updatedAt: new Date() })
          .where(eq(fieldNotes.id, action.fieldNoteId));
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        updated: {
          action: result.action,
          moments: result.moments,
          summaryUpdated: !!result.summaryUpdate,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Correct action error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Correction failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
