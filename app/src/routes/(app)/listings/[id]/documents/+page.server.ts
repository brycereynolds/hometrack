import type { PageServerLoad, Actions } from './$types';
import { getDocumentsByListing } from '$lib/server/db/queries/listings.js';
import { withRLS } from '$lib/server/db/index.js';
import { documents, teamMembers } from '$lib/server/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { buildStoragePath, uploadFile, getSignedUrl, deleteFile } from '$lib/server/storage.js';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { team } = await parent();

  if (!team || !locals.user) {
    return { documents: [] };
  }

  try {
    const docs = await withRLS(locals.user.id, 'authenticated', async (db) => {
      return getDocumentsByListing(team.id, params.id, db);
    });
    return { documents: docs };
  } catch {
    return { documents: [] };
  }
};

async function getTeamMember(userId: string) {
  return withRLS(userId, 'authenticated', async (db) => {
    return db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase() ?? '';
  return ext || 'FILE';
}

const VALID_CATEGORIES = ['disclosures', 'inspection', 'title', 'contracts', 'marketing', 'photos', 'other'] as const;

export const actions: Actions = {
  upload: async ({ request, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const member = await getTeamMember(locals.user.id);
    if (!member) return fail(400, { error: 'No team membership found' });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category')?.toString() ?? 'other';

    if (!file || file.size === 0) {
      return fail(400, { error: 'No file selected' });
    }

    if (file.size > 50 * 1024 * 1024) {
      return fail(400, { error: 'File exceeds 50MB limit' });
    }

    const validCategory = VALID_CATEGORIES.includes(category as any)
      ? (category as typeof VALID_CATEGORIES[number])
      : 'other';

    const storagePath = buildStoragePath(member.teamId, file.name, params.id);
    const buffer = new Uint8Array(await file.arrayBuffer());

    try {
      await uploadFile(storagePath, buffer, file.type || 'application/octet-stream');
    } catch (err) {
      console.error('Storage upload failed:', err);
      return fail(500, { error: 'Failed to upload file. Please try again.' });
    }

    const id = crypto.randomUUID();

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db.insert(documents).values({
          id,
          teamId: member.teamId,
          listingId: params.id,
          name: file.name,
          category: validCategory,
          uploadedById: member.id,
          uploadedDate: new Date(),
          fileSize: formatFileSize(file.size),
          fileSizeBytes: file.size,
          fileType: getFileType(file.name),
          status: 'draft',
          version: 1,
          fileUrl: storagePath,
        });
      });
    } catch (err) {
      console.error('Failed to create document record:', err);
      return fail(500, { error: 'File uploaded but failed to save record. Please try again.' });
    }

    return { success: true };
  },

  updateStatus: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const member = await getTeamMember(locals.user.id);
    if (!member) return fail(400, { error: 'No team membership found' });

    const form = await request.formData();
    const documentId = form.get('documentId') as string;
    const newStatus = form.get('newStatus') as string;

    if (!documentId || !newStatus) {
      return fail(400, { error: 'Document ID and status are required' });
    }

    const validStatuses = ['draft', 'pending_signature', 'signed', 'complete', 'expired'];
    if (!validStatuses.includes(newStatus)) {
      return fail(400, { error: 'Invalid status' });
    }

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        await db
          .update(documents)
          .set({ status: newStatus as any, updatedAt: new Date() })
          .where(and(eq(documents.id, documentId), eq(documents.teamId, member.teamId)));
      });
      return { success: true, action: 'updateStatus' };
    } catch (err) {
      console.error('updateStatus error:', err);
      return fail(500, { error: 'Failed to update document status' });
    }
  },

  deleteDocument: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const member = await getTeamMember(locals.user.id);
    if (!member) return fail(400, { error: 'No team membership found' });

    const form = await request.formData();
    const documentId = form.get('documentId') as string;

    if (!documentId) return fail(400, { error: 'Document ID is required' });

    try {
      await withRLS(locals.user.id, 'authenticated', async (db) => {
        // Get the document to find storage path
        const doc = await db.query.documents.findFirst({
          where: and(eq(documents.id, documentId), eq(documents.teamId, member.teamId)),
        });

        if (!doc) throw new Error('Document not found');

        // Delete from storage if file URL exists
        if (doc.fileUrl) {
          try {
            await deleteFile(doc.fileUrl);
          } catch (storageErr) {
            console.error('Storage delete failed (continuing with DB delete):', storageErr);
          }
        }

        // Delete DB record
        await db
          .delete(documents)
          .where(and(eq(documents.id, documentId), eq(documents.teamId, member.teamId)));
      });
      return { success: true, action: 'deleteDocument' };
    } catch (err) {
      console.error('deleteDocument error:', err);
      return fail(500, { error: 'Failed to delete document' });
    }
  },

  downloadDocument: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });

    const member = await getTeamMember(locals.user.id);
    if (!member) return fail(400, { error: 'No team membership found' });

    const form = await request.formData();
    const documentId = form.get('documentId') as string;

    if (!documentId) return fail(400, { error: 'Document ID is required' });

    try {
      const signedUrl = await withRLS(locals.user.id, 'authenticated', async (db) => {
        const doc = await db.query.documents.findFirst({
          where: and(eq(documents.id, documentId), eq(documents.teamId, member.teamId)),
        });
        if (!doc) throw new Error('Document not found');
        if (!doc.fileUrl) throw new Error('No file associated with this document');

        return getSignedUrl(doc.fileUrl);
      });
      return { success: true, action: 'downloadDocument', signedUrl };
    } catch (err) {
      console.error('downloadDocument error:', err);
      return fail(500, { error: 'Failed to generate download URL' });
    }
  },
};
