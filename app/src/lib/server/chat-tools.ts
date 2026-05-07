import { withRLS } from '$lib/server/db/index.js';
import {
  fieldNotes,
  fieldNoteTranscripts,
  fieldNoteMoments,
  fieldNoteActions,
  fieldNoteFrames,
  listings,
  tasks,
  contacts,
  vendors,
  properties,
} from '$lib/server/db/schema/index.js';
import { eq, and, ilike, or, gte, lte } from 'drizzle-orm';
import type Anthropic from '@anthropic-ai/sdk';

export const chatTools: Anthropic.Messages.Tool[] = [
  {
    name: 'get_field_note',
    description:
      'Get full details about a field note including transcript, key moments, action items, and frames. Use this when the user asks about a specific field note or walkthrough.',
    input_schema: {
      type: 'object' as const,
      properties: {
        note_id: { type: 'string', description: 'The field note UUID' },
      },
      required: ['note_id'],
    },
  },
  {
    name: 'get_listing',
    description:
      'Get full details about a listing including property details, tasks, contacts, field notes, and financials. Use this when the user asks about a specific listing or property.',
    input_schema: {
      type: 'object' as const,
      properties: {
        listing_id: { type: 'string', description: 'The listing UUID' },
      },
      required: ['listing_id'],
    },
  },
  {
    name: 'get_tasks',
    description:
      'Get tasks for a specific listing or all tasks for the user\'s team. Use when users ask about to-dos, tasks, or what needs to be done.',
    input_schema: {
      type: 'object' as const,
      properties: {
        listing_id: { type: 'string', description: 'Optional listing UUID to filter tasks' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done', 'overdue'],
          description: 'Optional status filter',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_contacts',
    description:
      'Get contacts for the user\'s team. Use when users ask about clients, agents, or people.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['client', 'agent', 'vendor', 'other'],
          description: 'Optional contact type filter',
        },
        search: { type: 'string', description: 'Optional name search' },
      },
      required: [],
    },
  },
  {
    name: 'get_vendors',
    description:
      'Get vendors for the user\'s team. Use when users ask about vendors, contractors, or service providers.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', description: 'Optional vendor category filter' },
        search: { type: 'string', description: 'Optional name search' },
      },
      required: [],
    },
  },
  {
    name: 'search_listings',
    description:
      'Search listings by address, city, phase, or price range. Use when users ask about their properties or listings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Optional search string for address or city' },
        phase: {
          type: 'string',
          enum: ['pre_market', 'active', 'closed', 'canceled'],
          description: 'Optional phase filter',
        },
        min_price: { type: 'number', description: 'Optional minimum price' },
        max_price: { type: 'number', description: 'Optional maximum price' },
      },
      required: [],
    },
  },
];

export async function executeToolCall(
  toolName: string,
  toolInput: Record<string, any>,
  userId: string,
  teamId: string,
): Promise<string> {
  switch (toolName) {
    case 'get_field_note':
      return getFieldNote(toolInput.note_id, userId, teamId);
    case 'get_listing':
      return getListing(toolInput.listing_id, userId, teamId);
    case 'get_tasks':
      return getTasks(toolInput, userId, teamId);
    case 'get_contacts':
      return getContacts(toolInput, userId, teamId);
    case 'get_vendors':
      return getVendors(toolInput, userId, teamId);
    case 'search_listings':
      return searchListings(toolInput, userId, teamId);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

async function getFieldNote(noteId: string, userId: string, teamId: string): Promise<string> {
  const result = await withRLS(userId, 'authenticated', async (db) => {
    const note = await db.query.fieldNotes.findFirst({
      where: and(eq(fieldNotes.id, noteId), eq(fieldNotes.teamId, teamId)),
      with: {
        transcripts: true,
        moments: { with: { bestFrame: true } },
        actions: true,
        frames: true,
        listing: { with: { property: true } },
        author: true,
      },
    });

    if (!note) return { error: 'Field note not found' };

    return {
      id: note.id,
      mediaType: note.mediaType,
      status: note.status,
      tag: note.tag,
      summary: note.summary,
      textContent: note.textContent,
      duration: note.duration,
      createdAt: note.createdAt,
      author: note.author?.name,
      listing: note.listing
        ? {
            id: note.listing.id,
            address: note.listing.property?.address,
            city: note.listing.property?.city,
          }
        : null,
      transcript: note.transcripts?.[0]
        ? {
            raw: note.transcripts[0].rawTranscript,
            enriched: note.transcripts[0].enrichedTranscript,
            segments: note.transcripts[0].rawSegments,
          }
        : null,
      moments: note.moments?.map((m) => ({
        index: m.momentIndex,
        timestamp: m.timestamp,
        category: m.category,
        description: m.description,
        transcriptContext: m.transcriptContext,
        enrichedCaption: m.enrichedCaption,
        bestFrame: m.bestFrame
          ? { caption: m.bestFrame.caption, description: m.bestFrame.visualDescription }
          : null,
      })),
      actions: note.actions?.map((a) => ({
        title: a.title,
        description: a.description,
        category: a.category,
        priority: a.priority,
        status: a.status,
        sourceQuote: a.sourceQuote,
      })),
      frameCount: note.frames?.length ?? 0,
    };
  });

  return JSON.stringify(result);
}

async function getListing(listingId: string, userId: string, teamId: string): Promise<string> {
  const result = await withRLS(userId, 'authenticated', async (db) => {
    const listing = await db.query.listings.findFirst({
      where: and(eq(listings.id, listingId), eq(listings.teamId, teamId)),
      with: {
        property: true,
        agent: true,
        client: true,
      },
    });

    if (!listing) return { error: 'Listing not found' };

    const listingTasks = await db.query.tasks.findMany({
      where: and(eq(tasks.teamId, teamId), eq(tasks.listingId, listingId)),
    });

    const listingNotes = await db.query.fieldNotes.findMany({
      where: and(eq(fieldNotes.teamId, teamId), eq(fieldNotes.listingId, listingId)),
    });

    const listingContacts = await db.query.contacts.findMany({
      where: eq(contacts.teamId, teamId),
    });

    return {
      id: listing.id,
      phase: listing.phase,
      price: listing.price,
      mlsNumber: listing.mlsNumber,
      description: listing.description,
      daysOnMarket: listing.daysOnMarket,
      underContract: listing.underContract,
      listDate: listing.listDate,
      targetListDate: listing.targetListDate,
      tasksDone: listing.tasksDone,
      tasksTotal: listing.tasksTotal,
      property: listing.property
        ? {
            address: listing.property.address,
            city: listing.property.city,
            state: listing.property.state,
            zip: listing.property.zip,
            beds: listing.property.beds,
            baths: listing.property.baths,
            sqft: listing.property.sqft,
            lotSqft: listing.property.lotSqft,
            yearBuilt: listing.property.yearBuilt,
            propertyType: listing.property.propertyType,
          }
        : null,
      agent: listing.agent?.name,
      client: listing.client
        ? { name: listing.client.name, email: listing.client.email, phone: listing.client.phone }
        : null,
      tasks: listingTasks.map((t) => ({
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
        priority: t.priority,
      })),
      fieldNotes: listingNotes.map((n) => ({
        id: n.id,
        mediaType: n.mediaType,
        summary: n.summary || n.textContent?.slice(0, 100),
        status: n.status,
        createdAt: n.createdAt,
      })),
    };
  });

  return JSON.stringify(result);
}

async function getTasks(
  input: { listing_id?: string; status?: string },
  userId: string,
  teamId: string,
): Promise<string> {
  const result = await withRLS(userId, 'authenticated', async (db) => {
    const conditions = [eq(tasks.teamId, teamId)];
    if (input.listing_id) conditions.push(eq(tasks.listingId, input.listing_id));
    if (input.status === 'overdue') {
      conditions.push(eq(tasks.isOverdue, true));
    } else if (input.status) {
      conditions.push(eq(tasks.status, input.status as any));
    }

    const rows = await db.query.tasks.findMany({
      where: and(...conditions),
      with: { assignee: true, listing: { with: { property: true } } },
      limit: 50,
    });

    return rows.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee?.name ?? null,
      dueDate: t.dueDate,
      taskCategory: t.taskCategory,
      listingAddress: t.listing?.property?.address ?? null,
    }));
  });

  return JSON.stringify(result);
}

async function getContacts(
  input: { type?: string; search?: string },
  userId: string,
  teamId: string,
): Promise<string> {
  const result = await withRLS(userId, 'authenticated', async (db) => {
    const conditions = [eq(contacts.teamId, teamId)];
    if (input.type) conditions.push(eq(contacts.type, input.type as any));
    if (input.search) conditions.push(ilike(contacts.name, `%${input.search}%`));

    const rows = await db.query.contacts.findMany({
      where: and(...conditions),
      limit: 50,
    });

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      email: c.email,
      phone: c.phone,
      company: c.company,
    }));
  });

  return JSON.stringify(result);
}

async function getVendors(
  input: { category?: string; search?: string },
  userId: string,
  teamId: string,
): Promise<string> {
  const result = await withRLS(userId, 'authenticated', async (db) => {
    const conditions = [eq(vendors.teamId, teamId)];
    if (input.category) conditions.push(ilike(vendors.category, `%${input.category}%`));
    if (input.search) conditions.push(ilike(vendors.name, `%${input.search}%`));

    const rows = await db.query.vendors.findMany({
      where: and(...conditions),
      limit: 50,
    });

    return rows.map((v) => ({
      id: v.id,
      name: v.name,
      specialty: v.category,
      rating: v.rating,
      phone: v.phone,
      email: v.email,
    }));
  });

  return JSON.stringify(result);
}

async function searchListings(
  input: { query?: string; phase?: string; min_price?: number; max_price?: number },
  userId: string,
  teamId: string,
): Promise<string> {
  const result = await withRLS(userId, 'authenticated', async (db) => {
    const conditions = [eq(listings.teamId, teamId)];
    if (input.phase) conditions.push(eq(listings.phase, input.phase as any));
    if (input.min_price) conditions.push(gte(listings.price, input.min_price));
    if (input.max_price) conditions.push(lte(listings.price, input.max_price));

    const rows = await db.query.listings.findMany({
      where: and(...conditions),
      with: { property: true, agent: true },
      limit: 50,
    });

    let filtered = rows;
    if (input.query) {
      const q = input.query.toLowerCase();
      filtered = rows.filter(
        (l) =>
          l.property?.address?.toLowerCase().includes(q) ||
          l.property?.city?.toLowerCase().includes(q),
      );
    }

    return filtered.map((l) => ({
      id: l.id,
      address: l.property?.address,
      city: l.property?.city,
      phase: l.phase,
      price: l.price,
      beds: l.property?.beds,
      baths: l.property?.baths,
      sqft: l.property?.sqft,
      agent: l.agent?.name ?? null,
    }));
  });

  return JSON.stringify(result);
}
