import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from './schema/index.js';

const {
  teams,
  teamMembers,
  contacts,
  listings,
  tasks,
  activityItems,
  aiInsights,
  showings,
  offers,
  vendors,
  financialBudgets,
  financialCategories,
  documents,
  compSales,
  quotes,
  quoteLineItems,
  marketingAssets,
  integrations,
  workflowTemplates,
} = schema;

async function main() {
  // Guard: never run seed in production
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed script cannot run in production (NODE_ENV=production).');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  // Truncate all tables for a clean re-seed (cascade handles FK dependencies)
  console.log('  Clearing existing data...');
  await db.execute(sql`TRUNCATE TABLE
    quote_line_items, quotes, financial_categories, financial_budgets,
    marketing_assets, documents, comp_sales, offers, showings,
    ai_insights, activity_items, tasks, listings, contacts,
    vendors, integrations, workflow_templates, team_members, teams
    CASCADE`);

  // ─── ID Maps ────────────────────────────────────────────────────────────
  const teamId = randomUUID();
  const tmMap: Record<string, string> = {};
  const contactMap: Record<string, string> = {};
  const listingMap: Record<string, string> = {};
  const vendorMap: Record<string, string> = {};
  const budgetMap: Record<string, string> = {};
  const quoteMap: Record<string, string> = {};

  // Helper to parse date strings to Date objects
  function parseDate(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00Z');
  }

  function parseTimestamp(tsStr: string): Date {
    return new Date(tsStr);
  }

  // ─── 1. Team ───────────────────────────────────────────────────────────
  console.log('  Creating team...');
  await db.insert(teams).values({
    id: teamId,
    name: 'Reynolds & Associates',
    slug: 'reynolds-associates',
  });

  // ─── 2. Team Members ──────────────────────────────────────────────────
  console.log('  Inserting team members...');
  const teamMemberData = [
    { mockId: 'tm-1', name: 'Lauren Chen', email: 'lauren@hometrack.co', role: 'admin' as const, roleLabel: 'Team Lead / Listing Agent', initials: 'LC' },
    { mockId: 'tm-2', name: 'Marcus Rivera', email: 'marcus@hometrack.co', role: 'listing_agent' as const, roleLabel: 'Listing Agent', initials: 'MR' },
    { mockId: 'tm-3', name: 'Priya Patel', email: 'priya@hometrack.co', role: 'tc' as const, roleLabel: 'Transaction Coordinator', initials: 'PP' },
    { mockId: 'tm-4', name: 'Jordan Nakamura', email: 'jordan@hometrack.co', role: 'marketing' as const, roleLabel: 'Marketing Coordinator', initials: 'JN' },
    { mockId: 'tm-5', name: 'Sofia Andrade', email: 'sofia@hometrack.co', role: 'staging_lead' as const, roleLabel: 'Design & Staging Lead', initials: 'SA' },
  ];

  for (const tm of teamMemberData) {
    const id = randomUUID();
    tmMap[tm.mockId] = id;
    await db.insert(teamMembers).values({
      id,
      teamId,
      name: tm.name,
      email: tm.email,
      role: tm.role,
      roleLabel: tm.roleLabel,
      avatar: '',
      initials: tm.initials,
    });
  }

  // ─── 3. Contacts ──────────────────────────────────────────────────────
  console.log('  Inserting contacts...');
  const contactData = [
    { mockId: 'c-1', name: 'David & Emily Nguyen', email: 'david.nguyen@gmail.com', phone: '(408) 555-1201', type: 'client' as const, initials: 'DN', lastInteraction: 'Discussed staging timeline', lastInteractionDate: '2026-04-07' },
    { mockId: 'c-2', name: 'Rebecca Thornton', email: 'rebecca.t@outlook.com', phone: '(650) 555-3344', type: 'client' as const, initials: 'RT', lastInteraction: 'Approved photography schedule', lastInteractionDate: '2026-04-06' },
    { mockId: 'c-3', name: 'Michael & Lisa Park', email: 'mpark@icloud.com', phone: '(510) 555-8877', type: 'client' as const, initials: 'MP', lastInteraction: 'Reviewed offer comparison', lastInteractionDate: '2026-04-08' },
    { mockId: 'c-4', name: 'Anil Kapoor', email: 'anil.k@yahoo.com', phone: '(408) 555-9012', type: 'client' as const, initials: 'AK', lastInteraction: 'Initial onboarding call', lastInteractionDate: '2026-04-09' },
    { mockId: 'c-5', name: 'Sarah Kim', email: 'sarah.kim@compass.com', phone: '(650) 555-2200', type: 'agent' as const, company: 'Compass', initials: 'SK', lastInteraction: 'Open house conversation', lastInteractionDate: '2026-03-28', buyerNeeds: '4BR in Los Gatos under $2.5M, good schools', marketFocus: 'Los Gatos, Saratoga', relationshipStrength: 4 },
    { mockId: 'c-6', name: 'Brian Foster', email: 'bfoster@serenogroup.com', phone: '(408) 555-7755', type: 'agent' as const, company: 'Sereno Group', initials: 'BF', lastInteraction: 'Showed 456 Oak Ave to client', lastInteractionDate: '2026-04-03', buyerNeeds: 'Downsizer couple, 2-3BR, single story, Los Altos or Mountain View, up to $3M', marketFocus: 'Los Altos, Mountain View, Palo Alto', relationshipStrength: 5 },
    { mockId: 'c-7', name: 'Diana Reyes', email: 'diana@kw.com', phone: '(510) 555-4400', type: 'agent' as const, company: 'Keller Williams', initials: 'DR', lastInteraction: 'Inquiry about 789 Elm St pricing', lastInteractionDate: '2026-04-05', buyerNeeds: 'Tech relocatee family, 4BR+, Cupertino schools, $2-3.5M', marketFocus: 'Cupertino, Sunnyvale', relationshipStrength: 3 },
    { mockId: 'c-8', name: 'Tom Bradley', email: 'tom@bradleyrenovations.com', phone: '(408) 555-6600', type: 'vendor' as const, company: 'Bradley Renovations', initials: 'TB', lastInteraction: 'Completed kitchen update at 123 Main', lastInteractionDate: '2026-03-15' },
    { mockId: 'c-9', name: 'Ana Gonzalez', email: 'ana@meridianstaging.com', phone: '(650) 555-1100', type: 'vendor' as const, company: 'Meridian Home Staging', initials: 'AG', lastInteraction: 'Staging quote for 456 Oak Ave', lastInteractionDate: '2026-04-01' },
    { mockId: 'c-10', name: 'Kevin Tran', email: 'kevin@trangroupphoto.com', phone: '(408) 555-3300', type: 'vendor' as const, company: 'Tran Group Photography', initials: 'KT', lastInteraction: 'Shot photography for 789 Elm St', lastInteractionDate: '2026-04-04' },
    { mockId: 'c-11', name: 'Jennifer Walsh', email: 'jwalsh@firstrepublic.com', phone: '(650) 555-8800', type: 'lender' as const, company: 'First Republic Bank', initials: 'JW', lastInteraction: 'Pre-approval for buyer on 123 Main', lastInteractionDate: '2026-04-02' },
    { mockId: 'c-12', name: 'Robert Cheng', email: 'rcheng@bayareainspect.com', phone: '(510) 555-2299', type: 'inspector' as const, company: 'Bay Area Property Inspections', initials: 'RC', lastInteraction: 'Inspection report for 456 Oak Ave', lastInteractionDate: '2026-03-20' },
  ];

  for (const c of contactData) {
    const id = randomUUID();
    contactMap[c.mockId] = id;
    await db.insert(contacts).values({
      id,
      teamId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      type: c.type,
      company: 'company' in c ? c.company : undefined,
      initials: c.initials,
      lastInteraction: c.lastInteraction,
      lastInteractionDate: parseDate(c.lastInteractionDate),
      buyerNeeds: 'buyerNeeds' in c ? c.buyerNeeds : undefined,
      marketFocus: 'marketFocus' in c ? c.marketFocus : undefined,
      relationshipStrength: 'relationshipStrength' in c ? (c as { relationshipStrength: number }).relationshipStrength : undefined,
    });
  }

  // ─── 4. Listings ──────────────────────────────────────────────────────
  console.log('  Inserting listings...');
  const listingData = [
    { mockId: 'l-1', address: '123 Main Street', city: 'Los Gatos', state: 'CA', zip: '95030', price: 2495000, beds: 4, baths: 3, sqft: 2850, lotSqft: 8500, yearBuilt: 1965, propertyType: 'Single Family', mlsNumber: 'ML81928374', phase: 'active' as const, underContract: false, daysInPhase: 5, daysOnMarket: 5, listDate: '2026-04-04', targetListDate: '2026-04-04', agentMock: 'tm-1', clientMock: 'c-1', photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop'], lat: 37.2358, lng: -121.9624, tasksDone: 18, tasksTotal: 24, documentsCount: 14, showingsCount: 8, offersCount: 2, zillowViews: 1243, zillowSaves: 67, description: 'Beautifully remodeled ranch-style home in the heart of Los Gatos.', features: ['Remodeled kitchen', 'Hardwood floors', 'Private backyard', 'Two-car garage', 'Central AC', 'Smart home'] },
    { mockId: 'l-2', address: '456 Oak Avenue', city: 'Palo Alto', state: 'CA', zip: '94301', price: 3850000, beds: 5, baths: 4, sqft: 3600, lotSqft: 12000, yearBuilt: 1952, propertyType: 'Single Family', mlsNumber: 'ML81935521', phase: 'active' as const, underContract: false, daysInPhase: 12, daysOnMarket: 18, listDate: '2026-03-22', targetListDate: '2026-03-20', agentMock: 'tm-1', clientMock: 'c-2', photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop'], lat: 37.4419, lng: -122.1430, tasksDone: 22, tasksTotal: 28, documentsCount: 18, showingsCount: 15, offersCount: 0, zillowViews: 2890, zillowSaves: 142, description: 'Stately Old Palo Alto home on a tree-lined street.', features: ['Pool & spa', "Chef's kitchen", 'Home office', 'Wine cellar', 'Outdoor kitchen', 'Oak-lined lot'] },
    { mockId: 'l-3', address: '789 Elm Street', city: 'Cupertino', state: 'CA', zip: '95014', price: 2150000, beds: 3, baths: 2, sqft: 1850, lotSqft: 6200, yearBuilt: 1978, propertyType: 'Single Family', mlsNumber: 'ML81940112', phase: 'pre_market' as const, underContract: false, daysInPhase: 4, daysOnMarket: 0, listDate: null, targetListDate: '2026-04-18', agentMock: 'tm-2', clientMock: 'c-3', photoUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=600&fit=crop'], lat: 37.3230, lng: -122.0322, tasksDone: 12, tasksTotal: 20, documentsCount: 8, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, description: 'Well-maintained Cupertino home in top-rated school district.', features: ['Top schools', 'New roof', 'Updated baths', 'Open floor plan', 'Near Apple Park'] },
    { mockId: 'l-4', address: '2200 Willow Glen Way', city: 'San Jose', state: 'CA', zip: '95125', price: 1695000, beds: 3, baths: 2, sqft: 1620, lotSqft: 5800, yearBuilt: 1940, propertyType: 'Single Family', mlsNumber: 'ML81942889', phase: 'pre_market' as const, underContract: false, daysInPhase: 8, daysOnMarket: 0, listDate: null, targetListDate: '2026-04-25', agentMock: 'tm-2', clientMock: 'c-3', photoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600573472572-8aba140b2c78?w=800&h=600&fit=crop'], lat: 37.2969, lng: -121.9008, tasksDone: 8, tasksTotal: 16, documentsCount: 5, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, description: 'Classic Willow Glen charmer with period details.', features: ['Period details', 'Walkable', 'Detached garage', 'Breakfast nook', 'Mature garden'] },
    { mockId: 'l-5', address: '1580 University Avenue', city: 'Mountain View', state: 'CA', zip: '94040', price: 1295000, beds: 2, baths: 2, sqft: 1200, lotSqft: 4500, yearBuilt: 1955, propertyType: 'Townhouse', mlsNumber: 'ML81945003', phase: 'pre_market' as const, underContract: false, daysInPhase: 2, daysOnMarket: 0, listDate: null, targetListDate: '2026-05-10', agentMock: 'tm-1', clientMock: 'c-4', photoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753376-12c8ab7c5a38?w=800&h=600&fit=crop'], lat: 37.3861, lng: -122.0839, tasksDone: 2, tasksTotal: 12, documentsCount: 1, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, description: 'Light-filled Mountain View townhome near downtown and Caltrain.', features: ['Near Caltrain', 'Modern finishes', 'In-unit laundry', 'Private patio', 'EV charging'] },
    { mockId: 'l-6', address: '945 Cherry Blossom Lane', city: 'Saratoga', state: 'CA', zip: '95070', price: 3200000, beds: 5, baths: 3.5, sqft: 3200, lotSqft: 15000, yearBuilt: 1988, propertyType: 'Single Family', mlsNumber: 'ML81930445', phase: 'active' as const, underContract: false, daysInPhase: 3, daysOnMarket: 28, listDate: '2026-03-12', targetListDate: '2026-03-10', agentMock: 'tm-1', clientMock: 'c-3', photoUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop'], lat: 37.2638, lng: -122.0230, tasksDone: 25, tasksTotal: 30, documentsCount: 22, showingsCount: 21, offersCount: 3, zillowViews: 4100, zillowSaves: 198, description: 'Prestigious Saratoga estate on nearly half an acre.', features: ['Pool & spa', 'Half-acre lot', 'Gourmet kitchen', 'Outdoor fireplace', 'Saratoga schools', '3-car garage'] },
    { mockId: 'l-7', address: '310 Waverly Street', city: 'Menlo Park', state: 'CA', zip: '94025', price: 2875000, beds: 4, baths: 3, sqft: 2400, lotSqft: 7200, yearBuilt: 1948, propertyType: 'Single Family', mlsNumber: 'ML81925100', phase: 'active' as const, underContract: true, daysInPhase: 10, daysOnMarket: 35, listDate: '2026-03-05', targetListDate: '2026-03-05', agentMock: 'tm-2', clientMock: 'c-2', photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop'], lat: 37.4530, lng: -122.1817, tasksDone: 28, tasksTotal: 32, documentsCount: 26, showingsCount: 18, offersCount: 4, zillowViews: 3200, zillowSaves: 155, description: 'Charming mid-century Menlo Park home with thoughtful updates.', features: ['Near Stanford', 'Designer kitchen', 'Heritage redwood', 'Updated systems', 'Attached ADU potential'] },
    { mockId: 'l-8', address: '88 Sunnyvale Avenue', city: 'Sunnyvale', state: 'CA', zip: '94086', price: 895000, beds: 2, baths: 1, sqft: 980, lotSqft: 3500, yearBuilt: 1960, propertyType: 'Condo', mlsNumber: 'ML81946220', phase: 'pre_market' as const, underContract: false, daysInPhase: 6, daysOnMarket: 0, listDate: null, targetListDate: '2026-05-01', agentMock: 'tm-2', clientMock: 'c-4', photoUrl: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800&h=600&fit=crop'], lat: 37.3688, lng: -122.0363, tasksDone: 4, tasksTotal: 14, documentsCount: 3, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, description: 'Opportunity in Sunnyvale - investor-owned condo ready for cosmetic updates.', features: ['In-unit laundry', 'Assigned parking', 'Near Murphy Ave', 'Community pool'] },
  ];

  for (const l of listingData) {
    const id = randomUUID();
    listingMap[l.mockId] = id;
    await db.insert(listings).values({
      id,
      teamId,
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      price: l.price,
      beds: l.beds,
      baths: l.baths,
      sqft: l.sqft,
      lotSqft: l.lotSqft,
      yearBuilt: l.yearBuilt,
      propertyType: l.propertyType,
      mlsNumber: l.mlsNumber,
      phase: l.phase,
      underContract: l.underContract,
      daysInPhase: l.daysInPhase,
      daysOnMarket: l.daysOnMarket,
      listDate: l.listDate ? parseDate(l.listDate) : null,
      targetListDate: parseDate(l.targetListDate),
      agentId: tmMap[l.agentMock],
      clientId: contactMap[l.clientMock],
      photoUrl: l.photoUrl,
      photos: l.photos,
      lat: l.lat,
      lng: l.lng,
      tasksDone: l.tasksDone,
      tasksTotal: l.tasksTotal,
      documentsCount: l.documentsCount,
      showingsCount: l.showingsCount,
      offersCount: l.offersCount,
      zillowViews: l.zillowViews,
      zillowSaves: l.zillowSaves,
      description: l.description,
      features: l.features,
    });
  }

  // ─── 5. Tasks ─────────────────────────────────────────────────────────
  console.log('  Inserting tasks...');
  const taskData = [
    { mockId: 't-1', title: 'Review and approve listing photography', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-10', isOverdue: false },
    { mockId: 't-2', title: 'Submit TDS to title company', status: 'overdue' as const, priority: 'urgent' as const, assigneeMock: 'tm-3', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-05', isOverdue: true },
    { mockId: 't-3', title: 'Schedule professional photography', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-04-12', isOverdue: false },
    { mockId: 't-4', title: 'Coordinate staging furniture delivery', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-5', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'staging' as const, dueDate: '2026-04-15', isOverdue: false, subtasks: [{ title: 'Confirm delivery window with Meridian', done: true }, { title: 'Arrange parking for delivery truck', done: false }, { title: 'Client walkthrough post-staging', done: false }] },
    { mockId: 't-5', title: 'Draft MLS listing copy', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-04-14', isOverdue: false },
    { mockId: 't-6', title: 'Collect contractor quotes for bathroom update', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-5', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-11', isOverdue: false },
    { mockId: 't-7', title: 'Review and counter offer from Westfield Group', status: 'todo' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-10', isOverdue: false },
    { mockId: 't-8', title: 'Order NHD report', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-3', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-08', isOverdue: false },
    { mockId: 't-9', title: 'Send weekly showing feedback summary to client', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-10', isOverdue: false },
    { mockId: 't-10', title: 'Schedule home inspection', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'escrow' as const, dueDate: '2026-04-12', isOverdue: false },
    { mockId: 't-11', title: 'Prepare client onboarding packet', status: 'todo' as const, priority: 'low' as const, assigneeMock: 'tm-1', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-14', isOverdue: false },
    { mockId: 't-12', title: 'Update social media ads for Open House', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-08', isOverdue: false },
  ];

  for (const t of taskData) {
    await db.insert(tasks).values({
      id: randomUUID(),
      teamId,
      listingId: listingMap[t.listingMock],
      title: t.title,
      status: t.status,
      priority: t.priority,
      assigneeId: tmMap[t.assigneeMock],
      phase: t.phase,
      taskCategory: t.taskCategory,
      dueDate: parseDate(t.dueDate),
      isOverdue: t.isOverdue,
      subtasks: 'subtasks' in t ? t.subtasks : undefined,
    });
  }

  // ─── 6. Activity Items ────────────────────────────────────────────────
  console.log('  Inserting activity items...');
  // Map author names to team member mock IDs (where applicable)
  const authorToMock: Record<string, string> = {
    'Lauren Chen': 'tm-1',
    'Marcus Rivera': 'tm-2',
    'Priya Patel': 'tm-3',
    'Jordan Nakamura': 'tm-4',
    'Sofia Andrade': 'tm-5',
  };

  const activityData = [
    { mockId: 'a-1', type: 'message' as const, authorName: 'David Nguyen', authorInitials: 'DN', timestamp: '2026-04-09T09:15:00', content: 'Hi Lauren, can we discuss the open house schedule for this weekend? We had some feedback from the neighbors about parking.', listingMock: 'l-1' },
    { mockId: 'a-2', type: 'system' as const, authorName: 'System', authorInitials: 'HT', timestamp: '2026-04-09T08:30:00', content: 'New showing request from Brian Foster (Sereno Group) for April 11 at 2:00 PM.', listingMock: 'l-2' },
    { mockId: 'a-3', type: 'email' as const, authorName: 'Rebecca Thornton', authorInitials: 'RT', timestamp: '2026-04-09T07:45:00', content: 'RE: Photography Schedule — Looks great! I approved the twilight shoot for Thursday.', listingMock: 'l-2', metadata: { subject: 'RE: Photography Schedule' } },
    { mockId: 'a-4', type: 'voice_memo' as const, authorName: 'Lauren Chen', authorInitials: 'LC', timestamp: '2026-04-08T17:30:00', content: 'Quick note after showing at 123 Main — buyer seemed very interested in the remodeled kitchen.', listingMock: 'l-1', metadata: { duration: '0:42' } },
    { mockId: 'a-5', type: 'task_complete' as const, authorName: 'Jordan Nakamura', authorInitials: 'JN', timestamp: '2026-04-08T16:00:00', content: 'Completed task: Update social media ads for Open House', listingMock: 'l-1' },
    { mockId: 'a-6', type: 'note' as const, authorName: 'Marcus Rivera', authorInitials: 'MR', timestamp: '2026-04-08T14:20:00', content: 'Spoke with Diana Reyes — she has a tech relocation client looking in Cupertino.', listingMock: 'l-3' },
    { mockId: 'a-7', type: 'phase_change' as const, authorName: 'System', authorInitials: 'HT', timestamp: '2026-04-08T10:00:00', content: 'Listing moved from Pre-Market to Active.', listingMock: 'l-2' },
    { mockId: 'a-8', type: 'message' as const, authorName: 'Michael Park', authorInitials: 'MP', timestamp: '2026-04-08T09:00:00', content: 'We reviewed the three offers on Cherry Blossom. The Westfield Group offer is strongest but the contingency timeline concerns us.', listingMock: 'l-6' },
    { mockId: 'a-9', type: 'email' as const, authorName: 'Tom Bradley', authorInitials: 'TB', timestamp: '2026-04-07T15:00:00', content: 'Hi Sofia, the bathroom renovation quote for 88 Sunnyvale is attached. Total comes to $12,400 including fixtures.', listingMock: 'l-8', metadata: { subject: 'Bathroom Renovation Quote - 88 Sunnyvale' } },
    { mockId: 'a-10', type: 'ai_insight' as const, authorName: 'HomeTrack', authorInitials: 'HT', timestamp: '2026-04-09T06:00:00', content: 'Showing volume for 456 Oak Ave has dropped 30% this week compared to last.', listingMock: 'l-2' },
  ];

  for (const a of activityData) {
    const authorId = authorToMock[a.authorName] ? tmMap[authorToMock[a.authorName]] : null;
    await db.insert(activityItems).values({
      id: randomUUID(),
      teamId,
      listingId: listingMap[a.listingMock],
      type: a.type,
      authorId,
      authorName: a.authorName,
      authorInitials: a.authorInitials,
      content: a.content,
      metadata: 'metadata' in a ? a.metadata : undefined,
      timestamp: parseTimestamp(a.timestamp),
    });
  }

  // ─── 7. AI Insights ───────────────────────────────────────────────────
  console.log('  Inserting AI insights...');
  const insightData = [
    { type: 'connection' as const, title: 'Buyer match found', description: "Sarah Kim's buyer (4BR, Los Gatos, under $2.5M, good schools) matches your new listing at 123 Main Street.", listingMock: 'l-1', actionLabel: 'Message Sarah Kim', actionUrl: '/contacts/c-5', timestamp: '2026-04-09T06:00:00', dismissed: false },
    { type: 'anomaly' as const, title: 'Showing interest declining', description: 'Showing volume for 456 Oak Ave dropped 30% week-over-week.', listingMock: 'l-2', actionLabel: 'View analytics', actionUrl: '/listings/l-2/analytics', timestamp: '2026-04-09T06:00:00', dismissed: false },
    { type: 'warning' as const, title: 'Unanswered client message', description: 'David Nguyen asked about the open house parking situation 2 hours ago.', listingMock: 'l-1', actionLabel: 'Reply now', actionUrl: '/listings/l-1/activity', timestamp: '2026-04-09T11:00:00', dismissed: false },
    { type: 'recommendation' as const, title: 'Pricing recommendation', description: 'Based on 6 comparable sales, the suggested list price range for 789 Elm Street is $2,050,000-$2,200,000.', listingMock: 'l-3', actionLabel: 'View comps', actionUrl: '/analytics', timestamp: '2026-04-08T12:00:00', dismissed: false },
    { type: 'connection' as const, title: 'Agent match for upcoming listing', description: "Diana Reyes has a tech relocatee buyer looking for 4BR+ in Cupertino.", listingMock: 'l-3', actionLabel: 'View agent profile', actionUrl: '/contacts/c-7', timestamp: '2026-04-08T14:00:00', dismissed: false },
    { type: 'recommendation' as const, title: 'Optimal listing timing', description: 'Based on seasonal patterns, listing 789 Elm Street in the next 10 days positions you ahead of 3 comparable properties.', listingMock: 'l-3', timestamp: '2026-04-08T06:00:00', dismissed: false },
  ];

  for (const i of insightData) {
    await db.insert(aiInsights).values({
      id: randomUUID(),
      teamId,
      listingId: listingMap[i.listingMock],
      type: i.type,
      title: i.title,
      description: i.description,
      actionLabel: 'actionLabel' in i ? i.actionLabel : undefined,
      actionUrl: 'actionUrl' in i ? i.actionUrl : undefined,
      dismissed: i.dismissed,
      timestamp: parseTimestamp(i.timestamp),
    });
  }

  // ─── 8. Showings ──────────────────────────────────────────────────────
  console.log('  Inserting showings...');
  const showingData = [
    { listingMock: 'l-1', date: '2026-04-08', time: '2:00 PM', agentName: 'Brian Foster', agentCompany: 'Sereno Group', buyerType: 'Downsizer couple', feedback: 'Loved the kitchen remodel and backyard. Concern about street noise.', rating: 4, interestedLevel: 'very' as const },
    { listingMock: 'l-1', date: '2026-04-07', time: '10:00 AM', agentName: 'Diana Reyes', agentCompany: 'Keller Williams', buyerType: 'Tech family relocating', feedback: 'Good layout but they need a 4th bedroom. The bonus room could work.', rating: 3, interestedLevel: 'somewhat' as const },
    { listingMock: 'l-2', date: '2026-04-08', time: '4:00 PM', agentName: 'Sarah Kim', agentCompany: 'Compass', buyerType: 'Move-up buyer', feedback: 'Beautiful property. Buyers love the lot size. Concern about dated bathrooms.', rating: 4, interestedLevel: 'very' as const },
    { listingMock: 'l-2', date: '2026-04-06', time: '1:00 PM', agentName: 'Unknown Agent', agentCompany: 'Open House Walk-in', buyerType: 'First-time buyer', feedback: 'Just browsing the neighborhood. Price is out of their range.', rating: 2, interestedLevel: 'not' as const },
    { listingMock: 'l-6', date: '2026-04-05', time: '11:00 AM', agentName: 'Brian Foster', agentCompany: 'Sereno Group', buyerType: 'Luxury upgrade', feedback: 'Strong interest. Love the lot and the Saratoga schools.', rating: 5, interestedLevel: 'very' as const },
  ];

  for (const s of showingData) {
    await db.insert(showings).values({
      id: randomUUID(),
      teamId,
      listingId: listingMap[s.listingMock],
      date: parseDate(s.date),
      time: s.time,
      agentName: s.agentName,
      agentCompany: s.agentCompany,
      buyerType: s.buyerType,
      feedback: s.feedback,
      rating: s.rating,
      interestedLevel: s.interestedLevel,
    });
  }

  // ─── 9. Offers ────────────────────────────────────────────────────────
  console.log('  Inserting offers...');
  const offerData = [
    { listingMock: 'l-6', buyerName: 'The Westfield Group', buyerAgent: 'Brian Foster', price: 3150000, earnestDeposit: 100000, contingencies: ['Inspection (10 days)', 'Appraisal'], closeDate: '2026-05-15', financingType: 'Conventional 20% down', status: 'reviewed' as const, submittedDate: '2026-04-07', expirationDate: '2026-04-11', notes: 'Strong buyers, pre-approved. Willing to be flexible on close date.' },
    { listingMock: 'l-6', buyerName: 'Yun & Associates Trust', buyerAgent: 'Sarah Kim', price: 3275000, earnestDeposit: 150000, contingencies: ['Inspection (7 days)'], closeDate: '2026-05-08', financingType: 'All cash', status: 'reviewed' as const, submittedDate: '2026-04-08', expirationDate: '2026-04-12', notes: 'All-cash offer. Fast close. No appraisal contingency.' },
    { listingMock: 'l-6', buyerName: 'Pham Family', buyerAgent: 'Diana Reyes', price: 3100000, earnestDeposit: 80000, contingencies: ['Inspection (14 days)', 'Appraisal', 'Loan (21 days)'], closeDate: '2026-05-30', financingType: 'Conventional 15% down', status: 'received' as const, submittedDate: '2026-04-09', expirationDate: '2026-04-13', notes: 'First-time move-up buyers. Extended contingency timelines.' },
    { listingMock: 'l-1', buyerName: 'Chen-Williams', buyerAgent: 'Brian Foster', price: 2450000, earnestDeposit: 75000, contingencies: ['Inspection (10 days)', 'Appraisal'], closeDate: '2026-05-20', financingType: 'Conventional 25% down', status: 'received' as const, submittedDate: '2026-04-09', expirationDate: '2026-04-13', notes: 'Downsizer couple. Very motivated. Flexible on timeline.' },
    { listingMock: 'l-1', buyerName: 'Johnson Trust', buyerAgent: 'Unknown', price: 2400000, earnestDeposit: 50000, contingencies: ['Inspection (14 days)', 'Appraisal', 'Loan (17 days)'], closeDate: '2026-06-01', financingType: 'Jumbo loan 10% down', status: 'received' as const, submittedDate: '2026-04-08', expirationDate: '2026-04-12', notes: 'First offer received. Some contingency concerns.' },
  ];

  for (const o of offerData) {
    await db.insert(offers).values({
      id: randomUUID(),
      teamId,
      listingId: listingMap[o.listingMock],
      buyerName: o.buyerName,
      buyerAgent: o.buyerAgent,
      price: o.price,
      earnestDeposit: o.earnestDeposit,
      contingencies: o.contingencies,
      closeDate: parseDate(o.closeDate),
      financingType: o.financingType,
      status: o.status,
      submittedDate: parseDate(o.submittedDate),
      expirationDate: parseDate(o.expirationDate),
      notes: o.notes,
    });
  }

  // ─── 10. Vendors ──────────────────────────────────────────────────────
  console.log('  Inserting vendors...');
  const vendorData = [
    { mockId: 'v-1', name: 'Tom Bradley', company: 'Bradley Renovations', category: 'contractor', phone: '(408) 555-6600', email: 'tom@bradleyrenovations.com', initials: 'TB', rating: 4.8, reliabilityScore: 95, avgResponseTime: '< 4 hours', projectsCompleted: 12, avgCost: '$8,500', serviceArea: 'South Bay, Peninsula', specialties: ['Kitchen remodels', 'Bathroom updates', 'Flooring', 'Paint'] },
    { mockId: 'v-2', name: 'Ana Gonzalez', company: 'Meridian Home Staging', category: 'stager', phone: '(650) 555-1100', email: 'ana@meridianstaging.com', initials: 'AG', rating: 4.9, reliabilityScore: 98, avgResponseTime: '< 2 hours', projectsCompleted: 18, avgCost: '$6,200', serviceArea: 'Bay Area wide', specialties: ['Luxury staging', 'Vacant staging', 'Occupied consultation', 'Virtual staging'] },
    { mockId: 'v-3', name: 'Kevin Tran', company: 'Tran Group Photography', category: 'photographer', phone: '(408) 555-3300', email: 'kevin@trangroupphoto.com', initials: 'KT', rating: 5.0, reliabilityScore: 100, avgResponseTime: '< 1 hour', projectsCompleted: 24, avgCost: '$1,800', serviceArea: 'Bay Area wide', specialties: ['Aerial drone', 'Twilight shoots', 'Video tours', '3D Matterport'] },
    { mockId: 'v-4', name: 'Robert Cheng', company: 'Bay Area Property Inspections', category: 'inspector', phone: '(510) 555-2299', email: 'rcheng@bayareainspect.com', initials: 'RC', rating: 4.7, reliabilityScore: 92, avgResponseTime: '< 6 hours', projectsCompleted: 8, avgCost: '$650', serviceArea: 'East Bay, South Bay', specialties: ['Full home inspection', 'Pest/termite', 'Foundation', 'Roof certification'] },
    { mockId: 'v-5', name: 'Maria Santos', company: 'Green Thumb Landscaping', category: 'landscaper', phone: '(408) 555-9911', email: 'maria@greenthumbland.com', initials: 'MS', rating: 4.6, reliabilityScore: 88, avgResponseTime: '< 12 hours', projectsCompleted: 6, avgCost: '$3,200', serviceArea: 'South Bay', specialties: ['Curb appeal', 'Drought-tolerant', 'Lawn installation', 'Hardscaping'] },
    { mockId: 'v-6', name: 'David Park', company: 'Park Painting Co.', category: 'painter', phone: '(650) 555-4422', email: 'david@parkpainting.com', initials: 'DP', rating: 4.5, reliabilityScore: 90, avgResponseTime: '< 8 hours', projectsCompleted: 10, avgCost: '$4,500', serviceArea: 'Peninsula, South Bay', specialties: ['Interior painting', 'Exterior painting', 'Cabinet refinishing', 'Wallpaper removal'] },
  ];

  for (const v of vendorData) {
    const id = randomUUID();
    vendorMap[v.mockId] = id;
    await db.insert(vendors).values({
      id,
      teamId,
      name: v.name,
      company: v.company,
      category: v.category,
      phone: v.phone,
      email: v.email,
      initials: v.initials,
      rating: v.rating,
      reliabilityScore: v.reliabilityScore,
      avgResponseTime: v.avgResponseTime,
      projectsCompleted: v.projectsCompleted,
      avgCost: v.avgCost,
      serviceArea: v.serviceArea,
      specialties: v.specialties,
    });
  }

  // ─── 11. Financials ───────────────────────────────────────────────────
  console.log('  Inserting financial budgets...');
  const financialData = [
    {
      listingMock: 'l-1', totalBudget: 28000, spent: 22400, remaining: 5600, pendingQuotes: 0,
      categories: [
        { name: 'Kitchen Update', budgeted: 12000, actual: 11200, variance: 800 },
        { name: 'Staging', budgeted: 6500, actual: 6200, variance: 300 },
        { name: 'Photography & Video', budgeted: 2500, actual: 1800, variance: 700 },
        { name: 'Marketing & Ads', budgeted: 3000, actual: 2200, variance: 800 },
        { name: 'Landscaping', budgeted: 4000, actual: 1000, variance: 3000 },
      ],
    },
    {
      listingMock: 'l-2', totalBudget: 45000, spent: 38500, remaining: 6500, pendingQuotes: 1,
      categories: [
        { name: 'Full Renovation', budgeted: 25000, actual: 24000, variance: 1000 },
        { name: 'Staging (Luxury)', budgeted: 9000, actual: 8500, variance: 500 },
        { name: 'Photography & Drone', budgeted: 3500, actual: 3200, variance: 300 },
        { name: 'Marketing & Ads', budgeted: 5000, actual: 2800, variance: 2200 },
        { name: 'Landscaping', budgeted: 2500, actual: 0, variance: 2500 },
      ],
    },
  ];

  for (const f of financialData) {
    const budgetId = randomUUID();
    budgetMap[f.listingMock] = budgetId;
    await db.insert(financialBudgets).values({
      id: budgetId,
      teamId,
      listingId: listingMap[f.listingMock],
      totalBudget: f.totalBudget,
      spent: f.spent,
      remaining: f.remaining,
      pendingQuotes: f.pendingQuotes,
    });

    for (const cat of f.categories) {
      await db.insert(financialCategories).values({
        id: randomUUID(),
        budgetId,
        name: cat.name,
        budgeted: cat.budgeted,
        actual: cat.actual,
        variance: cat.variance,
      });
    }
  }

  // ─── 12. Documents ────────────────────────────────────────────────────
  console.log('  Inserting documents...');
  // Map uploadedBy names to team member mock IDs
  const uploaderMap: Record<string, string> = {
    'Priya Patel': 'tm-3',
    'Robert Cheng': 'tm-3', // not a team member, but let's map to Priya for FK
    'Lauren Chen': 'tm-1',
    'Kevin Tran': 'tm-4', // not a team member, map to Jordan
    'Jordan Nakamura': 'tm-4',
    'Marcus Rivera': 'tm-2',
    'Sofia Andrade': 'tm-5',
  };

  const docData = [
    { name: 'Transfer Disclosure Statement (TDS)', category: 'disclosures' as const, listingMock: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-28', fileSize: '245 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Seller Property Questionnaire (SPQ)', category: 'disclosures' as const, listingMock: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-28', fileSize: '180 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Natural Hazard Disclosure (NHD)', category: 'disclosures' as const, listingMock: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-30', fileSize: '1.2 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    { name: 'Home Inspection Report', category: 'inspection' as const, listingMock: 'l-1', uploadedBy: 'Robert Cheng', uploadedDate: '2026-03-25', fileSize: '3.8 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    { name: 'Pest Inspection Report', category: 'inspection' as const, listingMock: 'l-1', uploadedBy: 'Robert Cheng', uploadedDate: '2026-03-25', fileSize: '890 KB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    { name: 'Listing Agreement', category: 'contracts' as const, listingMock: 'l-1', uploadedBy: 'Lauren Chen', uploadedDate: '2026-03-20', fileSize: '320 KB', fileType: 'PDF', status: 'signed' as const, version: 2 },
    { name: 'MLS Photo Package', category: 'photos' as const, listingMock: 'l-1', uploadedBy: 'Kevin Tran', uploadedDate: '2026-04-02', fileSize: '48 MB', fileType: 'ZIP', status: 'complete' as const, version: 1 },
    { name: 'Property Brochure', category: 'marketing' as const, listingMock: 'l-1', uploadedBy: 'Jordan Nakamura', uploadedDate: '2026-04-03', fileSize: '5.2 MB', fileType: 'PDF', status: 'complete' as const, version: 3 },
    { name: 'Purchase Agreement - Chen-Williams', category: 'contracts' as const, listingMock: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-09', fileSize: '420 KB', fileType: 'PDF', status: 'pending_signature' as const, version: 1 },
    { name: 'Preliminary Title Report', category: 'title' as const, listingMock: 'l-2', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-18', fileSize: '2.1 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    { name: 'HOA Documents Package', category: 'disclosures' as const, listingMock: 'l-8', uploadedBy: 'Marcus Rivera', uploadedDate: '2026-04-05', fileSize: '8.5 MB', fileType: 'PDF', status: 'draft' as const, version: 1 },
    { name: 'Renovation Scope of Work', category: 'other' as const, listingMock: 'l-8', uploadedBy: 'Sofia Andrade', uploadedDate: '2026-04-06', fileSize: '1.4 MB', fileType: 'PDF', status: 'draft' as const, version: 2 },
  ];

  for (const d of docData) {
    const uploaderId = uploaderMap[d.uploadedBy] ? tmMap[uploaderMap[d.uploadedBy]] : null;
    await db.insert(documents).values({
      id: randomUUID(),
      teamId,
      listingId: listingMap[d.listingMock],
      name: d.name,
      category: d.category,
      uploadedById: uploaderId,
      uploadedDate: parseDate(d.uploadedDate),
      fileSize: d.fileSize,
      fileType: d.fileType,
      status: d.status,
      version: d.version,
    });
  }

  // ─── 13. Comp Sales ───────────────────────────────────────────────────
  console.log('  Inserting comp sales...');
  const compData = [
    { address: '145 Main Street', city: 'Los Gatos', price: 2380000, sqft: 2650, pricePerSqft: 898, beds: 4, baths: 3, saleDate: '2026-02-15', daysOnMarket: 12, distance: '0.2 mi', adjustedValue: 2460000, adjustments: [{ label: 'Larger lot', amount: 30000 }, { label: 'Updated kitchen', amount: 50000 }], photoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop', lat: 37.2365, lng: -121.9610 },
    { address: '88 University Avenue', city: 'Los Gatos', price: 2550000, sqft: 2900, pricePerSqft: 879, beds: 4, baths: 3, saleDate: '2026-01-28', daysOnMarket: 8, distance: '0.4 mi', adjustedValue: 2510000, adjustments: [{ label: 'Slightly larger', amount: -40000 }], photoUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop', lat: 37.2340, lng: -121.9650 },
    { address: '302 Tait Avenue', city: 'Los Gatos', price: 2650000, sqft: 3100, pricePerSqft: 855, beds: 4, baths: 3.5, saleDate: '2026-03-02', daysOnMarket: 15, distance: '0.5 mi', adjustedValue: 2520000, adjustments: [{ label: 'Extra half bath', amount: -20000 }, { label: 'Larger sqft', amount: -110000 }], photoUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop', lat: 37.2380, lng: -121.9580 },
    { address: '75 Edelen Avenue', city: 'Los Gatos', price: 2290000, sqft: 2500, pricePerSqft: 916, beds: 3, baths: 2.5, saleDate: '2026-02-20', daysOnMarket: 21, distance: '0.3 mi', adjustedValue: 2430000, adjustments: [{ label: 'Fewer beds', amount: 80000 }, { label: 'Smaller sqft', amount: 60000 }], photoUrl: 'https://images.unsplash.com/photo-1600573472572-8aba140b2c78?w=400&h=300&fit=crop', lat: 37.2345, lng: -121.9635 },
    { address: '1120 Arroyo Seco', city: 'Los Gatos', price: 2425000, sqft: 2750, pricePerSqft: 882, beds: 4, baths: 2.5, saleDate: '2026-03-10', daysOnMarket: 10, distance: '0.6 mi', adjustedValue: 2490000, adjustments: [{ label: 'Half bath less', amount: 15000 }, { label: 'Newer build', amount: 50000 }], photoUrl: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=400&h=300&fit=crop', lat: 37.2320, lng: -121.9590 },
  ];

  for (const c of compData) {
    await db.insert(compSales).values({
      id: randomUUID(),
      teamId,
      address: c.address,
      city: c.city,
      price: c.price,
      sqft: c.sqft,
      pricePerSqft: c.pricePerSqft,
      beds: c.beds,
      baths: c.baths,
      saleDate: parseDate(c.saleDate),
      daysOnMarket: c.daysOnMarket,
      distance: c.distance,
      adjustedValue: c.adjustedValue,
      adjustments: c.adjustments,
      photoUrl: c.photoUrl,
      lat: c.lat,
      lng: c.lng,
    });
  }

  // ─── 14. Quotes & Line Items ──────────────────────────────────────────
  console.log('  Inserting quotes...');
  const quoteData = [
    { mockId: 'q-1', vendorMock: 'v-1', listingMock: 'l-8', scope: 'Bathroom renovation', amount: 12400, status: 'received' as const, requestedDate: '2026-04-03', receivedDate: '2026-04-07', validUntil: '2026-04-21', notes: 'Can start as early as next Monday if approved', lineItems: [{ description: 'Demo & haul', amount: 1800 }, { description: 'Plumbing rough-in', amount: 2200 }, { description: 'Tile & grout', amount: 3400 }, { description: 'Vanity & fixtures', amount: 3200 }, { description: 'Paint & trim', amount: 1800 }] },
    { mockId: 'q-2', vendorMock: 'v-2', listingMock: 'l-4', scope: 'Full vacant staging (2 months)', amount: 5800, status: 'approved' as const, requestedDate: '2026-03-28', receivedDate: '2026-03-29', validUntil: '2026-04-15', lineItems: [{ description: 'Staging design', amount: 800 }, { description: 'Furniture rental (2 mo)', amount: 3600 }, { description: 'Delivery & install', amount: 700 }, { description: 'De-stage & pickup', amount: 700 }] },
    { mockId: 'q-3', vendorMock: 'v-3', listingMock: 'l-3', scope: 'Full photo + video package', amount: 2200, status: 'approved' as const, requestedDate: '2026-04-05', receivedDate: '2026-04-05', validUntil: '2026-04-20', lineItems: [{ description: 'Professional photos (40+)', amount: 800 }, { description: 'Drone aerial (8 shots)', amount: 400 }, { description: 'Video walkthrough (2 min)', amount: 600 }, { description: 'Twilight shoot', amount: 400 }] },
    { mockId: 'q-4', vendorMock: 'v-5', listingMock: 'l-1', scope: 'Curb appeal package', amount: 3800, status: 'requested' as const, requestedDate: '2026-04-08', lineItems: [] },
    { mockId: 'q-5', vendorMock: 'v-6', listingMock: 'l-8', scope: 'Interior repaint - full unit', amount: 4200, status: 'received' as const, requestedDate: '2026-04-04', receivedDate: '2026-04-06', validUntil: '2026-04-20', lineItems: [{ description: 'Prep & prime (all rooms)', amount: 1200 }, { description: 'Paint (2 coats)', amount: 2400 }, { description: 'Trim & baseboards', amount: 600 }] },
  ];

  for (const q of quoteData) {
    const qId = randomUUID();
    quoteMap[q.mockId] = qId;
    await db.insert(quotes).values({
      id: qId,
      teamId,
      vendorId: vendorMap[q.vendorMock],
      listingId: listingMap[q.listingMock],
      scope: q.scope,
      amount: q.amount,
      status: q.status,
      requestedDate: parseDate(q.requestedDate),
      receivedDate: 'receivedDate' in q && q.receivedDate ? parseDate(q.receivedDate) : undefined,
      validUntil: 'validUntil' in q && q.validUntil ? parseDate(q.validUntil) : undefined,
      notes: 'notes' in q ? q.notes : undefined,
    });

    for (const li of q.lineItems) {
      await db.insert(quoteLineItems).values({
        id: randomUUID(),
        quoteId: qId,
        description: li.description,
        amount: li.amount,
      });
    }
  }

  // ─── 15. Marketing Assets ─────────────────────────────────────────────
  console.log('  Inserting marketing assets...');
  const marketingData = [
    { listingMock: 'l-1', type: 'photo' as const, name: 'Professional photo package (42 photos)', status: 'complete' as const, date: '2026-04-02' },
    { listingMock: 'l-1', type: 'video' as const, name: 'Cinematic video walkthrough', status: 'complete' as const, date: '2026-04-03' },
    { listingMock: 'l-1', type: 'floorplan' as const, name: '2D floor plan with measurements', status: 'complete' as const, date: '2026-04-01' },
    { listingMock: 'l-1', type: 'brochure' as const, name: 'Property brochure (digital + print)', status: 'complete' as const, date: '2026-04-03' },
    { listingMock: 'l-1', type: 'social_post' as const, name: 'Instagram carousel — Just Listed', status: 'published' as const, date: '2026-04-04', platform: 'Instagram', metrics: { impressions: 3420, clicks: 186, saves: 45 } },
    { listingMock: 'l-1', type: 'social_post' as const, name: 'Facebook Open House promo', status: 'published' as const, date: '2026-04-06', platform: 'Facebook', metrics: { impressions: 1890, clicks: 92, saves: 18 } },
    { listingMock: 'l-1', type: 'social_post' as const, name: 'LinkedIn — Market insight post', status: 'scheduled' as const, date: '2026-04-12', platform: 'LinkedIn' },
    { listingMock: 'l-1', type: 'virtual_tour' as const, name: '3D Matterport walkthrough', status: 'complete' as const, date: '2026-04-02' },
    { listingMock: 'l-3', type: 'photo' as const, name: 'Professional photos (scheduled)', status: 'scheduled' as const, date: '2026-04-14' },
    { listingMock: 'l-3', type: 'video' as const, name: 'Video walkthrough', status: 'scheduled' as const, date: '2026-04-15' },
  ];

  for (const m of marketingData) {
    await db.insert(marketingAssets).values({
      id: randomUUID(),
      teamId,
      listingId: listingMap[m.listingMock],
      type: m.type,
      name: m.name,
      status: m.status,
      date: parseDate(m.date),
      platform: 'platform' in m ? m.platform : undefined,
      metrics: 'metrics' in m ? m.metrics : undefined,
    });
  }

  // ─── 16. Integrations ─────────────────────────────────────────────────
  console.log('  Inserting integrations...');
  const integrationData = [
    { name: 'Gmail', description: 'Email sync and send', category: 'email' as const, icon: 'Mail', status: 'connected' as const, lastSync: new Date('2026-04-09T11:00:00'), connectedByMock: 'tm-1' },
    { name: 'Google Calendar', description: 'Showings and appointments', category: 'calendar' as const, icon: 'Calendar', status: 'connected' as const, lastSync: new Date('2026-04-09T10:55:00'), connectedByMock: 'tm-1' },
    { name: 'DocuSign', description: 'E-signatures and document routing', category: 'documents' as const, icon: 'FileSignature', status: 'connected' as const, lastSync: new Date('2026-04-09T10:00:00'), connectedByMock: 'tm-3' },
    { name: 'MLSListings (Bay Area)', description: 'MLS data and comp feeds', category: 'mls' as const, icon: 'Database', status: 'connected' as const, lastSync: new Date('2026-04-09T10:30:00'), connectedByMock: 'tm-1' },
    { name: 'Zillow', description: 'View and save analytics', category: 'marketing' as const, icon: 'BarChart', status: 'connected' as const, lastSync: new Date('2026-04-09T10:00:00'), connectedByMock: 'tm-1' },
    { name: 'QuickBooks', description: 'Financial tracking and invoicing', category: 'financial' as const, icon: 'Receipt', status: 'disconnected' as const },
    { name: 'Instagram Business', description: 'Social media posting and analytics', category: 'marketing' as const, icon: 'Instagram', status: 'connected' as const, lastSync: new Date('2026-04-09T08:00:00'), connectedByMock: 'tm-4' },
    { name: 'Twilio', description: 'SMS messaging (Phase 2)', category: 'communication' as const, icon: 'MessageSquare', status: 'disconnected' as const },
  ];

  for (const i of integrationData) {
    await db.insert(integrations).values({
      id: randomUUID(),
      teamId,
      name: i.name,
      description: i.description,
      category: i.category,
      icon: i.icon,
      status: i.status,
      lastSync: 'lastSync' in i ? i.lastSync : undefined,
      connectedById: 'connectedByMock' in i && i.connectedByMock ? tmMap[i.connectedByMock] : undefined,
    });
  }

  // ─── 17. Workflow Templates ───────────────────────────────────────────
  console.log('  Inserting workflow templates...');
  const workflowData = [
    { name: 'Standard Onboarding', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, taskCount: 8, description: 'Client intake, listing agreement, initial docs', isDefault: true },
    { name: 'Pre-Market Improvements', phase: 'pre_market' as const, taskCategory: 'improvements' as const, taskCount: 6, description: 'Vendor quotes, improvement planning, permits', isDefault: true },
    { name: 'Staging & Preparation', phase: 'pre_market' as const, taskCategory: 'staging' as const, taskCount: 5, description: 'Staging coordination, vendor scheduling', isDefault: true },
    { name: 'Media Production', phase: 'pre_market' as const, taskCategory: 'media' as const, taskCount: 7, description: 'Photography, video, copy, materials', isDefault: true },
    { name: 'Marketing Launch', phase: 'active' as const, taskCategory: 'marketing' as const, taskCount: 8, description: 'MLS, social, open houses, advertising', isDefault: true },
    { name: 'Showings Management', phase: 'active' as const, taskCategory: 'showings' as const, taskCount: 4, description: 'Showing coordination, feedback, follow-up', isDefault: true },
    { name: 'Offer Review', phase: 'active' as const, taskCategory: 'offers' as const, taskCount: 5, description: 'Offer intake, comparison, negotiation', isDefault: true },
    { name: 'Escrow Management', phase: 'active' as const, taskCategory: 'escrow' as const, taskCount: 10, description: 'Inspections, appraisal, contingencies, closing prep', isDefault: true },
    { name: 'Closing Process', phase: 'closed' as const, taskCategory: 'escrow' as const, taskCount: 6, description: 'Final walkthrough, signing, key handoff', isDefault: true },
    { name: 'Luxury Marketing', phase: 'active' as const, taskCategory: 'marketing' as const, taskCount: 12, description: 'Extended marketing for $2M+ properties', isDefault: false },
  ];

  for (const w of workflowData) {
    await db.insert(workflowTemplates).values({
      id: randomUUID(),
      teamId,
      name: w.name,
      phase: w.phase,
      taskCategory: w.taskCategory,
      taskCount: w.taskCount,
      description: w.description,
      isDefault: w.isDefault,
    });
  }

  console.log('Seed complete!');
  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
