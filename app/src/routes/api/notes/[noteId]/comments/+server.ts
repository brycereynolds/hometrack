import { json, type RequestHandler } from '@sveltejs/kit';
import { withRLS } from '$lib/server/db/index.js';
import { fieldNoteComments, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const noteId = params.noteId!;

  try {
    const comments = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return db.query.fieldNoteComments.findMany({
        where: eq(fieldNoteComments.fieldNoteId, noteId),
        with: { author: true, replies: { with: { author: true }, orderBy: (c, { asc }) => [asc(c.createdAt)] } },
        orderBy: asc(fieldNoteComments.createdAt),
      });
    });
    // Filter to top-level only (parentId is null) — replies are nested
    const topLevel = comments.filter(c => !c.parentId);
    return json({ comments: topLevel });
  } catch (err) {
    console.error('Load comments error:', err);
    return json({ error: 'Failed to load comments' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ params, locals, request }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const noteId = params.noteId!;

  const { content, parentId, actionId, mentions } = await request.json();
  if (!content?.trim()) return json({ error: 'Comment cannot be empty' }, { status: 400 });

  try {
    const result = await withRLS(locals.user.id, 'authenticated', async (db) => {
      const member = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, locals.user!.id),
      });
      if (!member) throw new Error('Team member not found');

      const commentId = crypto.randomUUID();
      await db.insert(fieldNoteComments).values({
        id: commentId,
        fieldNoteId: noteId,
        actionId: actionId || null,
        parentId: parentId || null,
        authorId: member.id,
        content: content.trim(),
        mentions: mentions || null,
      });

      return { id: commentId, authorId: member.id, authorName: member.name };
    });

    return json({ success: true, ...result });
  } catch (err) {
    console.error('Post comment error:', err);
    return json({ error: 'Failed to post comment' }, { status: 500 });
  }
};
