import { readFileSync } from 'fs';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from './schema/index.js';

// Auto-load .env when running via tsx (SvelteKit handles this in dev/build)
function loadEnv() {
  try {
    const envPath = resolve(import.meta.dirname, '../../../..', '.env');
    const envFile = readFileSync(envPath, 'utf-8');
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      const value = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch { /* .env not found, rely on existing env */ }
}
loadEnv();

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
  analyticsEvents,
  analyticsShowings,
  pipelineMetrics,
  teamPerformance,
  files,
  marketAnalyses,
  compListings,
  analysisSchedules,
  properties,
  externalListings,
  buyerPreferences,
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
    external_listings, buyer_preferences,
    analysis_schedules, comp_listings, market_analyses,
    files, team_performance, pipeline_metrics, analytics_showings, analytics_events,
    quote_line_items, quotes, financial_categories, financial_budgets,
    marketing_assets, documents, comp_sales, offers, showings,
    ai_insights, activity_items, tasks, listings, properties, contacts,
    vendors, integrations, workflow_templates, team_members, teams
    CASCADE`);

  // ─── ID Maps ────────────────────────────────────────────────────────────
  const teamId = randomUUID();
  const tmMap: Record<string, string> = {};
  const contactMap: Record<string, string> = {};
  const listingMap: Record<string, string> = {};
  const propertyMap: Record<string, string> = {};
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
    name: 'Reynolds Realty',
    slug: 'reynolds-realty',
  });

  // ─── 2. Team Members ──────────────────────────────────────────────────
  console.log('  Inserting team members...');
  const teamMemberData = [
    { mockId: 'tm-1', name: 'Bryce Reynolds', email: 'bryce@hometrack.co', role: 'admin' as const, roleLabel: 'Team Lead / Listing Agent', initials: 'BR' },
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
      userId: null,
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

  // ─── 4a. Properties ─────────────────────────────────────────────────
  console.log('  Inserting properties...');
  const propertyData = [
    {
      mockId: 'l-1',
      address: '123 Main Street', city: 'Los Gatos', state: 'CA', zip: '95030', county: 'Santa Clara',
      lat: 37.2358, lng: -121.9624,
      beds: 4, baths: 3, bathsFull: 2, bathsHalf: 1, sqft: 2850, lotSqft: 8500, lotSizeAcres: 0.20, yearBuilt: 1965,
      propertyType: 'SINGLE_FAMILY', stories: 1, architecturalStyle: 'Ranch',
      constructionMaterials: ['Wood frame', 'Stucco'],
      roof: 'Composition shingle', foundation: ['Concrete perimeter'], basement: 'None',
      features: {
        pool: false, garage: true, fireplace: true, spa: false,
        heating: ['Forced air', 'Gas'], cooling: ['Central AC'],
        appliances: ['Dishwasher', 'Microwave', 'Double oven', 'Gas range', 'Refrigerator', 'Disposal'],
        flooring: ['Hardwood', 'Tile'], laundry: ['In-unit', 'Washer', 'Dryer'],
        interiorFeatures: ['Open floor plan', 'Recessed lighting', 'Quartz countertops', 'Smart home system'],
        exteriorFeatures: ['Stucco', 'Private backyard', 'Mature landscaping'],
        fencing: 'Wood privacy fence', view: 'Garden', waterfront: false,
        patioAndPorch: ['Covered patio', 'Rear deck'],
      },
      parkingSpaces: 2, garageSpaces: 2, parkingFeatures: ['Garage - Attached', 'Driveway'],
      lotFeatures: ['Back yard', 'Landscaped', 'Sprinklers'],
      roomsCount: 9,
      taxAssessedValue: 1650000, taxAnnualAmount: 19800, taxYear: 2025, parcelNumber: '424-12-034',
      walkabilityScore: 72, transitScore: 42, bikeScore: 65,
      neighborhood: 'Los Gatos Core',
      elementarySchool: 'Daves Avenue Elementary', elementarySchoolDistrict: 'Los Gatos Union',
      middleSchool: 'Raymond J. Fisher Middle', middleSchoolDistrict: 'Los Gatos Union',
      highSchool: 'Los Gatos High', highSchoolDistrict: 'Los Gatos-Saratoga Joint Union',
      photos: [
        { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', caption: 'Front exterior' },
        { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', caption: 'Living room' },
        { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', caption: 'Kitchen' },
        { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', caption: 'Backyard' },
      ],
      lastSoldPrice: 1420000, lastSoldDate: '2018-06-15',
    },
    {
      mockId: 'l-2',
      address: '456 Oak Avenue', city: 'Palo Alto', state: 'CA', zip: '94301', county: 'Santa Clara',
      lat: 37.4419, lng: -122.1430,
      beds: 5, baths: 4, bathsFull: 3, bathsHalf: 1, sqft: 3600, lotSqft: 12000, lotSizeAcres: 0.28, yearBuilt: 1952,
      propertyType: 'SINGLE_FAMILY', stories: 2, architecturalStyle: 'Colonial',
      constructionMaterials: ['Wood frame', 'Brick veneer'],
      roof: 'Slate', foundation: ['Raised perimeter'], basement: 'Unfinished',
      features: {
        pool: true, garage: true, fireplace: true, spa: true,
        heating: ['Forced air', 'Gas'], cooling: ['Central AC', 'Zoned'],
        appliances: ['Sub-Zero refrigerator', 'Wolf range', 'Miele dishwasher', 'Wine fridge', 'Warming drawer', 'Disposal'],
        flooring: ['Hardwood', 'Marble', 'Heated tile'], laundry: ['Laundry room', 'Washer', 'Dryer'],
        interiorFeatures: ['Crown molding', 'Built-in bookshelves', 'Wine cellar', 'Home office', 'Wet bar'],
        exteriorFeatures: ['Brick', 'Outdoor kitchen', 'Built-in BBQ', 'Fire pit'],
        fencing: 'Wrought iron', view: 'Tree-lined street', waterfront: false,
        patioAndPorch: ['Covered patio', 'Wraparound porch', 'Pergola'],
      },
      parkingSpaces: 3, garageSpaces: 2, parkingFeatures: ['Garage - Detached', 'Driveway - Circular'],
      lotFeatures: ['Mature oaks', 'Flat', 'Sprinklers', 'Professional landscaping'],
      roomsCount: 12,
      taxAssessedValue: 2750000, taxAnnualAmount: 33000, taxYear: 2025, parcelNumber: '132-28-091',
      walkabilityScore: 82, transitScore: 55, bikeScore: 88,
      neighborhood: 'Old Palo Alto',
      elementarySchool: 'Walter Hays Elementary', elementarySchoolDistrict: 'Palo Alto Unified',
      middleSchool: 'Jordan Middle', middleSchoolDistrict: 'Palo Alto Unified',
      highSchool: 'Palo Alto High', highSchoolDistrict: 'Palo Alto Unified',
      photos: [
        { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', caption: 'Front exterior' },
        { url: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop', caption: 'Living room' },
        { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop', caption: 'Kitchen' },
        { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop', caption: 'Pool & patio' },
      ],
      lastSoldPrice: 2100000, lastSoldDate: '2015-09-22',
    },
    {
      mockId: 'l-3',
      address: '789 Elm Street', city: 'Cupertino', state: 'CA', zip: '95014', county: 'Santa Clara',
      lat: 37.3230, lng: -122.0322,
      beds: 3, baths: 2, bathsFull: 2, bathsHalf: 0, sqft: 1850, lotSqft: 6200, lotSizeAcres: 0.14, yearBuilt: 1978,
      propertyType: 'SINGLE_FAMILY', stories: 1, architecturalStyle: 'Contemporary',
      constructionMaterials: ['Wood frame', 'Stucco'],
      roof: 'Composition shingle', foundation: ['Slab'], basement: 'None',
      features: {
        pool: false, garage: true, fireplace: false, spa: false,
        heating: ['Forced air', 'Gas'], cooling: ['Central AC'],
        appliances: ['Dishwasher', 'Electric range', 'Microwave', 'Refrigerator', 'Disposal'],
        flooring: ['Laminate', 'Tile'], laundry: ['In garage', 'Washer hookup'],
        interiorFeatures: ['Open floor plan', 'Vaulted ceilings', 'Dual-pane windows', 'Updated bathrooms'],
        exteriorFeatures: ['Stucco', 'New roof 2024', 'Low-maintenance yard'],
        fencing: 'Wood', view: 'Neighborhood', waterfront: false,
        patioAndPorch: ['Concrete patio'],
      },
      parkingSpaces: 2, garageSpaces: 2, parkingFeatures: ['Garage - Attached', 'Driveway'],
      lotFeatures: ['Level', 'Back yard'],
      roomsCount: 7,
      taxAssessedValue: 980000, taxAnnualAmount: 11760, taxYear: 2025, parcelNumber: '316-05-072',
      walkabilityScore: 58, transitScore: 38, bikeScore: 70,
      neighborhood: 'Monta Vista',
      elementarySchool: 'Montclaire Elementary', elementarySchoolDistrict: 'Cupertino Union',
      middleSchool: 'Kennedy Middle', middleSchoolDistrict: 'Cupertino Union',
      highSchool: 'Monta Vista High', highSchoolDistrict: 'Fremont Union',
      photos: [
        { url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop', caption: 'Front exterior' },
        { url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&h=600&fit=crop', caption: 'Living room' },
        { url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=600&fit=crop', caption: 'Kitchen' },
      ],
      lastSoldPrice: 875000, lastSoldDate: '2012-03-10',
    },
    {
      mockId: 'l-4',
      address: '2200 Willow Glen Way', city: 'San Jose', state: 'CA', zip: '95125', county: 'Santa Clara',
      lat: 37.2969, lng: -121.9008,
      beds: 3, baths: 2, bathsFull: 1, bathsHalf: 1, sqft: 1620, lotSqft: 5800, lotSizeAcres: 0.13, yearBuilt: 1940,
      propertyType: 'SINGLE_FAMILY', stories: 1, architecturalStyle: 'Craftsman Bungalow',
      constructionMaterials: ['Wood frame', 'Wood siding'],
      roof: 'Composition shingle', foundation: ['Raised perimeter'], basement: 'None',
      features: {
        pool: false, garage: true, fireplace: true, spa: false,
        heating: ['Wall furnace', 'Gas'], cooling: ['Window unit'],
        appliances: ['Gas range', 'Refrigerator', 'Dishwasher', 'Disposal'],
        flooring: ['Hardwood', 'Vintage tile'], laundry: ['In garage'],
        interiorFeatures: ['Breakfast nook', 'Built-in cabinetry', 'Period details', 'Coved ceilings', 'Arched doorways'],
        exteriorFeatures: ['Wood siding', 'Detached garage', 'Mature garden'],
        fencing: 'Picket fence', view: 'Tree-lined street', waterfront: false,
        patioAndPorch: ['Front porch', 'Rear patio'],
      },
      parkingSpaces: 1, garageSpaces: 1, parkingFeatures: ['Garage - Detached', 'Street parking'],
      lotFeatures: ['Mature trees', 'Landscaped', 'Rose garden'],
      roomsCount: 7,
      taxAssessedValue: 720000, taxAnnualAmount: 8640, taxYear: 2025, parcelNumber: '264-31-118',
      walkabilityScore: 85, transitScore: 45, bikeScore: 78,
      neighborhood: 'Willow Glen',
      elementarySchool: 'Willow Glen Elementary', elementarySchoolDistrict: 'San Jose Unified',
      middleSchool: 'Willow Glen Middle', middleSchoolDistrict: 'San Jose Unified',
      highSchool: 'Willow Glen High', highSchoolDistrict: 'San Jose Unified',
      photos: [
        { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop', caption: 'Front exterior' },
        { url: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&h=600&fit=crop', caption: 'Living room' },
        { url: 'https://images.unsplash.com/photo-1600573472572-8aba140b2c78?w=800&h=600&fit=crop', caption: 'Kitchen' },
      ],
      lastSoldPrice: 650000, lastSoldDate: '2010-11-05',
    },
    {
      mockId: 'l-5',
      address: '1580 University Avenue', city: 'Mountain View', state: 'CA', zip: '94040', county: 'Santa Clara',
      lat: 37.3861, lng: -122.0839,
      beds: 2, baths: 2, bathsFull: 2, bathsHalf: 0, sqft: 1200, lotSqft: 4500, lotSizeAcres: 0.10, yearBuilt: 1955,
      propertyType: 'TOWNHOME', stories: 2, architecturalStyle: 'Contemporary',
      constructionMaterials: ['Wood frame', 'Stucco'],
      roof: 'Composition shingle', foundation: ['Slab'], basement: 'None',
      features: {
        pool: false, garage: false, fireplace: false, spa: false,
        heating: ['Forced air', 'Electric'], cooling: ['Central AC'],
        appliances: ['Dishwasher', 'Electric range', 'Microwave', 'Refrigerator', 'Disposal'],
        flooring: ['Luxury vinyl plank', 'Tile'], laundry: ['In-unit', 'Stackable'],
        interiorFeatures: ['Modern finishes', 'Quartz countertops', 'Recessed lighting', 'USB outlets'],
        exteriorFeatures: ['Stucco', 'Private patio', 'EV charging station'],
        fencing: 'Shared HOA', view: 'Courtyard', waterfront: false,
        patioAndPorch: ['Private patio'],
      },
      parkingSpaces: 1, garageSpaces: 0, parkingFeatures: ['Assigned carport', 'Guest parking'],
      lotFeatures: ['Common area', 'Near transit'],
      roomsCount: 5,
      taxAssessedValue: 780000, taxAnnualAmount: 9360, taxYear: 2025, parcelNumber: '158-44-020',
      hoaFee: 485, hoaFeeFrequency: 'monthly',
      walkabilityScore: 88, transitScore: 72, bikeScore: 90,
      neighborhood: 'Downtown Mountain View',
      elementarySchool: 'Bubb Elementary', elementarySchoolDistrict: 'Mountain View Whisman',
      middleSchool: 'Graham Middle', middleSchoolDistrict: 'Mountain View Whisman',
      highSchool: 'Los Altos High', highSchoolDistrict: 'Mountain View-Los Altos',
      photos: [
        { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', caption: 'Front exterior' },
        { url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7c5a38?w=800&h=600&fit=crop', caption: 'Interior' },
      ],
      lastSoldPrice: 720000, lastSoldDate: '2016-08-20',
    },
    {
      mockId: 'l-6',
      address: '945 Cherry Blossom Lane', city: 'Saratoga', state: 'CA', zip: '95070', county: 'Santa Clara',
      lat: 37.2638, lng: -122.0230,
      beds: 5, baths: 3.5, bathsFull: 3, bathsHalf: 1, sqft: 3200, lotSqft: 15000, lotSizeAcres: 0.34, yearBuilt: 1988,
      propertyType: 'SINGLE_FAMILY', stories: 2, architecturalStyle: 'Mediterranean',
      constructionMaterials: ['Wood frame', 'Stucco'],
      roof: 'Clay tile', foundation: ['Slab', 'Concrete'], basement: 'None',
      features: {
        pool: true, garage: true, fireplace: true, spa: true,
        heating: ['Forced air', 'Gas', 'Radiant'], cooling: ['Central AC', 'Zoned'],
        appliances: ['Viking range', 'Sub-Zero refrigerator', 'Bosch dishwasher', 'Built-in espresso machine', 'Wine fridge', 'Disposal'],
        flooring: ['Hardwood', 'Travertine', 'Heated tile'], laundry: ['Laundry room', 'Washer', 'Dryer'],
        interiorFeatures: ['Gourmet kitchen', 'Formal dining', 'Home theater', 'Outdoor fireplace', 'Built-in speakers'],
        exteriorFeatures: ['Stucco', 'Pool', 'Spa', 'Outdoor kitchen', 'Built-in BBQ', 'Sport court'],
        fencing: 'Block wall', view: 'Foothills', waterfront: false,
        patioAndPorch: ['Covered patio', 'Loggia', 'Pool deck'],
      },
      parkingSpaces: 4, garageSpaces: 3, parkingFeatures: ['Garage - Attached', 'Driveway - Oversized'],
      lotFeatures: ['Pool/Spa', 'Sport court', 'Flat', 'Sprinklers', 'Fruit trees'],
      roomsCount: 13,
      taxAssessedValue: 2200000, taxAnnualAmount: 26400, taxYear: 2025, parcelNumber: '389-07-055',
      walkabilityScore: 35, transitScore: 18, bikeScore: 42,
      neighborhood: 'Saratoga Hills',
      elementarySchool: 'Argonaut Elementary', elementarySchoolDistrict: 'Saratoga Union',
      middleSchool: 'Redwood Middle', middleSchoolDistrict: 'Saratoga Union',
      highSchool: 'Saratoga High', highSchoolDistrict: 'Los Gatos-Saratoga Joint Union',
      photos: [
        { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', caption: 'Front exterior' },
        { url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop', caption: 'Living room' },
        { url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop', caption: 'Pool' },
        { url: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop', caption: 'Kitchen' },
      ],
      lastSoldPrice: 1800000, lastSoldDate: '2014-04-12',
    },
    {
      mockId: 'l-7',
      address: '310 Waverly Street', city: 'Menlo Park', state: 'CA', zip: '94025', county: 'San Mateo',
      lat: 37.4530, lng: -122.1817,
      beds: 4, baths: 3, bathsFull: 2, bathsHalf: 1, sqft: 2400, lotSqft: 7200, lotSizeAcres: 0.17, yearBuilt: 1948,
      propertyType: 'SINGLE_FAMILY', stories: 1, architecturalStyle: 'Mid-Century Modern',
      constructionMaterials: ['Wood frame', 'Board and batten'],
      roof: 'Flat/low-slope', foundation: ['Concrete perimeter'], basement: 'None',
      features: {
        pool: false, garage: true, fireplace: true, spa: false,
        heating: ['Forced air', 'Gas'], cooling: ['Mini-split'],
        appliances: ['Bosch dishwasher', 'Gas range', 'Refrigerator', 'Microwave', 'Disposal'],
        flooring: ['Hardwood', 'Slate'], laundry: ['In-unit', 'Washer', 'Dryer'],
        interiorFeatures: ['Designer kitchen', 'Post-and-beam ceilings', 'Clerestory windows', 'Heritage redwood paneling'],
        exteriorFeatures: ['Board and batten', 'Japanese garden', 'Mature redwoods'],
        fencing: 'Cedar', view: 'Garden', waterfront: false,
        patioAndPorch: ['Rear deck', 'Courtyard entry'],
      },
      parkingSpaces: 2, garageSpaces: 1, parkingFeatures: ['Garage - Attached', 'Driveway'],
      lotFeatures: ['Mature trees', 'Japanese garden', 'Level'],
      roomsCount: 9,
      taxAssessedValue: 1950000, taxAnnualAmount: 23400, taxYear: 2025, parcelNumber: '071-19-044',
      walkabilityScore: 75, transitScore: 48, bikeScore: 80,
      neighborhood: 'Central Menlo Park',
      elementarySchool: 'Oak Knoll Elementary', elementarySchoolDistrict: 'Menlo Park City',
      middleSchool: 'Hillview Middle', middleSchoolDistrict: 'Menlo Park City',
      highSchool: 'Menlo-Atherton High', highSchoolDistrict: 'Sequoia Union',
      photos: [
        { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', caption: 'Front exterior' },
        { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', caption: 'Living room' },
        { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', caption: 'Kitchen' },
      ],
      lastSoldPrice: 1650000, lastSoldDate: '2017-01-30',
    },
    {
      mockId: 'l-8',
      address: '88 Sunnyvale Avenue', city: 'Sunnyvale', state: 'CA', zip: '94086', county: 'Santa Clara',
      lat: 37.3688, lng: -122.0363,
      beds: 2, baths: 1, bathsFull: 1, bathsHalf: 0, sqft: 980, lotSqft: 3500, lotSizeAcres: 0.08, yearBuilt: 1960,
      propertyType: 'CONDO', stories: 1, architecturalStyle: 'Garden-style',
      constructionMaterials: ['Wood frame', 'Stucco'],
      roof: 'Composition shingle', foundation: ['Slab'], basement: 'None',
      features: {
        pool: true, garage: false, fireplace: false, spa: false,
        heating: ['Wall heater', 'Electric'], cooling: ['Window unit'],
        appliances: ['Electric range', 'Refrigerator', 'Dishwasher', 'Disposal'],
        flooring: ['Carpet', 'Vinyl'], laundry: ['In-unit', 'Stackable'],
        interiorFeatures: ['Breakfast bar', 'Coat closet'],
        exteriorFeatures: ['Stucco', 'Community pool', 'Gated entry'],
        communityFeatures: ['Pool', 'Laundry facility', 'Gated access', 'Near Murphy Avenue shops'],
        fencing: 'Complex perimeter', view: 'Courtyard', waterfront: false,
        patioAndPorch: ['Small balcony'],
      },
      parkingSpaces: 1, garageSpaces: 0, parkingFeatures: ['Assigned carport'],
      roomsCount: 4,
      taxAssessedValue: 520000, taxAnnualAmount: 6240, taxYear: 2025, parcelNumber: '209-42-008',
      hoaFee: 380, hoaFeeFrequency: 'monthly',
      walkabilityScore: 90, transitScore: 62, bikeScore: 85,
      neighborhood: 'Downtown Sunnyvale',
      elementarySchool: 'Sunnyvale Middle', elementarySchoolDistrict: 'Sunnyvale',
      middleSchool: 'Sunnyvale Middle', middleSchoolDistrict: 'Sunnyvale',
      highSchool: 'Fremont High', highSchoolDistrict: 'Fremont Union',
      photos: [
        { url: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop', caption: 'Exterior' },
        { url: 'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800&h=600&fit=crop', caption: 'Living area' },
      ],
      lastSoldPrice: 480000, lastSoldDate: '2019-07-18',
    },
    {
      mockId: 'l-9',
      address: '809 Midvale Lane', city: 'San Jose', state: 'CA', zip: '95120', county: 'Santa Clara',
      lat: 37.2510, lng: -121.8620,
      beds: 4, baths: 3, bathsFull: 2, bathsHalf: 1, sqft: 2200, lotSqft: 7500, lotSizeAcres: 0.17, yearBuilt: 1972,
      propertyType: 'SINGLE_FAMILY', stories: 1, architecturalStyle: 'Ranch',
      constructionMaterials: ['Wood frame', 'Stucco'],
      roof: 'Composition shingle', foundation: ['Slab', 'Concrete'], basement: 'None',
      features: {
        pool: true, garage: true, fireplace: true, spa: false,
        heating: ['Forced air', 'Gas'], cooling: ['Central AC'],
        appliances: ['Gas range', 'Refrigerator', 'Dishwasher', 'Microwave', 'Disposal', 'Trash compactor'],
        flooring: ['Hardwood', 'Carpet', 'Tile'], laundry: ['In-unit', 'Washer', 'Dryer'],
        interiorFeatures: ['Vaulted ceilings', 'Skylights', 'Wet bar', 'Recessed lighting', 'Dual-pane windows', 'Plantation shutters'],
        exteriorFeatures: ['Stucco', 'In-ground pool', 'Built-in BBQ', 'Side yard access', 'RV parking potential'],
        securityFeatures: ['Security system', 'Motion sensors'],
        greenFeatures: { solarPanels: true, solarOwned: true, tanklessWaterHeater: true },
        fencing: 'Block wall', view: 'Foothills', waterfront: false,
        patioAndPorch: ['Covered patio', 'Pool deck', 'Side patio'],
      },
      parkingSpaces: 3, garageSpaces: 2, parkingFeatures: ['Garage - Attached', 'Driveway - Extended', 'RV potential'],
      lotFeatures: ['Pool', 'Flat', 'Sprinklers', 'Fruit trees', 'Side yard'],
      roomsCount: 10,
      rooms: [
        { roomType: 'Living Room', dimensions: '18x14', level: 'Main' },
        { roomType: 'Family Room', dimensions: '16x12', level: 'Main' },
        { roomType: 'Kitchen', dimensions: '14x12', level: 'Main' },
        { roomType: 'Primary Bedroom', dimensions: '16x14', level: 'Main' },
        { roomType: 'Bedroom 2', dimensions: '12x11', level: 'Main' },
        { roomType: 'Bedroom 3', dimensions: '12x10', level: 'Main' },
        { roomType: 'Bedroom 4', dimensions: '11x10', level: 'Main' },
        { roomType: 'Office/Den', dimensions: '10x10', level: 'Main' },
        { roomType: 'Dining Room', dimensions: '12x10', level: 'Main' },
        { roomType: 'Laundry', dimensions: '8x6', level: 'Main' },
      ],
      taxAssessedValue: 1100000, taxAnnualAmount: 13200, taxYear: 2025, parcelNumber: '455-22-067',
      sewer: 'Public sewer', waterSource: 'Public', electric: 'PG&E', gas: 'Natural gas',
      walkabilityScore: 42, transitScore: 28, bikeScore: 50,
      neighborhood: 'Almaden Valley',
      elementarySchool: 'Graystone Elementary', elementarySchoolDistrict: 'San Jose Unified',
      middleSchool: 'Bret Harte Middle', middleSchoolDistrict: 'San Jose Unified',
      highSchool: 'Leland High', highSchoolDistrict: 'San Jose Unified',
      nearbySchools: [
        { name: 'Graystone Elementary', type: 'public', level: 'Elementary', distance: 0.4, rating: 8, grades: 'K-5', isAssigned: true },
        { name: 'Bret Harte Middle', type: 'public', level: 'Middle', distance: 1.1, rating: 7, grades: '6-8', isAssigned: true },
        { name: 'Leland High', type: 'public', level: 'High', distance: 1.8, rating: 8, grades: '9-12', isAssigned: true },
      ],
      photos: [
        { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', caption: 'Front exterior' },
      ],
      lastSoldPrice: 920000, lastSoldDate: '2013-10-08',
      zillowUrl: 'https://www.zillow.com/homedetails/809-Midvale-Ln-San-Jose-CA-95120/',
      priceHistory: [
        { date: '2013-10-08', event: 'Sold', price: 920000, pricePerSqft: 418, source: 'MLS' },
        { date: '2005-06-15', event: 'Sold', price: 685000, pricePerSqft: 311, source: 'Public records' },
        { date: '1998-03-20', event: 'Sold', price: 385000, pricePerSqft: 175, source: 'Public records' },
      ],
      taxHistory: [
        { year: 2025, taxAmount: 13200, value: 1100000 },
        { year: 2024, taxAmount: 12800, value: 1070000 },
        { year: 2023, taxAmount: 12400, value: 1040000 },
      ],
      dataCompletenessScore: 0.85,
    },
  ];

  for (const p of propertyData) {
    const id = randomUUID();
    propertyMap[p.mockId] = id;
    await db.insert(properties).values({
      id,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      county: p.county,
      lat: p.lat,
      lng: p.lng,
      beds: p.beds,
      baths: p.baths,
      bathsFull: p.bathsFull,
      bathsHalf: p.bathsHalf,
      sqft: p.sqft,
      lotSqft: p.lotSqft,
      lotSizeAcres: p.lotSizeAcres,
      yearBuilt: p.yearBuilt,
      propertyType: p.propertyType,
      stories: p.stories,
      architecturalStyle: p.architecturalStyle,
      constructionMaterials: p.constructionMaterials,
      roof: p.roof,
      foundation: p.foundation,
      basement: p.basement,
      features: p.features,
      parkingSpaces: p.parkingSpaces,
      garageSpaces: p.garageSpaces,
      parkingFeatures: p.parkingFeatures,
      lotFeatures: p.lotFeatures,
      roomsCount: p.roomsCount,
      rooms: 'rooms' in p ? p.rooms : undefined,
      taxAssessedValue: p.taxAssessedValue,
      taxAnnualAmount: p.taxAnnualAmount,
      taxYear: p.taxYear,
      parcelNumber: p.parcelNumber,
      hoaFee: 'hoaFee' in p ? (p as any).hoaFee : undefined,
      hoaFeeFrequency: 'hoaFeeFrequency' in p ? (p as any).hoaFeeFrequency : undefined,
      sewer: 'sewer' in p ? (p as any).sewer : undefined,
      waterSource: 'waterSource' in p ? (p as any).waterSource : undefined,
      electric: 'electric' in p ? (p as any).electric : undefined,
      gas: 'gas' in p ? (p as any).gas : undefined,
      walkabilityScore: p.walkabilityScore,
      transitScore: p.transitScore,
      bikeScore: p.bikeScore,
      neighborhood: p.neighborhood,
      elementarySchool: p.elementarySchool,
      elementarySchoolDistrict: p.elementarySchoolDistrict,
      middleSchool: p.middleSchool,
      middleSchoolDistrict: p.middleSchoolDistrict,
      highSchool: p.highSchool,
      highSchoolDistrict: p.highSchoolDistrict,
      nearbySchools: 'nearbySchools' in p ? p.nearbySchools : undefined,
      photos: p.photos,
      lastSoldPrice: p.lastSoldPrice,
      lastSoldDate: parseDate(p.lastSoldDate),
      zillowUrl: 'zillowUrl' in p ? (p as any).zillowUrl : undefined,
      priceHistory: 'priceHistory' in p ? p.priceHistory : undefined,
      taxHistory: 'taxHistory' in p ? p.taxHistory : undefined,
      dataCompletenessScore: 'dataCompletenessScore' in p ? (p as any).dataCompletenessScore : undefined,
    });
  }

  // ─── 4b. Listings ──────────────────────────────────────────────────────
  console.log('  Inserting listings...');
  const listingData = [
    { mockId: 'l-1', address: '123 Main Street', city: 'Los Gatos', state: 'CA', zip: '95030', price: 2495000, beds: 4, baths: 3, sqft: 2850, lotSqft: 8500, yearBuilt: 1965, propertyType: 'Single Family', mlsNumber: 'ML81928374', phase: 'active' as const, underContract: false, daysInPhase: 5, daysOnMarket: 5, listDate: '2026-04-04', targetListDate: '2026-04-04', agentMock: 'tm-1', clientMock: 'c-1', photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop'], lat: 37.2358, lng: -121.9624, tasksDone: 18, tasksTotal: 26, documentsCount: 14, showingsCount: 8, offersCount: 2, zillowViews: 1243, zillowSaves: 67, description: 'Beautifully remodeled ranch-style home in the heart of Los Gatos.', features: ['Remodeled kitchen', 'Hardwood floors', 'Private backyard', 'Two-car garage', 'Central AC', 'Smart home'] },
    { mockId: 'l-2', address: '456 Oak Avenue', city: 'Palo Alto', state: 'CA', zip: '94301', price: 3850000, beds: 5, baths: 4, sqft: 3600, lotSqft: 12000, yearBuilt: 1952, propertyType: 'Single Family', mlsNumber: 'ML81935521', phase: 'active' as const, underContract: false, daysInPhase: 12, daysOnMarket: 18, listDate: '2026-03-22', targetListDate: '2026-03-20', agentMock: 'tm-1', clientMock: 'c-2', photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop'], lat: 37.4419, lng: -122.1430, tasksDone: 10, tasksTotal: 15, documentsCount: 18, showingsCount: 15, offersCount: 0, zillowViews: 2890, zillowSaves: 142, description: 'Stately Old Palo Alto home on a tree-lined street.', features: ['Pool & spa', "Chef's kitchen", 'Home office', 'Wine cellar', 'Outdoor kitchen', 'Oak-lined lot'] },
    { mockId: 'l-3', address: '789 Elm Street', city: 'Cupertino', state: 'CA', zip: '95014', price: null, beds: 3, baths: 2, sqft: 1850, lotSqft: 6200, yearBuilt: 1978, propertyType: 'Single Family', mlsNumber: 'ML81940112', phase: 'pre_market' as const, underContract: false, daysInPhase: 4, daysOnMarket: 0, listDate: null, targetListDate: '2026-04-18', agentMock: 'tm-2', clientMock: 'c-3', photoUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=600&fit=crop'], lat: 37.3230, lng: -122.0322, tasksDone: 10, tasksTotal: 18, documentsCount: 8, showingsCount: 0, offersCount: 1, zillowViews: 0, zillowSaves: 0, description: 'Well-maintained Cupertino home in top-rated school district.', features: ['Top schools', 'New roof', 'Updated baths', 'Open floor plan', 'Near Apple Park'] },
    { mockId: 'l-4', address: '2200 Willow Glen Way', city: 'San Jose', state: 'CA', zip: '95125', price: null, beds: 3, baths: 2, sqft: 1620, lotSqft: 5800, yearBuilt: 1940, propertyType: 'Single Family', mlsNumber: 'ML81942889', phase: 'pre_market' as const, underContract: false, daysInPhase: 8, daysOnMarket: 0, listDate: null, targetListDate: '2026-04-25', agentMock: 'tm-2', clientMock: 'c-3', photoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600573472572-8aba140b2c78?w=800&h=600&fit=crop'], lat: 37.2969, lng: -121.9008, tasksDone: 8, tasksTotal: 13, documentsCount: 5, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, description: 'Classic Willow Glen charmer with period details.', features: ['Period details', 'Walkable', 'Detached garage', 'Breakfast nook', 'Mature garden'] },
    { mockId: 'l-5', address: '1580 University Avenue', city: 'Mountain View', state: 'CA', zip: '94040', price: null, beds: 2, baths: 2, sqft: 1200, lotSqft: 4500, yearBuilt: 1955, propertyType: 'Townhouse', mlsNumber: 'ML81945003', phase: 'pre_market' as const, underContract: false, daysInPhase: 2, daysOnMarket: 0, listDate: null, targetListDate: '2026-05-10', agentMock: 'tm-1', clientMock: 'c-4', photoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753376-12c8ab7c5a38?w=800&h=600&fit=crop'], lat: 37.3861, lng: -122.0839, tasksDone: 2, tasksTotal: 7, documentsCount: 1, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, description: 'Light-filled Mountain View townhome near downtown and Caltrain.', features: ['Near Caltrain', 'Modern finishes', 'In-unit laundry', 'Private patio', 'EV charging'] },
    { mockId: 'l-6', address: '945 Cherry Blossom Lane', city: 'Saratoga', state: 'CA', zip: '95070', price: 3200000, beds: 5, baths: 3.5, sqft: 3200, lotSqft: 15000, yearBuilt: 1988, propertyType: 'Single Family', mlsNumber: 'ML81930445', phase: 'active' as const, underContract: false, daysInPhase: 3, daysOnMarket: 28, listDate: '2026-03-12', targetListDate: '2026-03-10', agentMock: 'tm-1', clientMock: 'c-3', photoUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop'], lat: 37.2638, lng: -122.0230, tasksDone: 11, tasksTotal: 15, documentsCount: 22, showingsCount: 21, offersCount: 3, zillowViews: 4100, zillowSaves: 198, description: 'Prestigious Saratoga estate on nearly half an acre.', features: ['Pool & spa', 'Half-acre lot', 'Gourmet kitchen', 'Outdoor fireplace', 'Saratoga schools', '3-car garage'] },
    { mockId: 'l-7', address: '310 Waverly Street', city: 'Menlo Park', state: 'CA', zip: '94025', price: 2875000, beds: 4, baths: 3, sqft: 2400, lotSqft: 7200, yearBuilt: 1948, propertyType: 'Single Family', mlsNumber: 'ML81925100', phase: 'active' as const, underContract: true, daysInPhase: 10, daysOnMarket: 35, listDate: '2026-03-05', targetListDate: '2026-03-05', agentMock: 'tm-2', clientMock: 'c-2', photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop'], lat: 37.4530, lng: -122.1817, tasksDone: 6, tasksTotal: 12, documentsCount: 26, showingsCount: 18, offersCount: 4, zillowViews: 3200, zillowSaves: 155, description: 'Charming mid-century Menlo Park home with thoughtful updates.', features: ['Near Stanford', 'Designer kitchen', 'Heritage redwood', 'Updated systems', 'Attached ADU potential'] },
    { mockId: 'l-8', address: '88 Sunnyvale Avenue', city: 'Sunnyvale', state: 'CA', zip: '94086', price: null, beds: 2, baths: 1, sqft: 980, lotSqft: 3500, yearBuilt: 1960, propertyType: 'Condo', mlsNumber: 'ML81946220', phase: 'pre_market' as const, underContract: false, daysInPhase: 6, daysOnMarket: 0, listDate: null, targetListDate: '2026-05-01', agentMock: 'tm-2', clientMock: 'c-4', photoUrl: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800&h=600&fit=crop'], lat: 37.3688, lng: -122.0363, tasksDone: 6, tasksTotal: 12, documentsCount: 3, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, description: 'Opportunity in Sunnyvale - investor-owned condo ready for cosmetic updates.', features: ['In-unit laundry', 'Assigned parking', 'Near Murphy Ave', 'Community pool'] },
    { mockId: 'l-9', address: '809 Midvale Lane', city: 'San Jose', state: 'CA', zip: '95120', price: null, beds: 4, baths: 3, sqft: 2200, lotSqft: 7500, yearBuilt: 1972, propertyType: 'Single Family', mlsNumber: null, phase: 'pre_market' as const, underContract: false, daysInPhase: 1, daysOnMarket: 0, listDate: null, targetListDate: '2026-05-15', agentMock: 'tm-1', clientMock: 'c-1', photoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', photos: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop'], lat: 37.2510, lng: -121.8620, tasksDone: 0, tasksTotal: 0, documentsCount: 0, showingsCount: 0, offersCount: 0, zillowViews: 0, zillowSaves: 0, description: 'Spacious single-story home in a quiet San Jose neighborhood. Recently acquired listing — pricing TBD.', features: ['Single story', 'Large lot', 'Quiet street', 'Good schools'] },
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

  // ─── 4c. Link listings → properties ─────────────────────────────────
  console.log('  Linking listings to properties...');
  for (const [mockId, propertyId] of Object.entries(propertyMap)) {
    const listingId = listingMap[mockId];
    if (listingId) {
      await db.update(listings).set({ propertyId }).where(eq(listings.id, listingId));
    }
  }

  // ─── 4d. Buyer Preferences ────────────────────────────────────────────
  console.log('  Inserting buyer preferences...');
  const buyerPreferenceData = [
    {
      contactMock: 'c-5', // Sarah Kim
      lookingForType: 'buy',
      preferredBedsMin: 4,
      preferredBathsMin: 2.5,
      preferredSqftMin: 2200,
      preferredPriceMax: 2500000,
      preferredAreas: ['Los Gatos', 'Saratoga'],
      preferredPropertyTypes: ['single_family'],
      preferredFeatures: [
        { feature: 'good_schools', required: true },
        { feature: 'garage', required: true },
        { feature: 'backyard', required: false },
      ],
      notes: 'Relocating family with two school-age kids. Top priority is school district quality. Prefers Los Gatos schools.',
    },
    {
      contactMock: 'c-6', // Brian Foster
      lookingForType: 'buy',
      preferredBedsMin: 2,
      preferredBedsMax: 3,
      preferredBathsMin: 2,
      preferredSqftMin: 1600,
      preferredSqftMax: 2800,
      preferredPriceMax: 3000000,
      preferredAreas: ['Los Altos', 'Mountain View', 'Palo Alto'],
      preferredPropertyTypes: ['single_family'],
      preferredFeatures: [
        { feature: 'single_story', required: true },
        { feature: 'low_maintenance_yard', required: false },
        { feature: 'updated_kitchen', required: false },
      ],
      notes: 'Downsizer couple, retiring. Must be single story — mobility considerations. Prefer turnkey, minimal renovation.',
    },
    {
      contactMock: 'c-7', // Diana Reyes
      lookingForType: 'buy',
      preferredBedsMin: 4,
      preferredBathsMin: 2.5,
      preferredSqftMin: 2400,
      preferredPriceMin: 2000000,
      preferredPriceMax: 3500000,
      preferredAreas: ['Cupertino', 'Sunnyvale'],
      preferredPropertyTypes: ['single_family'],
      preferredFeatures: [
        { feature: 'good_schools', required: true },
        { feature: 'pool', required: false },
        { feature: 'home_office', required: true },
      ],
      notes: 'Tech relocatee family moving from Seattle. Cupertino schools are the draw. Needs home office for remote work. Flexible on age of home but wants move-in ready.',
    },
  ];

  for (const bp of buyerPreferenceData) {
    await db.insert(buyerPreferences).values({
      id: randomUUID(),
      contactId: contactMap[bp.contactMock],
      lookingForType: bp.lookingForType,
      isActive: true,
      preferredBedsMin: bp.preferredBedsMin,
      preferredBedsMax: 'preferredBedsMax' in bp ? bp.preferredBedsMax : undefined,
      preferredBathsMin: bp.preferredBathsMin,
      preferredSqftMin: bp.preferredSqftMin,
      preferredSqftMax: 'preferredSqftMax' in bp ? bp.preferredSqftMax : undefined,
      preferredPriceMin: 'preferredPriceMin' in bp ? bp.preferredPriceMin : undefined,
      preferredPriceMax: bp.preferredPriceMax,
      preferredAreas: bp.preferredAreas,
      preferredPropertyTypes: bp.preferredPropertyTypes,
      preferredFeatures: bp.preferredFeatures,
      notes: bp.notes,
    });
  }

  // ─── 4e. External Listings ────────────────────────────────────────────
  console.log('  Inserting external listings...');

  // External property: Sarah Kim mentions a new listing she has in Los Gatos
  const extProp1Id = randomUUID();
  await db.insert(properties).values({
    id: extProp1Id,
    address: '1425 Bachman Drive',
    city: 'Los Gatos',
    state: 'CA',
    zip: '95032',
    county: 'Santa Clara',
    lat: 37.2285,
    lng: -121.9550,
    beds: 4,
    baths: 3,
    sqft: 2650,
    lotSqft: 9200,
    yearBuilt: 1975,
    propertyType: 'SINGLE_FAMILY',
    stories: 2,
    features: {
      pool: false, garage: true, fireplace: true,
      heating: ['Forced air', 'Gas'], cooling: ['Central AC'],
      flooring: ['Hardwood', 'Carpet'],
    },
    walkabilityScore: 55,
    transitScore: 30,
    bikeScore: 48,
    neighborhood: 'Blossom Hill',
    photos: [],
  });

  await db.insert(externalListings).values({
    id: randomUUID(),
    propertyId: extProp1Id,
    teamId,
    source: 'agent_mention',
    mentionedBy: 'Sarah Kim (Compass)',
    listedPrice: 2295000,
    listedDate: parseDate('2026-04-10'),
    status: 'active',
    listingAgentName: 'Sarah Kim',
    listingAgentEmail: 'sarah.kim@compass.com',
    listingAgentPhone: '(650) 555-2200',
    listingAgentCompany: 'Compass',
    relevanceTo: 'Buyers looking for 4BR in Los Gatos under $2.5M',
    notes: 'Sarah mentioned this at the 123 Main open house. Just listed — 4BR/3BA on a quiet cul-de-sac. Updated kitchen. Could work for relocatee families targeting Los Gatos schools.',
    isActive: true,
  });

  // External property: market scan find in Cupertino
  const extProp2Id = randomUUID();
  await db.insert(properties).values({
    id: extProp2Id,
    address: '10340 Ainsworth Drive',
    city: 'Cupertino',
    state: 'CA',
    zip: '95014',
    county: 'Santa Clara',
    lat: 37.3180,
    lng: -122.0410,
    beds: 5,
    baths: 3,
    sqft: 2800,
    lotSqft: 8800,
    yearBuilt: 1968,
    propertyType: 'SINGLE_FAMILY',
    stories: 1,
    features: {
      pool: true, garage: true, fireplace: true,
      heating: ['Forced air', 'Gas'], cooling: ['Central AC'],
      flooring: ['Hardwood', 'Tile'],
    },
    walkabilityScore: 52,
    transitScore: 35,
    bikeScore: 62,
    neighborhood: 'Rancho Rinconada',
    photos: [],
  });

  await db.insert(externalListings).values({
    id: randomUUID(),
    propertyId: extProp2Id,
    teamId,
    source: 'market_scan',
    sourceUrl: 'https://www.redfin.com/CA/Cupertino/10340-Ainsworth-Dr-95014',
    listedPrice: 2850000,
    listedDate: parseDate('2026-04-08'),
    status: 'active',
    listingAgentName: 'James Liu',
    listingAgentCompany: 'Coldwell Banker',
    relevanceTo: 'Diana Reyes buyer — 4BR+ Cupertino schools',
    notes: 'Flagged in daily market scan. 5BR single-story in Cupertino with pool. In Monta Vista HS district. Worth sharing with Diana Reyes for her tech relocatee client.',
    isActive: true,
  });

  // ─── 5. Tasks ─────────────────────────────────────────────────────────
  console.log('  Inserting tasks...');
  const taskData = [
    // ── l-1: 123 Main Street (ACTIVE — pre-market done, active in progress) ──
    // Client Onboarding (all done)
    { mockId: 't-1', title: 'Complete client intake form', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-10', isOverdue: false },
    { mockId: 't-2', title: 'Review & sign listing agreement', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-12', isOverdue: false },
    { mockId: 't-3', title: 'Conduct expectations & timeline meeting', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-13', isOverdue: false },
    { mockId: 't-4', title: 'Set up communication plan', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-14', isOverdue: false },
    { mockId: 't-5', title: 'Prepare & deliver onboarding packet', status: 'done' as const, priority: 'low' as const, assigneeMock: 'tm-3', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-15', isOverdue: false },
    // Pre-Listing Logistics (all done)
    { mockId: 't-6', title: 'Order seller inspection (pre-listing)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-03-14', isOverdue: false },
    { mockId: 't-7', title: 'Select title/escrow company', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-3', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-03-16', isOverdue: false },
    { mockId: 't-8', title: 'Order disclosure package (TDS, SPQ, NHD)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-03-18', isOverdue: false },
    { mockId: 't-9', title: 'Set up escrow communication channel', status: 'done' as const, priority: 'low' as const, assigneeMock: 'tm-3', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-03-19', isOverdue: false },
    // Media Production (all done)
    { mockId: 't-10', title: 'Schedule professional photography shoot', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-03-28', isOverdue: false },
    { mockId: 't-11', title: 'Coordinate aerial drone photography', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-03-29', isOverdue: false },
    { mockId: 't-12', title: 'Book 3D Matterport virtual tour', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-03-30', isOverdue: false },
    { mockId: 't-13', title: 'Select & order MLS photos', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-04-01', isOverdue: false },
    { mockId: 't-14', title: 'Design property brochure & print materials', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-04-02', isOverdue: false },
    // Launch & Marketing (in progress)
    { mockId: 't-15', title: 'Create & syndicate MLS listing', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-04', isOverdue: false },
    { mockId: 't-16', title: 'Publish website listing page', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-04', isOverdue: false },
    { mockId: 't-17', title: 'Launch social media marketing campaign', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-05', isOverdue: false },
    { mockId: 't-18', title: 'Optimize Zillow/Redfin/Realtor.com listings', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-10', isOverdue: false },
    { mockId: 't-19', title: 'Send email announcement to agent network', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-05', isOverdue: false },
    { mockId: 't-20', title: 'Schedule first open house', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-06', isOverdue: false },
    { mockId: 't-21', title: 'Establish weekly market report cadence to client', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-12', isOverdue: false },
    // Showings & Feedback (in progress)
    { mockId: 't-22', title: 'Prepare showing instructions & lockbox setup', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-04', isOverdue: false },
    { mockId: 't-23', title: 'Coordinate agent showing requests', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-15', isOverdue: false },
    { mockId: 't-24', title: 'Send weekly showing report to client', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-11', isOverdue: false },
    // Offer Review (starting)
    { mockId: 't-25', title: 'Receive & document incoming offer', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-3', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-09', isOverdue: false },
    { mockId: 't-26', title: 'Prepare offer comparison analysis', status: 'in_progress' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-1', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-10', isOverdue: false },

    // ── l-2: 456 Oak Avenue (ACTIVE — longer on market, showings + marketing) ──
    // Pre-market tasks (all done)
    { mockId: 't-27', title: 'Complete client intake form', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-01', isOverdue: false },
    { mockId: 't-28', title: 'Review & sign listing agreement', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-2', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-03', isOverdue: false },
    { mockId: 't-29', title: 'Order disclosure package (TDS, SPQ, NHD)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-2', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-03-06', isOverdue: false },
    { mockId: 't-30', title: 'Schedule professional photography shoot', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-2', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-03-14', isOverdue: false },
    { mockId: 't-31', title: 'Pull comparable sales & market data', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-03-10', isOverdue: false },
    { mockId: 't-32', title: 'Obtain listing price approval & sign-off', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-03-18', isOverdue: false },
    // Launch & Marketing (mostly done)
    { mockId: 't-33', title: 'Create & syndicate MLS listing', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-03-22', isOverdue: false },
    { mockId: 't-34', title: 'Launch social media marketing campaign', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-03-23', isOverdue: false },
    { mockId: 't-35', title: 'Set up paid advertising (Google, Facebook/Meta)', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-03-25', isOverdue: false },
    { mockId: 't-36', title: 'Distribute print marketing collateral', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-04-12', isOverdue: false },
    // Showings & Feedback (active)
    { mockId: 't-37', title: 'Prepare showing instructions & lockbox setup', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-03-22', isOverdue: false },
    { mockId: 't-38', title: 'Host/staff open houses', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-13', isOverdue: false },
    { mockId: 't-39', title: 'Collect showing feedback from agents', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-11', isOverdue: false },
    { mockId: 't-40', title: 'Send weekly showing report to client', status: 'overdue' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-05', isOverdue: true },
    { mockId: 't-41', title: 'Analyze showing trends & recommend adjustments', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-2', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-04-14', isOverdue: false },

    // ── l-3: 789 Elm Street (PRE_MARKET — mid-way through prep) ──
    // Client Onboarding (done)
    { mockId: 't-42', title: 'Complete client intake form', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-02', isOverdue: false },
    { mockId: 't-43', title: 'Review & sign listing agreement', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-03', isOverdue: false },
    { mockId: 't-44', title: 'Conduct expectations & timeline meeting', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-2', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-04', isOverdue: false },
    { mockId: 't-45', title: 'Set up communication plan', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-2', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-05', isOverdue: false },
    { mockId: 't-46', title: 'Prepare & deliver onboarding packet', status: 'done' as const, priority: 'low' as const, assigneeMock: 'tm-3', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-06', isOverdue: false },
    // Pre-Listing Logistics (in progress)
    { mockId: 't-47', title: 'Order seller inspection (pre-listing)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-06', isOverdue: false },
    { mockId: 't-48', title: 'Select title/escrow company', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-3', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-07', isOverdue: false },
    { mockId: 't-49', title: 'Order disclosure package (TDS, SPQ, NHD)', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-11', isOverdue: false },
    { mockId: 't-50', title: 'Set up escrow communication channel', status: 'todo' as const, priority: 'low' as const, assigneeMock: 'tm-3', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-13', isOverdue: false },
    // Improvements & Repairs (in progress)
    { mockId: 't-51', title: 'Analyze home inspection findings', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-08', isOverdue: false },
    { mockId: 't-52', title: 'Identify recommended cosmetic improvements', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-5', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-09', isOverdue: false },
    { mockId: 't-53', title: 'Collect contractor quotes (minimum 2 per trade)', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-5', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-12', isOverdue: false },
    { mockId: 't-54', title: 'Review improvement costs vs. market impact with client', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-2', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-14', isOverdue: false },
    // Media Production (upcoming)
    { mockId: 't-55', title: 'Schedule professional photography shoot', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-04-14', isOverdue: false },
    { mockId: 't-56', title: 'Coordinate aerial drone photography', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-04-15', isOverdue: false },
    { mockId: 't-57', title: 'Design property brochure & print materials', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-4', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-04-16', isOverdue: false },
    // Pricing & Market Strategy (starting)
    { mockId: 't-58', title: 'Pull comparable sales & market data', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-04-12', isOverdue: false },
    { mockId: 't-59', title: 'Develop pricing recommendation', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-3', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-04-15', isOverdue: false },

    // ── l-4: 2200 Willow Glen Way (PRE_MARKET — staging phase) ──
    // Client Onboarding (done)
    { mockId: 't-60', title: 'Complete client intake form', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-28', isOverdue: false },
    { mockId: 't-61', title: 'Review & sign listing agreement', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-03-30', isOverdue: false },
    { mockId: 't-62', title: 'Prepare & deliver onboarding packet', status: 'done' as const, priority: 'low' as const, assigneeMock: 'tm-3', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-01', isOverdue: false },
    // Pre-Listing Logistics (done)
    { mockId: 't-63', title: 'Order seller inspection (pre-listing)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-01', isOverdue: false },
    { mockId: 't-64', title: 'Order disclosure package (TDS, SPQ, NHD)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-04', isOverdue: false },
    // Staging & Preparation (in progress)
    { mockId: 't-65', title: 'Schedule staging consultation', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-5', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'staging' as const, dueDate: '2026-04-03', isOverdue: false },
    { mockId: 't-66', title: 'Coordinate furniture rental & delivery', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-5', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'staging' as const, dueDate: '2026-04-15', isOverdue: false, subtasks: [{ title: 'Confirm delivery window with Meridian', done: true }, { title: 'Arrange parking for delivery truck', done: false }, { title: 'Client walkthrough post-staging', done: false }] },
    { mockId: 't-67', title: 'Oversee staging installation', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-5', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'staging' as const, dueDate: '2026-04-16', isOverdue: false },
    { mockId: 't-68', title: 'Styling, decluttering & deep cleaning', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-5', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'staging' as const, dueDate: '2026-04-17', isOverdue: false },
    { mockId: 't-69', title: 'Client walkthrough of staged home', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-2', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'staging' as const, dueDate: '2026-04-18', isOverdue: false },
    // Pricing & Market Strategy (in progress)
    { mockId: 't-70', title: 'Pull comparable sales & market data', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-04-05', isOverdue: false },
    { mockId: 't-71', title: 'Prepare market positioning analysis', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-2', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-04-12', isOverdue: false },
    { mockId: 't-72', title: 'Conduct price strategy discussion with client', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-4', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-04-18', isOverdue: false },

    // ── l-5: 1580 University Avenue (PRE_MARKET — early onboarding) ──
    { mockId: 't-73', title: 'Complete client intake form', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-08', isOverdue: false },
    { mockId: 't-74', title: 'Review & sign listing agreement', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-09', isOverdue: false },
    { mockId: 't-75', title: 'Conduct expectations & timeline meeting', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-12', isOverdue: false },
    { mockId: 't-76', title: 'Set up communication plan', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-13', isOverdue: false },
    { mockId: 't-77', title: 'Prepare & deliver onboarding packet', status: 'todo' as const, priority: 'low' as const, assigneeMock: 'tm-3', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-14', isOverdue: false },
    { mockId: 't-78', title: 'Order seller inspection (pre-listing)', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-15', isOverdue: false },
    { mockId: 't-79', title: 'Select title/escrow company', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-3', listingMock: 'l-5', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-17', isOverdue: false },

    // ── l-6: 945 Cherry Blossom Lane (ACTIVE — under offer negotiation) ──
    // Pre-market (all done)
    { mockId: 't-80', title: 'Complete client intake form', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-02-20', isOverdue: false },
    { mockId: 't-81', title: 'Order disclosure package (TDS, SPQ, NHD)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-6', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-02-25', isOverdue: false },
    { mockId: 't-82', title: 'Schedule professional photography shoot', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-6', phase: 'pre_market' as const, taskCategory: 'media' as const, dueDate: '2026-03-02', isOverdue: false },
    { mockId: 't-83', title: 'Obtain listing price approval & sign-off', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-03-08', isOverdue: false },
    // Launch & Marketing (done)
    { mockId: 't-84', title: 'Create & syndicate MLS listing', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-03-12', isOverdue: false },
    { mockId: 't-85', title: 'Launch social media marketing campaign', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-4', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-03-13', isOverdue: false },
    // Showings (done)
    { mockId: 't-86', title: 'Host/staff open houses', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-03-20', isOverdue: false },
    { mockId: 't-87', title: 'Collect showing feedback from agents', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-03-25', isOverdue: false },
    // Offer Review & Negotiation (active)
    { mockId: 't-88', title: 'Receive & document incoming offer', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-3', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-07', isOverdue: false },
    { mockId: 't-89', title: 'Prepare offer comparison analysis', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-08', isOverdue: false },
    { mockId: 't-90', title: 'Schedule client offer review meeting', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-09', isOverdue: false },
    { mockId: 't-91', title: 'Develop counter-offer strategy', status: 'in_progress' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-10', isOverdue: false },
    { mockId: 't-92', title: 'Submit counter-offer', status: 'todo' as const, priority: 'urgent' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-11', isOverdue: false },
    { mockId: 't-93', title: 'Follow up on negotiation responses', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-1', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-12', isOverdue: false },
    { mockId: 't-94', title: 'Review buyer contingencies & terms', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-6', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-04-13', isOverdue: false },

    // ── l-7: 310 Waverly Street (ACTIVE — under contract, in contingencies) ──
    // Pre-market (all done)
    { mockId: 't-95', title: 'Complete client intake form', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-7', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-02-10', isOverdue: false },
    { mockId: 't-96', title: 'Order disclosure package (TDS, SPQ, NHD)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-7', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-02-15', isOverdue: false },
    { mockId: 't-97', title: 'Obtain listing price approval & sign-off', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-7', phase: 'pre_market' as const, taskCategory: 'pricing' as const, dueDate: '2026-02-28', isOverdue: false },
    // Active — marketing + showings (done)
    { mockId: 't-98', title: 'Create & syndicate MLS listing', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-2', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'marketing' as const, dueDate: '2026-03-05', isOverdue: false },
    { mockId: 't-99', title: 'Host/staff open houses', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'showings' as const, dueDate: '2026-03-10', isOverdue: false },
    // Offer accepted
    { mockId: 't-100', title: 'Execute offer acceptance & purchase agreement', status: 'done' as const, priority: 'urgent' as const, assigneeMock: 'tm-2', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'offers' as const, dueDate: '2026-03-30', isOverdue: false },
    // Contingency Management (in progress)
    { mockId: 't-101', title: 'Coordinate buyer inspection contingency', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'escrow' as const, dueDate: '2026-04-12', isOverdue: false },
    { mockId: 't-102', title: 'Monitor appraisal contingency timeline', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'escrow' as const, dueDate: '2026-04-15', isOverdue: false },
    { mockId: 't-103', title: 'Track loan contingency & pre-approval status', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'escrow' as const, dueDate: '2026-04-18', isOverdue: false },
    { mockId: 't-104', title: 'Review title report contingency', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-3', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'escrow' as const, dueDate: '2026-04-16', isOverdue: false },
    { mockId: 't-105', title: 'Negotiate repair credits or remediation', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-2', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'escrow' as const, dueDate: '2026-04-18', isOverdue: false },
    { mockId: 't-106', title: 'Confirm all contingency removals in writing', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-7', phase: 'active' as const, taskCategory: 'escrow' as const, dueDate: '2026-04-22', isOverdue: false },

    // ── l-8: 88 Sunnyvale Avenue (PRE_MARKET — early improvements phase) ──
    // Client Onboarding (done)
    { mockId: 't-107', title: 'Complete client intake form', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-01', isOverdue: false },
    { mockId: 't-108', title: 'Review & sign listing agreement', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-02', isOverdue: false },
    { mockId: 't-109', title: 'Conduct expectations & timeline meeting', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-2', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-03', isOverdue: false },
    { mockId: 't-110', title: 'Prepare & deliver onboarding packet', status: 'done' as const, priority: 'low' as const, assigneeMock: 'tm-3', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, dueDate: '2026-04-04', isOverdue: false },
    // Pre-Listing Logistics (in progress)
    { mockId: 't-111', title: 'Order seller inspection (pre-listing)', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-04', isOverdue: false },
    { mockId: 't-112', title: 'Order disclosure package (TDS, SPQ, NHD)', status: 'in_progress' as const, priority: 'high' as const, assigneeMock: 'tm-3', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, dueDate: '2026-04-12', isOverdue: false },
    // Improvements & Repairs (in progress)
    { mockId: 't-113', title: 'Analyze home inspection findings', status: 'done' as const, priority: 'high' as const, assigneeMock: 'tm-2', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-06', isOverdue: false },
    { mockId: 't-114', title: 'Identify recommended cosmetic improvements', status: 'done' as const, priority: 'medium' as const, assigneeMock: 'tm-5', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-07', isOverdue: false },
    { mockId: 't-115', title: 'Collect contractor quotes (minimum 2 per trade)', status: 'in_progress' as const, priority: 'medium' as const, assigneeMock: 'tm-5', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-11', isOverdue: false },
    { mockId: 't-116', title: 'Review improvement costs vs. market impact with client', status: 'todo' as const, priority: 'medium' as const, assigneeMock: 'tm-2', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-15', isOverdue: false },
    { mockId: 't-117', title: 'Schedule & oversee repairs/improvements', status: 'todo' as const, priority: 'high' as const, assigneeMock: 'tm-5', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-22', isOverdue: false },
    { mockId: 't-118', title: 'Document before/after photos', status: 'todo' as const, priority: 'low' as const, assigneeMock: 'tm-4', listingMock: 'l-8', phase: 'pre_market' as const, taskCategory: 'improvements' as const, dueDate: '2026-04-25', isOverdue: false },
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
    'Bryce Reynolds': 'tm-1',
    'Marcus Rivera': 'tm-2',
    'Priya Patel': 'tm-3',
    'Jordan Nakamura': 'tm-4',
    'Sofia Andrade': 'tm-5',
  };

  const activityData = [
    { mockId: 'a-1', type: 'message' as const, authorName: 'David Nguyen', authorInitials: 'DN', timestamp: '2026-04-09T09:15:00', content: 'Hi Lauren, can we discuss the open house schedule for this weekend? We had some feedback from the neighbors about parking.', listingMock: 'l-1' },
    { mockId: 'a-2', type: 'system' as const, authorName: 'System', authorInitials: 'HT', timestamp: '2026-04-09T08:30:00', content: 'New showing request from Brian Foster (Sereno Group) for April 11 at 2:00 PM.', listingMock: 'l-2' },
    { mockId: 'a-3', type: 'email' as const, authorName: 'Rebecca Thornton', authorInitials: 'RT', timestamp: '2026-04-09T07:45:00', content: 'RE: Photography Schedule — Looks great! I approved the twilight shoot for Thursday.', listingMock: 'l-2', metadata: { subject: 'RE: Photography Schedule' } },
    { mockId: 'a-4', type: 'voice_memo' as const, authorName: 'Bryce Reynolds', authorInitials: 'BR', timestamp: '2026-04-08T17:30:00', content: 'Quick note after showing at 123 Main — buyer seemed very interested in the remodeled kitchen.', listingMock: 'l-1', metadata: { duration: '0:42' } },
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
    { type: 'connection' as const, title: 'Buyer match found', description: "Sarah Kim's buyer (4BR, Los Gatos, under $2.5M, good schools) matches your new listing at 123 Main Street.", listingMock: 'l-1', actionLabel: 'Message Sarah Kim', actionUrl: `/contacts/${contactMap['c-5']}`, timestamp: '2026-04-09T06:00:00', dismissed: false },
    { type: 'anomaly' as const, title: 'Showing interest declining', description: 'Showing volume for 456 Oak Ave dropped 30% week-over-week.', listingMock: 'l-2', actionLabel: 'View analytics', actionUrl: `/listings/${listingMap['l-2']}/analytics`, timestamp: '2026-04-09T06:00:00', dismissed: false },
    { type: 'warning' as const, title: 'Unanswered client message', description: 'David Nguyen asked about the open house parking situation 2 hours ago.', listingMock: 'l-1', actionLabel: 'Reply now', actionUrl: `/listings/${listingMap['l-1']}/activity`, timestamp: '2026-04-09T11:00:00', dismissed: false },
    { type: 'recommendation' as const, title: 'Pricing recommendation', description: 'Based on 6 comparable sales, the suggested list price range for 789 Elm Street is $2,050,000-$2,200,000.', listingMock: 'l-3', actionLabel: 'View comps', actionUrl: '/analytics', timestamp: '2026-04-08T12:00:00', dismissed: false },
    { type: 'connection' as const, title: 'Agent match for upcoming listing', description: "Diana Reyes has a tech relocatee buyer looking for 4BR+ in Cupertino.", listingMock: 'l-3', actionLabel: 'View agent profile', actionUrl: `/contacts/${contactMap['c-7']}`, timestamp: '2026-04-08T14:00:00', dismissed: false },
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
    { listingMock: 'l-8', date: '2026-04-10', time: '10:00 AM', agentName: 'Sarah Kim', agentCompany: 'Compass', buyerType: 'Investor', feedback: 'Good bones. Needs cosmetic work but priced well for the area.', rating: 3, interestedLevel: 'somewhat' as const },
    { listingMock: 'l-8', date: '2026-04-09', time: '3:00 PM', agentName: 'Brian Foster', agentCompany: 'Sereno Group', buyerType: 'First-time buyer', feedback: 'Love the location near Murphy Ave. Concerned about lack of updates.', rating: 3, interestedLevel: 'somewhat' as const },
    // Showings for l-3 (pre-market broker preview)
    { listingMock: 'l-3', date: '2026-04-11', time: '11:00 AM', agentName: 'Diana Reyes', agentCompany: 'Keller Williams', buyerType: 'Tech relocatee family', feedback: 'Great school district. Home needs some updating but the layout is ideal.', rating: 4, interestedLevel: 'very' as const },
    { listingMock: 'l-3', date: '2026-04-10', time: '2:00 PM', agentName: 'Sarah Kim', agentCompany: 'Compass', buyerType: 'Move-up buyer', feedback: 'Broker preview — nice bones, needs staging to show its potential.', rating: 3, interestedLevel: 'somewhat' as const },
    // Showings for l-4 (pre-market broker preview)
    { listingMock: 'l-4', date: '2026-04-09', time: '10:00 AM', agentName: 'Brian Foster', agentCompany: 'Sereno Group', buyerType: 'Downsizer couple', feedback: 'Charming period details. Walkability is a huge plus. Will bring buyers once listed.', rating: 4, interestedLevel: 'very' as const },
    // Showings for l-5 (pre-market early preview)
    { listingMock: 'l-5', date: '2026-04-11', time: '4:00 PM', agentName: 'Diana Reyes', agentCompany: 'Keller Williams', buyerType: 'Young professional', feedback: 'Great starter home. Near Caltrain is a big draw. EV charging is a nice touch.', rating: 4, interestedLevel: 'very' as const },
    // Showings for l-7 (active, under contract — historical showings)
    { listingMock: 'l-7', date: '2026-03-12', time: '11:00 AM', agentName: 'Sarah Kim', agentCompany: 'Compass', buyerType: 'Stanford professor', feedback: 'Perfect location. Loved the mid-century character. Made an offer.', rating: 5, interestedLevel: 'very' as const },
    { listingMock: 'l-7', date: '2026-03-10', time: '2:00 PM', agentName: 'Brian Foster', agentCompany: 'Sereno Group', buyerType: 'Downsizer couple', feedback: 'Beautiful home but they need single-story. ADU potential is interesting.', rating: 3, interestedLevel: 'somewhat' as const },
    { listingMock: 'l-7', date: '2026-03-14', time: '10:00 AM', agentName: 'Diana Reyes', agentCompany: 'Keller Williams', buyerType: 'Tech family', feedback: 'Liked the updates and Stanford proximity. Concerned about lot size.', rating: 4, interestedLevel: 'somewhat' as const },
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
    // Offers for l-2 (active, 18 days on market)
    { listingMock: 'l-2', buyerName: 'Hartley Family Trust', buyerAgent: 'Sarah Kim', price: 3750000, earnestDeposit: 120000, contingencies: ['Inspection (10 days)', 'Appraisal'], closeDate: '2026-05-20', financingType: 'Conventional 30% down', status: 'received' as const, submittedDate: '2026-04-10', expirationDate: '2026-04-14', notes: 'Strong pre-approval. Buyers love the neighborhood and pool.' },
    { listingMock: 'l-2', buyerName: 'Mehta & Associates LLC', buyerAgent: 'Diana Reyes', price: 3680000, earnestDeposit: 100000, contingencies: ['Inspection (7 days)', 'Appraisal', 'Loan (21 days)'], closeDate: '2026-05-30', financingType: 'Jumbo loan 20% down', status: 'received' as const, submittedDate: '2026-04-11', expirationDate: '2026-04-15', notes: 'Relocating tech executive. Flexible on close date but wants inspection credits.' },
    // Offers for l-3 (approaching list date, received early interest)
    { listingMock: 'l-3', buyerName: 'Tanaka Family', buyerAgent: 'Diana Reyes', price: 2100000, earnestDeposit: 60000, contingencies: ['Inspection (10 days)', 'Appraisal'], closeDate: '2026-05-25', financingType: 'Conventional 25% down', status: 'received' as const, submittedDate: '2026-04-12', expirationDate: '2026-04-16', notes: 'Pre-emptive offer before listing goes live. Strong Cupertino school interest.' },
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
    {
      listingMock: 'l-3', totalBudget: 18000, spent: 8200, remaining: 9800, pendingQuotes: 2,
      categories: [
        { name: 'Repairs', budgeted: 5000, actual: 3200, variance: 1800 },
        { name: 'Staging', budgeted: 5500, actual: 0, variance: 5500 },
        { name: 'Photography & Video', budgeted: 2200, actual: 2200, variance: 0 },
        { name: 'Marketing & Ads', budgeted: 3000, actual: 1500, variance: 1500 },
        { name: 'Closing Costs', budgeted: 2300, actual: 1300, variance: 1000 },
      ],
    },
    {
      listingMock: 'l-4', totalBudget: 15000, spent: 7800, remaining: 7200, pendingQuotes: 1,
      categories: [
        { name: 'Staging', budgeted: 5800, actual: 5800, variance: 0 },
        { name: 'Repairs', budgeted: 3500, actual: 2000, variance: 1500 },
        { name: 'Photography', budgeted: 1800, actual: 0, variance: 1800 },
        { name: 'Closing Costs', budgeted: 3900, actual: 0, variance: 3900 },
      ],
    },
    {
      listingMock: 'l-5', totalBudget: 8500, spent: 1200, remaining: 7300, pendingQuotes: 0,
      categories: [
        { name: 'Repairs', budgeted: 2500, actual: 1200, variance: 1300 },
        { name: 'Staging', budgeted: 2500, actual: 0, variance: 2500 },
        { name: 'Photography', budgeted: 1500, actual: 0, variance: 1500 },
        { name: 'Closing Costs', budgeted: 2000, actual: 0, variance: 2000 },
      ],
    },
    {
      listingMock: 'l-6', totalBudget: 42000, spent: 39500, remaining: 2500, pendingQuotes: 0,
      categories: [
        { name: 'Staging (Luxury)', budgeted: 9500, actual: 9200, variance: 300 },
        { name: 'Repairs & Updates', budgeted: 15000, actual: 16200, variance: -1200 },
        { name: 'Photography & Drone', budgeted: 3500, actual: 3500, variance: 0 },
        { name: 'Marketing & Ads', budgeted: 8000, actual: 7600, variance: 400 },
        { name: 'Closing Costs', budgeted: 6000, actual: 3000, variance: 3000 },
      ],
    },
    {
      listingMock: 'l-7', totalBudget: 32000, spent: 30200, remaining: 1800, pendingQuotes: 0,
      categories: [
        { name: 'Staging', budgeted: 7000, actual: 6800, variance: 200 },
        { name: 'Repairs', budgeted: 8000, actual: 9500, variance: -1500 },
        { name: 'Photography & Video', budgeted: 2800, actual: 2800, variance: 0 },
        { name: 'Marketing & Ads', budgeted: 6000, actual: 5200, variance: 800 },
        { name: 'Closing Costs', budgeted: 8200, actual: 5900, variance: 2300 },
      ],
    },
    {
      listingMock: 'l-8', totalBudget: 22000, spent: 0, remaining: 22000, pendingQuotes: 2,
      categories: [
        { name: 'Bathroom Renovation', budgeted: 12400, actual: 0, variance: 12400 },
        { name: 'Interior Repaint', budgeted: 4200, actual: 0, variance: 4200 },
        { name: 'Staging', budgeted: 3000, actual: 0, variance: 3000 },
        { name: 'Photography', budgeted: 1200, actual: 0, variance: 1200 },
        { name: 'Closing Costs', budgeted: 1200, actual: 0, variance: 1200 },
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
    'Bryce Reynolds': 'tm-1',
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
    { name: 'Listing Agreement', category: 'contracts' as const, listingMock: 'l-1', uploadedBy: 'Bryce Reynolds', uploadedDate: '2026-03-20', fileSize: '320 KB', fileType: 'PDF', status: 'signed' as const, version: 2 },
    { name: 'MLS Photo Package', category: 'photos' as const, listingMock: 'l-1', uploadedBy: 'Kevin Tran', uploadedDate: '2026-04-02', fileSize: '48 MB', fileType: 'ZIP', status: 'complete' as const, version: 1 },
    { name: 'Property Brochure', category: 'marketing' as const, listingMock: 'l-1', uploadedBy: 'Jordan Nakamura', uploadedDate: '2026-04-03', fileSize: '5.2 MB', fileType: 'PDF', status: 'complete' as const, version: 3 },
    { name: 'Purchase Agreement - Chen-Williams', category: 'contracts' as const, listingMock: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-09', fileSize: '420 KB', fileType: 'PDF', status: 'pending_signature' as const, version: 1 },
    { name: 'Preliminary Title Report', category: 'title' as const, listingMock: 'l-2', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-18', fileSize: '2.1 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    // Documents for l-3
    { name: 'Listing Agreement', category: 'contracts' as const, listingMock: 'l-3', uploadedBy: 'Marcus Rivera', uploadedDate: '2026-04-03', fileSize: '310 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Home Inspection Report', category: 'inspection' as const, listingMock: 'l-3', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-08', fileSize: '4.1 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    { name: 'Transfer Disclosure Statement (TDS)', category: 'disclosures' as const, listingMock: 'l-3', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-11', fileSize: '220 KB', fileType: 'PDF', status: 'draft' as const, version: 1 },
    // Documents for l-4
    { name: 'Listing Agreement', category: 'contracts' as const, listingMock: 'l-4', uploadedBy: 'Marcus Rivera', uploadedDate: '2026-03-30', fileSize: '295 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Home Inspection Report', category: 'inspection' as const, listingMock: 'l-4', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-02', fileSize: '3.6 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    { name: 'Seller Property Questionnaire (SPQ)', category: 'disclosures' as const, listingMock: 'l-4', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-04', fileSize: '175 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Staging Proposal', category: 'marketing' as const, listingMock: 'l-4', uploadedBy: 'Sofia Andrade', uploadedDate: '2026-04-05', fileSize: '2.8 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    // Documents for l-5
    { name: 'Listing Agreement', category: 'contracts' as const, listingMock: 'l-5', uploadedBy: 'Bryce Reynolds', uploadedDate: '2026-04-09', fileSize: '280 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Client Intake Form', category: 'contracts' as const, listingMock: 'l-5', uploadedBy: 'Bryce Reynolds', uploadedDate: '2026-04-08', fileSize: '145 KB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    // Documents for l-6
    { name: 'Transfer Disclosure Statement (TDS)', category: 'disclosures' as const, listingMock: 'l-6', uploadedBy: 'Priya Patel', uploadedDate: '2026-02-28', fileSize: '260 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Natural Hazard Disclosure (NHD)', category: 'disclosures' as const, listingMock: 'l-6', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-01', fileSize: '1.4 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    { name: 'Listing Agreement', category: 'contracts' as const, listingMock: 'l-6', uploadedBy: 'Bryce Reynolds', uploadedDate: '2026-02-22', fileSize: '340 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Property Brochure', category: 'marketing' as const, listingMock: 'l-6', uploadedBy: 'Jordan Nakamura', uploadedDate: '2026-03-11', fileSize: '6.1 MB', fileType: 'PDF', status: 'complete' as const, version: 2 },
    // Documents for l-7
    { name: 'Transfer Disclosure Statement (TDS)', category: 'disclosures' as const, listingMock: 'l-7', uploadedBy: 'Priya Patel', uploadedDate: '2026-02-18', fileSize: '235 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Purchase Agreement - Accepted', category: 'contracts' as const, listingMock: 'l-7', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-30', fileSize: '450 KB', fileType: 'PDF', status: 'signed' as const, version: 1 },
    { name: 'Home Inspection Report', category: 'inspection' as const, listingMock: 'l-7', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-05', fileSize: '3.9 MB', fileType: 'PDF', status: 'complete' as const, version: 1 },
    { name: 'Appraisal Report', category: 'inspection' as const, listingMock: 'l-7', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-10', fileSize: '2.5 MB', fileType: 'PDF', status: 'pending_signature' as const, version: 1 },
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

  // ─── 12b. Files (S3-backed) ─────────────────────────────────────────
  console.log('  Inserting files...');
  const fileData = [
    { filename: 'tds-signed.pdf', originalFilename: 'Transfer Disclosure Statement (TDS).pdf', mimeType: 'application/pdf', sizeBytes: 250880, category: 'disclosure', listingMock: 'l-1', uploadedByMock: 'tm-3', accessLevel: 'team' },
    { filename: 'spq-signed.pdf', originalFilename: 'Seller Property Questionnaire (SPQ).pdf', mimeType: 'application/pdf', sizeBytes: 184320, category: 'disclosure', listingMock: 'l-1', uploadedByMock: 'tm-3', accessLevel: 'team' },
    { filename: 'nhd-report.pdf', originalFilename: 'Natural Hazard Disclosure (NHD).pdf', mimeType: 'application/pdf', sizeBytes: 1258291, category: 'disclosure', listingMock: 'l-1', uploadedByMock: 'tm-3', accessLevel: 'team' },
    { filename: 'home-inspection.pdf', originalFilename: 'Home Inspection Report.pdf', mimeType: 'application/pdf', sizeBytes: 3984588, category: 'inspection', listingMock: 'l-1', uploadedByMock: 'tm-3', accessLevel: 'team' },
    { filename: 'listing-agreement-v2.pdf', originalFilename: 'Listing Agreement.pdf', mimeType: 'application/pdf', sizeBytes: 327680, category: 'contract', listingMock: 'l-1', uploadedByMock: 'tm-1', accessLevel: 'listing_members' },
    { filename: 'mls-photos.zip', originalFilename: 'MLS Photo Package.zip', mimeType: 'application/zip', sizeBytes: 50331648, category: 'photo', listingMock: 'l-1', uploadedByMock: 'tm-4', accessLevel: 'team' },
    { filename: 'property-brochure-v3.pdf', originalFilename: 'Property Brochure.pdf', mimeType: 'application/pdf', sizeBytes: 5452595, category: 'marketing', listingMock: 'l-1', uploadedByMock: 'tm-4', accessLevel: 'public' },
    { filename: 'purchase-agreement-chen-williams.pdf', originalFilename: 'Purchase Agreement - Chen-Williams.pdf', mimeType: 'application/pdf', sizeBytes: 430080, category: 'contract', listingMock: 'l-1', uploadedByMock: 'tm-3', accessLevel: 'listing_members' },
    { filename: 'prelim-title-report.pdf', originalFilename: 'Preliminary Title Report.pdf', mimeType: 'application/pdf', sizeBytes: 2202009, category: 'disclosure', listingMock: 'l-2', uploadedByMock: 'tm-3', accessLevel: 'team' },
    { filename: 'hoa-docs.pdf', originalFilename: 'HOA Documents Package.pdf', mimeType: 'application/pdf', sizeBytes: 8912896, category: 'disclosure', listingMock: 'l-8', uploadedByMock: 'tm-2', accessLevel: 'team' },
    { filename: 'renovation-scope-v2.pdf', originalFilename: 'Renovation Scope of Work.pdf', mimeType: 'application/pdf', sizeBytes: 1468006, category: 'general', listingMock: 'l-8', uploadedByMock: 'tm-5', accessLevel: 'team' },
  ];

  for (const f of fileData) {
    const lid = listingMap[f.listingMock];
    const storagePath = `${teamId}/${lid}/${f.filename}`;
    await db.insert(files).values({
      id: randomUUID(),
      teamId,
      listingId: lid,
      uploadedById: tmMap[f.uploadedByMock],
      filename: f.filename,
      originalFilename: f.originalFilename,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      storagePath,
      category: f.category,
      accessLevel: f.accessLevel,
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
    // Marketing assets for l-2
    { listingMock: 'l-2', type: 'photo' as const, name: 'Professional photo package (48 photos)', status: 'complete' as const, date: '2026-03-16' },
    { listingMock: 'l-2', type: 'virtual_tour' as const, name: '3D Matterport walkthrough', status: 'complete' as const, date: '2026-03-17' },
    { listingMock: 'l-2', type: 'social_post' as const, name: 'Instagram carousel — Just Listed', status: 'published' as const, date: '2026-03-22', platform: 'Instagram', metrics: { impressions: 4200, clicks: 210, saves: 58 } },
    { listingMock: 'l-2', type: 'brochure' as const, name: 'Luxury property brochure (digital + print)', status: 'complete' as const, date: '2026-03-20' },
    // Marketing assets for l-4
    { listingMock: 'l-4', type: 'photo' as const, name: 'Professional photos (scheduled post-staging)', status: 'scheduled' as const, date: '2026-04-18' },
    { listingMock: 'l-4', type: 'brochure' as const, name: 'Property brochure draft', status: 'in_production' as const, date: '2026-04-12' },
    // Marketing assets for l-5
    { listingMock: 'l-5', type: 'photo' as const, name: 'Professional photos (pending scheduling)', status: 'scheduled' as const, date: '2026-04-28' },
    { listingMock: 'l-5', type: 'virtual_tour' as const, name: '3D Matterport walkthrough', status: 'scheduled' as const, date: '2026-04-29' },
    // Marketing assets for l-6
    { listingMock: 'l-6', type: 'photo' as const, name: 'Professional photo package (52 photos)', status: 'complete' as const, date: '2026-03-05' },
    { listingMock: 'l-6', type: 'video' as const, name: 'Cinematic drone video with pool feature', status: 'complete' as const, date: '2026-03-06' },
    { listingMock: 'l-6', type: 'social_post' as const, name: 'Instagram Reels — Pool & Garden Tour', status: 'published' as const, date: '2026-03-14', platform: 'Instagram', metrics: { impressions: 5800, clicks: 320, saves: 92 } },
    // Marketing assets for l-7
    { listingMock: 'l-7', type: 'photo' as const, name: 'Professional photo package (38 photos)', status: 'complete' as const, date: '2026-02-28' },
    { listingMock: 'l-7', type: 'brochure' as const, name: 'Property brochure (digital)', status: 'complete' as const, date: '2026-03-03' },
    { listingMock: 'l-7', type: 'social_post' as const, name: 'Facebook — Under Contract announcement', status: 'published' as const, date: '2026-04-02', platform: 'Facebook', metrics: { impressions: 2100, clicks: 98, saves: 12 } },
    // Marketing assets for l-8
    { listingMock: 'l-8', type: 'photo' as const, name: 'Before photos (pre-renovation)', status: 'complete' as const, date: '2026-04-06' },
    { listingMock: 'l-8', type: 'brochure' as const, name: 'Investment opportunity flyer', status: 'in_production' as const, date: '2026-04-10' },
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
    // STAGE 1: PRE_MARKET
    { name: 'Client Onboarding', phase: 'pre_market' as const, taskCategory: 'onboarding' as const, taskCount: 5, description: 'Client intake, listing agreement, communication setup, onboarding packet', isDefault: true },
    { name: 'Pre-Listing Logistics', phase: 'pre_market' as const, taskCategory: 'disclosures' as const, taskCount: 4, description: 'Seller inspection, title/escrow selection, disclosure package', isDefault: true },
    { name: 'Improvements & Repairs', phase: 'pre_market' as const, taskCategory: 'improvements' as const, taskCount: 7, description: 'Inspection analysis, contractor quotes, repairs, before/after documentation', isDefault: true },
    { name: 'Staging & Preparation', phase: 'pre_market' as const, taskCategory: 'staging' as const, taskCount: 6, description: 'Staging consultation, furniture rental, installation, deep cleaning', isDefault: true },
    { name: 'Media Production', phase: 'pre_market' as const, taskCategory: 'media' as const, taskCount: 8, description: 'Photography, drone, twilight, Matterport, brochure, video tour', isDefault: true },
    { name: 'Pricing & Market Strategy', phase: 'pre_market' as const, taskCategory: 'pricing' as const, taskCount: 5, description: 'Comps analysis, market positioning, pricing recommendation, client sign-off', isDefault: true },
    // STAGE 2: ACTIVE
    { name: 'Launch & Marketing', phase: 'active' as const, taskCategory: 'marketing' as const, taskCount: 9, description: 'MLS syndication, social media, paid ads, open houses, weekly reports', isDefault: true },
    { name: 'Showings & Feedback', phase: 'active' as const, taskCategory: 'showings' as const, taskCount: 6, description: 'Showing coordination, open houses, feedback collection, trend analysis', isDefault: true },
    { name: 'Offer Review & Negotiation', phase: 'active' as const, taskCategory: 'offers' as const, taskCount: 8, description: 'Offer intake, comparison, counter-offer strategy, acceptance', isDefault: true },
    { name: 'Contingency Management', phase: 'active' as const, taskCategory: 'escrow' as const, taskCount: 7, description: 'Inspection, appraisal, loan, title contingencies, repair credits', isDefault: true },
    // STAGE 3: CLOSED
    { name: 'Closing Process', phase: 'closed' as const, taskCategory: 'escrow' as const, taskCount: 8, description: 'Purchase agreement review, final walkthrough, signing, key handoff', isDefault: true },
    { name: 'Post-Close Coordination', phase: 'closed' as const, taskCategory: 'general' as const, taskCount: 4, description: 'Commission processing, client debrief, review requests, referrals', isDefault: true },
    // STAGE 4: CANCELED
    { name: 'Listing Cancellation', phase: 'canceled' as const, taskCategory: 'general' as const, taskCount: 3, description: 'Document cancellation, MLS removal, client relationship retention', isDefault: true },
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

  // ─── Analytics Events (views by platform over last 30 days) ──────────
  console.log('  Inserting analytics events...');
  const activeListingMocks = ['l-1', 'l-2', 'l-6', 'l-7'];
  const platforms = ['zillow', 'redfin', 'realtor', 'website', 'social'] as const;
  const platformWeights = { zillow: 1.0, redfin: 0.65, realtor: 0.45, website: 0.2, social: 0.15 };

  for (const mockId of activeListingMocks) {
    const lid = listingMap[mockId];
    if (!lid) continue;
    // Generate 30 days of view data with a realistic bell-curve pattern
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const d = new Date();
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().slice(0, 10);
      // Peak around day 7-14, taper off
      const daysLive = 30 - dayOffset;
      const baseViews = Math.round(25 + 80 * Math.exp(-0.5 * Math.pow((daysLive - 10) / 5, 2)));

      for (const platform of platforms) {
        const weight = platformWeights[platform];
        const count = Math.max(1, Math.round(baseViews * weight * (0.8 + Math.random() * 0.4)));
        await db.insert(analyticsEvents).values({
          listingId: lid,
          platform,
          eventType: 'view',
          count,
          date: dateStr,
        });
      }
      // Also add save events (much lower counts)
      const saveCount = Math.max(0, Math.round(baseViews * 0.04 * (0.5 + Math.random())));
      if (saveCount > 0) {
        await db.insert(analyticsEvents).values({
          listingId: lid,
          platform: 'zillow',
          eventType: 'save',
          count: saveCount,
          date: dateStr,
        });
      }
    }
  }

  // ─── Analytics Showings (weekly showing volume) ──────────────────────
  console.log('  Inserting analytics showings...');
  for (const mockId of activeListingMocks) {
    const lid = listingMap[mockId];
    if (!lid) continue;
    // Generate 8 weeks of showing data
    for (let weekOffset = 7; weekOffset >= 0; weekOffset--) {
      const d = new Date();
      d.setDate(d.getDate() - weekOffset * 7);
      const dateStr = d.toISOString().slice(0, 10);
      // Showings ramp up then settle
      const peak = weekOffset <= 4 ? 4 - Math.abs(weekOffset - 2) : 1;
      const showingCount = Math.max(0, peak + Math.round(Math.random() * 3));
      const openHouse = weekOffset % 2 === 0 ? Math.round(8 + Math.random() * 12) : 0;

      await db.insert(analyticsShowings).values({
        listingId: lid,
        date: dateStr,
        showingCount,
        openHouseAttendees: openHouse,
        feedbackScore: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      });
    }
  }

  // ─── Pipeline Metrics (monthly snapshots) ───────────────────────────
  console.log('  Inserting pipeline metrics...');
  const pipelineData = [
    { month: '2026-01-01', totalValue: 8500000, active: 3, preMarket: 2, closedValue: 2100000, closedDeals: 2 },
    { month: '2026-02-01', totalValue: 12200000, active: 4, preMarket: 3, closedValue: 3400000, closedDeals: 1 },
    { month: '2026-03-01', totalValue: 16800000, active: 5, preMarket: 4, closedValue: 8975000, closedDeals: 3 },
    { month: '2026-04-01', totalValue: 18405000, active: 4, preMarket: 4, closedValue: 0, closedDeals: 0 },
  ];
  for (const p of pipelineData) {
    await db.insert(pipelineMetrics).values({
      teamId,
      date: p.month,
      totalValue: p.totalValue,
      activeListings: p.active,
      preMarketListings: p.preMarket,
      closedValue: p.closedValue,
      closedDeals: p.closedDeals,
    });
  }

  // ─── Team Performance (monthly metrics per member) ──────────────────
  console.log('  Inserting team performance...');
  const perfData = [
    { mockId: 'tm-1', activeTasks: 4, completedThisMonth: 12, avgDays: 2.1, activeListings: 3, closedDeals: 2, totalVolume: 6370000 },
    { mockId: 'tm-2', activeTasks: 3, completedThisMonth: 8, avgDays: 1.8, activeListings: 2, closedDeals: 1, totalVolume: 2875000 },
    { mockId: 'tm-3', activeTasks: 2, completedThisMonth: 15, avgDays: 1.5, activeListings: 0, closedDeals: 0, totalVolume: 0 },
    { mockId: 'tm-4', activeTasks: 3, completedThisMonth: 10, avgDays: 2.4, activeListings: 0, closedDeals: 0, totalVolume: 0 },
    { mockId: 'tm-5', activeTasks: 2, completedThisMonth: 7, avgDays: 3.2, activeListings: 0, closedDeals: 0, totalVolume: 0 },
  ];
  for (const p of perfData) {
    const memberId = tmMap[p.mockId];
    if (!memberId) continue;
    await db.insert(teamPerformance).values({
      teamMemberId: memberId,
      period: 'monthly',
      periodStart: '2026-04-01',
      activeListings: p.activeListings,
      closedDeals: p.closedDeals,
      totalVolume: p.totalVolume,
      avgDaysOnMarket: p.closedDeals > 0 ? Math.round(14 + Math.random() * 10) : null,
      clientSatisfaction: parseFloat((4.2 + Math.random() * 0.8).toFixed(1)),
      tasksCompleted: p.completedThisMonth,
      avgCompletionDays: p.avgDays,
    });
  }

  // ─── Seed User (GoTrue + team member link) ─────────────────────────
  const seedEmail = process.env.SEED_USER_EMAIL;
  const seedPassword = process.env.SEED_USER_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (seedEmail && seedPassword && supabaseUrl && serviceRoleKey) {
    console.log(`  Creating seed user (${seedEmail})...`);

    // Create or fetch the GoTrue user via admin API
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: seedEmail,
        password: seedPassword,
        email_confirm: true,
      }),
    });

    let userId: string | null = null;

    if (res.ok) {
      const user = await res.json();
      userId = user.id;
      console.log(`    Created user: ${userId}`);
    } else {
      // User might already exist — look them up
      const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=50`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      });
      if (listRes.ok) {
        const data = await listRes.json();
        const users = data.users ?? data;
        const existing = users.find((u: any) => u.email === seedEmail);
        if (existing) {
          userId = existing.id;
          console.log(`    Found existing user: ${userId}`);
        }
      }
    }

    // Link the seed user to the admin team member (tm-1)
    if (userId) {
      await db.update(teamMembers)
        .set({ userId })
        .where(sql`id = ${tmMap['tm-1']}`);
      console.log(`    Linked to team member: Bryce Reynolds (admin)`);
    }
  } else {
    console.log('  Skipping seed user (SEED_USER_EMAIL/SEED_USER_PASSWORD not set)');
  }

  console.log('Seed complete!');
  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
