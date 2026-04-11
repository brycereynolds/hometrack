// HomeTrack Mock Data
// Realistic Bay Area real estate data for mockup pages

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListingPhase =
  | 'onboarding'
  | 'improvement'
  | 'staging'
  | 'content'
  | 'marketing'
  | 'showings'
  | 'offers'
  | 'contract'
  | 'closing';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ContactType = 'client' | 'agent' | 'vendor' | 'lender' | 'inspector' | 'title';

export type ActivityType =
  | 'message'
  | 'email'
  | 'note'
  | 'voice_memo'
  | 'system'
  | 'ai_insight'
  | 'phase_change'
  | 'task_complete';

export type OfferStatus = 'received' | 'reviewed' | 'countered' | 'accepted' | 'declined';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'listing_agent' | 'tc' | 'marketing' | 'staging_lead';
  roleLabel: string;
  avatar: string;
  initials: string;
}

export interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
  price: number;
  priceFormatted: string;
  beds: number;
  baths: number;
  sqft: number;
  lotSqft: number;
  yearBuilt: number;
  propertyType: string;
  mlsNumber: string;
  phase: ListingPhase;
  phaseLabel: string;
  daysInPhase: number;
  daysOnMarket: number;
  listDate: string | null;
  targetListDate: string;
  agent: TeamMember;
  client: Contact;
  photoUrl: string;
  photos: string[];
  lat: number;
  lng: number;
  tasksDone: number;
  tasksTotal: number;
  documentsCount: number;
  showingsCount: number;
  offersCount: number;
  zillowViews: number;
  zillowSaves: number;
  description?: string;
  features?: string[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ContactType;
  typeLabel: string;
  company?: string;
  initials: string;
  avatar?: string;
  lastInteraction: string;
  lastInteractionDate: string;
  listingsCount: number;
  notes?: string;
  // Agent-specific
  buyerNeeds?: string;
  marketFocus?: string;
  relationshipStrength?: number; // 1-5
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: TeamMember;
  listingId: string;
  listingAddress: string;
  phase: ListingPhase;
  dueDate: string;
  isOverdue: boolean;
  subtasks?: { title: string; done: boolean }[];
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  author: string;
  authorInitials: string;
  authorAvatar?: string;
  timestamp: string;
  timeAgo: string;
  content: string;
  listingId?: string;
  listingAddress?: string;
  metadata?: Record<string, string>;
}

export interface AIInsight {
  id: string;
  type: 'connection' | 'anomaly' | 'recommendation' | 'warning';
  title: string;
  description: string;
  listingId?: string;
  listingAddress?: string;
  actionLabel?: string;
  actionUrl?: string;
  timestamp: string;
  timeAgo: string;
  dismissed: boolean;
}

export interface Showing {
  id: string;
  listingId: string;
  listingAddress: string;
  date: string;
  time: string;
  agentName: string;
  agentCompany: string;
  buyerType: string;
  feedback?: string;
  rating?: number; // 1-5
  interestedLevel?: 'very' | 'somewhat' | 'not';
}

export interface Offer {
  id: string;
  listingId: string;
  listingAddress: string;
  buyerName: string;
  buyerAgent: string;
  price: number;
  priceFormatted: string;
  earnestDeposit: number;
  contingencies: string[];
  closeDate: string;
  financingType: string;
  status: OfferStatus;
  submittedDate: string;
  expirationDate: string;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  category: string;
  categoryLabel: string;
  phone: string;
  email: string;
  initials: string;
  rating: number;
  reliabilityScore: number;
  avgResponseTime: string;
  projectsCompleted: number;
  avgCost: string;
  serviceArea: string;
  specialties: string[];
}

export interface FinancialSummary {
  listingId: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  pendingQuotes: number;
  categories: {
    name: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[];
}

// ─── Phase Config ────────────────────────────────────────────────────────────

export const PHASES: Record<ListingPhase, { label: string; color: string; order: number }> = {
  onboarding: { label: 'Onboarding', color: '#6B9FC4', order: 0 },
  improvement: { label: 'Improvement Planning', color: '#7B8B6F', order: 1 },
  staging: { label: 'Staging & Prep', color: '#9B8EB5', order: 2 },
  content: { label: 'Content Production', color: '#C49A3C', order: 3 },
  marketing: { label: 'Active Marketing', color: '#C4704B', order: 4 },
  showings: { label: 'Showings & Open Houses', color: '#D4956B', order: 5 },
  offers: { label: 'Offers & Negotiation', color: '#5B8BA5', order: 6 },
  contract: { label: 'Under Contract', color: '#5E8C61', order: 7 },
  closing: { label: 'Closing', color: '#8B7355', order: 8 },
};

export const PHASE_LIST = Object.entries(PHASES)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key, value]) => ({ key: key as ListingPhase, ...value }));

// ─── Team Members ────────────────────────────────────────────────────────────

export const teamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Lauren Chen',
    email: 'lauren@hometrack.co',
    role: 'admin',
    roleLabel: 'Team Lead / Listing Agent',
    avatar: '',
    initials: 'LC',
  },
  {
    id: 'tm-2',
    name: 'Marcus Rivera',
    email: 'marcus@hometrack.co',
    role: 'listing_agent',
    roleLabel: 'Listing Agent',
    avatar: '',
    initials: 'MR',
  },
  {
    id: 'tm-3',
    name: 'Priya Patel',
    email: 'priya@hometrack.co',
    role: 'tc',
    roleLabel: 'Transaction Coordinator',
    avatar: '',
    initials: 'PP',
  },
  {
    id: 'tm-4',
    name: 'Jordan Nakamura',
    email: 'jordan@hometrack.co',
    role: 'marketing',
    roleLabel: 'Marketing Coordinator',
    avatar: '',
    initials: 'JN',
  },
  {
    id: 'tm-5',
    name: 'Sofia Andrade',
    email: 'sofia@hometrack.co',
    role: 'staging_lead',
    roleLabel: 'Design & Staging Lead',
    avatar: '',
    initials: 'SA',
  },
];

// ─── Contacts ────────────────────────────────────────────────────────────────

export const contacts: Contact[] = [
  // Clients
  {
    id: 'c-1',
    name: 'David & Emily Nguyen',
    email: 'david.nguyen@gmail.com',
    phone: '(408) 555-1201',
    type: 'client',
    typeLabel: 'Client',
    initials: 'DN',
    lastInteraction: 'Discussed staging timeline',
    lastInteractionDate: '2026-04-07',
    listingsCount: 1,
  },
  {
    id: 'c-2',
    name: 'Rebecca Thornton',
    email: 'rebecca.t@outlook.com',
    phone: '(650) 555-3344',
    type: 'client',
    typeLabel: 'Client',
    initials: 'RT',
    lastInteraction: 'Approved photography schedule',
    lastInteractionDate: '2026-04-06',
    listingsCount: 1,
  },
  {
    id: 'c-3',
    name: 'Michael & Lisa Park',
    email: 'mpark@icloud.com',
    phone: '(510) 555-8877',
    type: 'client',
    typeLabel: 'Client',
    initials: 'MP',
    lastInteraction: 'Reviewed offer comparison',
    lastInteractionDate: '2026-04-08',
    listingsCount: 2,
  },
  {
    id: 'c-4',
    name: 'Anil Kapoor',
    email: 'anil.k@yahoo.com',
    phone: '(408) 555-9012',
    type: 'client',
    typeLabel: 'Client',
    initials: 'AK',
    lastInteraction: 'Initial onboarding call',
    lastInteractionDate: '2026-04-09',
    listingsCount: 1,
  },
  // External Agents
  {
    id: 'c-5',
    name: 'Sarah Kim',
    email: 'sarah.kim@compass.com',
    phone: '(650) 555-2200',
    type: 'agent',
    typeLabel: 'External Agent',
    company: 'Compass',
    initials: 'SK',
    lastInteraction: 'Open house conversation',
    lastInteractionDate: '2026-03-28',
    listingsCount: 0,
    buyerNeeds: '4BR in Los Gatos under $2.5M, good schools',
    marketFocus: 'Los Gatos, Saratoga',
    relationshipStrength: 4,
  },
  {
    id: 'c-6',
    name: 'Brian Foster',
    email: 'bfoster@serenogroup.com',
    phone: '(408) 555-7755',
    type: 'agent',
    typeLabel: 'External Agent',
    company: 'Sereno Group',
    initials: 'BF',
    lastInteraction: 'Showed 456 Oak Ave to client',
    lastInteractionDate: '2026-04-03',
    listingsCount: 0,
    buyerNeeds: 'Downsizer couple, 2-3BR, single story, Los Altos or Mountain View, up to $3M',
    marketFocus: 'Los Altos, Mountain View, Palo Alto',
    relationshipStrength: 5,
  },
  {
    id: 'c-7',
    name: 'Diana Reyes',
    email: 'diana@kw.com',
    phone: '(510) 555-4400',
    type: 'agent',
    typeLabel: 'External Agent',
    company: 'Keller Williams',
    initials: 'DR',
    lastInteraction: 'Inquiry about 789 Elm St pricing',
    lastInteractionDate: '2026-04-05',
    listingsCount: 0,
    buyerNeeds: 'Tech relocatee family, 4BR+, Cupertino schools, $2-3.5M',
    marketFocus: 'Cupertino, Sunnyvale',
    relationshipStrength: 3,
  },
  // Vendors (also in vendor directory)
  {
    id: 'c-8',
    name: 'Tom Bradley',
    email: 'tom@bradleyrenovations.com',
    phone: '(408) 555-6600',
    type: 'vendor',
    typeLabel: 'Vendor',
    company: 'Bradley Renovations',
    initials: 'TB',
    lastInteraction: 'Completed kitchen update at 123 Main',
    lastInteractionDate: '2026-03-15',
    listingsCount: 3,
  },
  {
    id: 'c-9',
    name: 'Ana Gonzalez',
    email: 'ana@meridianstaging.com',
    phone: '(650) 555-1100',
    type: 'vendor',
    typeLabel: 'Vendor',
    company: 'Meridian Home Staging',
    initials: 'AG',
    lastInteraction: 'Staging quote for 456 Oak Ave',
    lastInteractionDate: '2026-04-01',
    listingsCount: 5,
  },
  {
    id: 'c-10',
    name: 'Kevin Tran',
    email: 'kevin@trangroupphoto.com',
    phone: '(408) 555-3300',
    type: 'vendor',
    typeLabel: 'Vendor',
    company: 'Tran Group Photography',
    initials: 'KT',
    lastInteraction: 'Shot photography for 789 Elm St',
    lastInteractionDate: '2026-04-04',
    listingsCount: 8,
  },
  // Lender
  {
    id: 'c-11',
    name: 'Jennifer Walsh',
    email: 'jwalsh@firstrepublic.com',
    phone: '(650) 555-8800',
    type: 'lender',
    typeLabel: 'Lender',
    company: 'First Republic Bank',
    initials: 'JW',
    lastInteraction: 'Pre-approval for buyer on 123 Main',
    lastInteractionDate: '2026-04-02',
    listingsCount: 0,
  },
  // Inspector
  {
    id: 'c-12',
    name: 'Robert Cheng',
    email: 'rcheng@bayareainspect.com',
    phone: '(510) 555-2299',
    type: 'inspector',
    typeLabel: 'Inspector',
    company: 'Bay Area Property Inspections',
    initials: 'RC',
    lastInteraction: 'Inspection report for 456 Oak Ave',
    lastInteractionDate: '2026-03-20',
    listingsCount: 0,
  },
];

// ─── Listings ────────────────────────────────────────────────────────────────

export const listings: Listing[] = [
  {
    id: 'l-1',
    address: '123 Main Street',
    city: 'Los Gatos',
    state: 'CA',
    zip: '95030',
    fullAddress: '123 Main Street, Los Gatos, CA 95030',
    price: 2495000,
    priceFormatted: '$2,495,000',
    beds: 4,
    baths: 3,
    sqft: 2850,
    lotSqft: 8500,
    yearBuilt: 1965,
    propertyType: 'Single Family',
    mlsNumber: 'ML81928374',
    phase: 'marketing',
    phaseLabel: 'Active Marketing',
    daysInPhase: 5,
    daysOnMarket: 5,
    listDate: '2026-04-04',
    targetListDate: '2026-04-04',
    agent: teamMembers[0],
    client: contacts[0],
    photoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop',
    ],
    lat: 37.2358,
    lng: -121.9624,
    tasksDone: 18,
    tasksTotal: 24,
    documentsCount: 14,
    showingsCount: 8,
    offersCount: 2,
    zillowViews: 1243,
    zillowSaves: 67,
    description: 'Beautifully remodeled ranch-style home in the heart of Los Gatos. Gourmet kitchen with quartz countertops, hardwood floors throughout, and a private backyard oasis with mature landscaping.',
    features: ['Remodeled kitchen', 'Hardwood floors', 'Private backyard', 'Two-car garage', 'Central AC', 'Smart home'],
  },
  {
    id: 'l-2',
    address: '456 Oak Avenue',
    city: 'Palo Alto',
    state: 'CA',
    zip: '94301',
    fullAddress: '456 Oak Avenue, Palo Alto, CA 94301',
    price: 3850000,
    priceFormatted: '$3,850,000',
    beds: 5,
    baths: 4,
    sqft: 3600,
    lotSqft: 12000,
    yearBuilt: 1952,
    propertyType: 'Single Family',
    mlsNumber: 'ML81935521',
    phase: 'showings',
    phaseLabel: 'Showings & Open Houses',
    daysInPhase: 12,
    daysOnMarket: 18,
    listDate: '2026-03-22',
    targetListDate: '2026-03-20',
    agent: teamMembers[0],
    client: contacts[1],
    photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop',
    ],
    lat: 37.4419,
    lng: -122.1430,
    tasksDone: 22,
    tasksTotal: 28,
    documentsCount: 18,
    showingsCount: 15,
    offersCount: 0,
    zillowViews: 2890,
    zillowSaves: 142,
    description: 'Stately Old Palo Alto home on a tree-lined street. Expansive living spaces, chef\'s kitchen, and a resort-like backyard with pool, outdoor kitchen, and mature oak trees. Walk to Town & Country Village.',
    features: ['Pool & spa', 'Chef\'s kitchen', 'Home office', 'Wine cellar', 'Outdoor kitchen', 'Oak-lined lot'],
  },
  {
    id: 'l-3',
    address: '789 Elm Street',
    city: 'Cupertino',
    state: 'CA',
    zip: '95014',
    fullAddress: '789 Elm Street, Cupertino, CA 95014',
    price: 2150000,
    priceFormatted: '$2,150,000',
    beds: 3,
    baths: 2,
    sqft: 1850,
    lotSqft: 6200,
    yearBuilt: 1978,
    propertyType: 'Single Family',
    mlsNumber: 'ML81940112',
    phase: 'content',
    phaseLabel: 'Content Production',
    daysInPhase: 4,
    daysOnMarket: 0,
    listDate: null,
    targetListDate: '2026-04-18',
    agent: teamMembers[1],
    client: contacts[2],
    photoUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=600&fit=crop',
    ],
    lat: 37.3230,
    lng: -122.0322,
    tasksDone: 12,
    tasksTotal: 20,
    documentsCount: 8,
    showingsCount: 0,
    offersCount: 0,
    zillowViews: 0,
    zillowSaves: 0,
    description: 'Well-maintained Cupertino home in top-rated school district. Updated baths, new roof, and spacious open-plan living. Minutes from Apple Park and Cupertino Village.',
    features: ['Top schools', 'New roof', 'Updated baths', 'Open floor plan', 'Near Apple Park'],
  },
  {
    id: 'l-4',
    address: '2200 Willow Glen Way',
    city: 'San Jose',
    state: 'CA',
    zip: '95125',
    fullAddress: '2200 Willow Glen Way, San Jose, CA 95125',
    price: 1695000,
    priceFormatted: '$1,695,000',
    beds: 3,
    baths: 2,
    sqft: 1620,
    lotSqft: 5800,
    yearBuilt: 1940,
    propertyType: 'Single Family',
    mlsNumber: 'ML81942889',
    phase: 'staging',
    phaseLabel: 'Staging & Prep',
    daysInPhase: 8,
    daysOnMarket: 0,
    listDate: null,
    targetListDate: '2026-04-25',
    agent: teamMembers[1],
    client: contacts[2],
    photoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600573472572-8aba140b2c78?w=800&h=600&fit=crop',
    ],
    lat: 37.2969,
    lng: -121.9008,
    tasksDone: 8,
    tasksTotal: 16,
    documentsCount: 5,
    showingsCount: 0,
    offersCount: 0,
    zillowViews: 0,
    zillowSaves: 0,
    description: 'Classic Willow Glen charmer with period details. Arched doorways, coved ceilings, and a sun-drenched breakfast nook. Walking distance to Lincoln Avenue shops and restaurants.',
    features: ['Period details', 'Walkable', 'Detached garage', 'Breakfast nook', 'Mature garden'],
  },
  {
    id: 'l-5',
    address: '1580 University Avenue',
    city: 'Mountain View',
    state: 'CA',
    zip: '94040',
    fullAddress: '1580 University Avenue, Mountain View, CA 94040',
    price: 1295000,
    priceFormatted: '$1,295,000',
    beds: 2,
    baths: 2,
    sqft: 1200,
    lotSqft: 4500,
    yearBuilt: 1955,
    propertyType: 'Townhouse',
    mlsNumber: 'ML81945003',
    phase: 'onboarding',
    phaseLabel: 'Onboarding',
    daysInPhase: 2,
    daysOnMarket: 0,
    listDate: null,
    targetListDate: '2026-05-10',
    agent: teamMembers[0],
    client: contacts[3],
    photoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7c5a38?w=800&h=600&fit=crop',
    ],
    lat: 37.3861,
    lng: -122.0839,
    tasksDone: 2,
    tasksTotal: 12,
    documentsCount: 1,
    showingsCount: 0,
    offersCount: 0,
    zillowViews: 0,
    zillowSaves: 0,
    description: 'Light-filled Mountain View townhome near downtown and Caltrain. Modern finishes, in-unit laundry, and a private patio. Ideal for commuters and tech professionals.',
    features: ['Near Caltrain', 'Modern finishes', 'In-unit laundry', 'Private patio', 'EV charging'],
  },
  {
    id: 'l-6',
    address: '945 Cherry Blossom Lane',
    city: 'Saratoga',
    state: 'CA',
    zip: '95070',
    fullAddress: '945 Cherry Blossom Lane, Saratoga, CA 95070',
    price: 3200000,
    priceFormatted: '$3,200,000',
    beds: 5,
    baths: 3.5,
    sqft: 3200,
    lotSqft: 15000,
    yearBuilt: 1988,
    propertyType: 'Single Family',
    mlsNumber: 'ML81930445',
    phase: 'offers',
    phaseLabel: 'Offers & Negotiation',
    daysInPhase: 3,
    daysOnMarket: 28,
    listDate: '2026-03-12',
    targetListDate: '2026-03-10',
    agent: teamMembers[0],
    client: contacts[2],
    photoUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop',
    ],
    lat: 37.2638,
    lng: -122.0230,
    tasksDone: 25,
    tasksTotal: 30,
    documentsCount: 22,
    showingsCount: 21,
    offersCount: 3,
    zillowViews: 4100,
    zillowSaves: 198,
    description: 'Prestigious Saratoga estate on nearly half an acre. Grand entry, soaring ceilings, gourmet kitchen, and a resort backyard with pool, spa, and outdoor fireplace. Top-rated Saratoga schools.',
    features: ['Pool & spa', 'Half-acre lot', 'Gourmet kitchen', 'Outdoor fireplace', 'Saratoga schools', '3-car garage'],
  },
  {
    id: 'l-7',
    address: '310 Waverly Street',
    city: 'Menlo Park',
    state: 'CA',
    zip: '94025',
    fullAddress: '310 Waverly Street, Menlo Park, CA 94025',
    price: 2875000,
    priceFormatted: '$2,875,000',
    beds: 4,
    baths: 3,
    sqft: 2400,
    lotSqft: 7200,
    yearBuilt: 1948,
    propertyType: 'Single Family',
    mlsNumber: 'ML81925100',
    phase: 'contract',
    phaseLabel: 'Under Contract',
    daysInPhase: 10,
    daysOnMarket: 35,
    listDate: '2026-03-05',
    targetListDate: '2026-03-05',
    agent: teamMembers[1],
    client: contacts[1],
    photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
    ],
    lat: 37.4530,
    lng: -122.1817,
    tasksDone: 28,
    tasksTotal: 32,
    documentsCount: 26,
    showingsCount: 18,
    offersCount: 4,
    zillowViews: 3200,
    zillowSaves: 155,
    description: 'Charming mid-century Menlo Park home with thoughtful updates. Open living areas, designer kitchen, and a peaceful backyard with heritage redwood tree. Minutes to downtown Menlo Park and Stanford.',
    features: ['Near Stanford', 'Designer kitchen', 'Heritage redwood', 'Updated systems', 'Attached ADU potential'],
  },
  {
    id: 'l-8',
    address: '88 Sunnyvale Avenue',
    city: 'Sunnyvale',
    state: 'CA',
    zip: '94086',
    fullAddress: '88 Sunnyvale Avenue, Sunnyvale, CA 94086',
    price: 895000,
    priceFormatted: '$895,000',
    beds: 2,
    baths: 1,
    sqft: 980,
    lotSqft: 3500,
    yearBuilt: 1960,
    propertyType: 'Condo',
    mlsNumber: 'ML81946220',
    phase: 'improvement',
    phaseLabel: 'Improvement Planning',
    daysInPhase: 6,
    daysOnMarket: 0,
    listDate: null,
    targetListDate: '2026-05-01',
    agent: teamMembers[1],
    client: contacts[3],
    photoUrl: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800&h=600&fit=crop',
    ],
    lat: 37.3688,
    lng: -122.0363,
    tasksDone: 4,
    tasksTotal: 14,
    documentsCount: 3,
    showingsCount: 0,
    offersCount: 0,
    zillowViews: 0,
    zillowSaves: 0,
    description: 'Opportunity in Sunnyvale — investor-owned condo ready for cosmetic updates. Great bones, in-unit laundry hookup, assigned parking, and a short walk to Murphy Avenue dining.',
    features: ['In-unit laundry', 'Assigned parking', 'Near Murphy Ave', 'Community pool'],
  },
];

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasks: Task[] = [
  {
    id: 't-1',
    title: 'Review and approve listing photography',
    status: 'in_progress',
    priority: 'high',
    assignee: teamMembers[0],
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    phase: 'marketing',
    dueDate: '2026-04-10',
    isOverdue: false,
  },
  {
    id: 't-2',
    title: 'Submit TDS to title company',
    status: 'overdue',
    priority: 'urgent',
    assignee: teamMembers[2],
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
    phase: 'showings',
    dueDate: '2026-04-05',
    isOverdue: true,
  },
  {
    id: 't-3',
    title: 'Schedule professional photography',
    status: 'todo',
    priority: 'high',
    assignee: teamMembers[3],
    listingId: 'l-3',
    listingAddress: '789 Elm Street',
    phase: 'content',
    dueDate: '2026-04-12',
    isOverdue: false,
  },
  {
    id: 't-4',
    title: 'Coordinate staging furniture delivery',
    status: 'in_progress',
    priority: 'medium',
    assignee: teamMembers[4],
    listingId: 'l-4',
    listingAddress: '2200 Willow Glen Way',
    phase: 'staging',
    dueDate: '2026-04-15',
    isOverdue: false,
    subtasks: [
      { title: 'Confirm delivery window with Meridian', done: true },
      { title: 'Arrange parking for delivery truck', done: false },
      { title: 'Client walkthrough post-staging', done: false },
    ],
  },
  {
    id: 't-5',
    title: 'Draft MLS listing copy',
    status: 'todo',
    priority: 'medium',
    assignee: teamMembers[3],
    listingId: 'l-3',
    listingAddress: '789 Elm Street',
    phase: 'content',
    dueDate: '2026-04-14',
    isOverdue: false,
  },
  {
    id: 't-6',
    title: 'Collect contractor quotes for bathroom update',
    status: 'in_progress',
    priority: 'medium',
    assignee: teamMembers[4],
    listingId: 'l-8',
    listingAddress: '88 Sunnyvale Avenue',
    phase: 'improvement',
    dueDate: '2026-04-11',
    isOverdue: false,
  },
  {
    id: 't-7',
    title: 'Review and counter offer from Westfield Group',
    status: 'todo',
    priority: 'urgent',
    assignee: teamMembers[0],
    listingId: 'l-6',
    listingAddress: '945 Cherry Blossom Lane',
    phase: 'offers',
    dueDate: '2026-04-10',
    isOverdue: false,
  },
  {
    id: 't-8',
    title: 'Order NHD report',
    status: 'done',
    priority: 'medium',
    assignee: teamMembers[2],
    listingId: 'l-5',
    listingAddress: '1580 University Avenue',
    phase: 'onboarding',
    dueDate: '2026-04-08',
    isOverdue: false,
  },
  {
    id: 't-9',
    title: 'Send weekly showing feedback summary to client',
    status: 'todo',
    priority: 'medium',
    assignee: teamMembers[0],
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
    phase: 'showings',
    dueDate: '2026-04-10',
    isOverdue: false,
  },
  {
    id: 't-10',
    title: 'Schedule home inspection',
    status: 'in_progress',
    priority: 'high',
    assignee: teamMembers[2],
    listingId: 'l-7',
    listingAddress: '310 Waverly Street',
    phase: 'contract',
    dueDate: '2026-04-12',
    isOverdue: false,
  },
  {
    id: 't-11',
    title: 'Prepare client onboarding packet',
    status: 'todo',
    priority: 'low',
    assignee: teamMembers[0],
    listingId: 'l-5',
    listingAddress: '1580 University Avenue',
    phase: 'onboarding',
    dueDate: '2026-04-14',
    isOverdue: false,
  },
  {
    id: 't-12',
    title: 'Update social media ads for Open House',
    status: 'done',
    priority: 'high',
    assignee: teamMembers[3],
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    phase: 'marketing',
    dueDate: '2026-04-08',
    isOverdue: false,
  },
];

// ─── Activity Feed ───────────────────────────────────────────────────────────

export const activityItems: ActivityItem[] = [
  {
    id: 'a-1',
    type: 'message',
    author: 'David Nguyen',
    authorInitials: 'DN',
    timestamp: '2026-04-09T09:15:00',
    timeAgo: '2h ago',
    content: 'Hi Lauren, can we discuss the open house schedule for this weekend? We had some feedback from the neighbors about parking.',
    listingId: 'l-1',
    listingAddress: '123 Main Street',
  },
  {
    id: 'a-2',
    type: 'system',
    author: 'System',
    authorInitials: 'HT',
    timestamp: '2026-04-09T08:30:00',
    timeAgo: '3h ago',
    content: 'New showing request from Brian Foster (Sereno Group) for April 11 at 2:00 PM.',
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
  },
  {
    id: 'a-3',
    type: 'email',
    author: 'Rebecca Thornton',
    authorInitials: 'RT',
    timestamp: '2026-04-09T07:45:00',
    timeAgo: '4h ago',
    content: 'RE: Photography Schedule — Looks great! I approved the twilight shoot for Thursday. Can you also make sure they capture the new landscaping in the backyard?',
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
    metadata: { subject: 'RE: Photography Schedule' },
  },
  {
    id: 'a-4',
    type: 'voice_memo',
    author: 'Lauren Chen',
    authorInitials: 'LC',
    timestamp: '2026-04-08T17:30:00',
    timeAgo: '18h ago',
    content: 'Quick note after showing at 123 Main — buyer seemed very interested in the remodeled kitchen. Agent mentioned they have another property to see tomorrow. Follow up with Brian on Friday.',
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    metadata: { duration: '0:42' },
  },
  {
    id: 'a-5',
    type: 'task_complete',
    author: 'Jordan Nakamura',
    authorInitials: 'JN',
    timestamp: '2026-04-08T16:00:00',
    timeAgo: '19h ago',
    content: 'Completed task: Update social media ads for Open House',
    listingId: 'l-1',
    listingAddress: '123 Main Street',
  },
  {
    id: 'a-6',
    type: 'note',
    author: 'Marcus Rivera',
    authorInitials: 'MR',
    timestamp: '2026-04-08T14:20:00',
    timeAgo: '21h ago',
    content: 'Spoke with Diana Reyes — she has a tech relocation client looking in Cupertino. 4BR+, good schools, $2-3.5M budget. 789 Elm might be a fit once it hits market. Logging to agent network.',
    listingId: 'l-3',
    listingAddress: '789 Elm Street',
  },
  {
    id: 'a-7',
    type: 'phase_change',
    author: 'System',
    authorInitials: 'HT',
    timestamp: '2026-04-08T10:00:00',
    timeAgo: 'Yesterday',
    content: 'Listing moved from Active Marketing to Showings & Open Houses.',
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
  },
  {
    id: 'a-8',
    type: 'message',
    author: 'Michael Park',
    authorInitials: 'MP',
    timestamp: '2026-04-08T09:00:00',
    timeAgo: 'Yesterday',
    content: 'We reviewed the three offers on Cherry Blossom. The Westfield Group offer is strongest but the contingency timeline concerns us. Can we counter on the close date?',
    listingId: 'l-6',
    listingAddress: '945 Cherry Blossom Lane',
  },
  {
    id: 'a-9',
    type: 'email',
    author: 'Tom Bradley',
    authorInitials: 'TB',
    timestamp: '2026-04-07T15:00:00',
    timeAgo: '2 days ago',
    content: 'Hi Sofia, the bathroom renovation quote for 88 Sunnyvale is attached. Total comes to $12,400 including fixtures. We can start as early as next Monday if approved.',
    listingId: 'l-8',
    listingAddress: '88 Sunnyvale Avenue',
    metadata: { subject: 'Bathroom Renovation Quote - 88 Sunnyvale' },
  },
  {
    id: 'a-10',
    type: 'ai_insight',
    author: 'HomeTrack AI',
    authorInitials: 'AI',
    timestamp: '2026-04-09T06:00:00',
    timeAgo: '5h ago',
    content: 'Showing volume for 456 Oak Ave has dropped 30% this week compared to last. Consider a price adjustment or refreshed marketing to reignite interest.',
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
  },
];

// ─── AI Insights ─────────────────────────────────────────────────────────────

export const aiInsights: AIInsight[] = [
  {
    id: 'ai-1',
    type: 'connection',
    title: 'Buyer match found',
    description: "Sarah Kim's buyer (4BR, Los Gatos, under $2.5M, good schools) matches your new listing at 123 Main Street ($2,495,000, 4BR). Consider reaching out.",
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    actionLabel: 'Message Sarah Kim',
    actionUrl: '/contacts/c-5',
    timestamp: '2026-04-09T06:00:00',
    timeAgo: '5h ago',
    dismissed: false,
  },
  {
    id: 'ai-2',
    type: 'anomaly',
    title: 'Showing interest declining',
    description: 'Showing volume for 456 Oak Ave dropped 30% week-over-week (15 last week to 10 this week). Zillow saves also plateaued. Consider a price adjustment or refreshed photography.',
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
    actionLabel: 'View analytics',
    actionUrl: '/listings/l-2/analytics',
    timestamp: '2026-04-09T06:00:00',
    timeAgo: '5h ago',
    dismissed: false,
  },
  {
    id: 'ai-3',
    type: 'warning',
    title: 'Unanswered client message',
    description: "David Nguyen asked about the open house parking situation 2 hours ago. No response logged yet.",
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    actionLabel: 'Reply now',
    actionUrl: '/listings/l-1/activity',
    timestamp: '2026-04-09T11:00:00',
    timeAgo: '30m ago',
    dismissed: false,
  },
  {
    id: 'ai-4',
    type: 'recommendation',
    title: 'Pricing recommendation',
    description: 'Based on 6 comparable sales within 0.5 miles in the last 90 days, the suggested list price range for 789 Elm Street is $2,050,000-$2,200,000. Current target of $2,150,000 is well-positioned.',
    listingId: 'l-3',
    listingAddress: '789 Elm Street',
    actionLabel: 'View comps',
    actionUrl: '/analytics',
    timestamp: '2026-04-08T12:00:00',
    timeAgo: 'Yesterday',
    dismissed: false,
  },
  {
    id: 'ai-5',
    type: 'connection',
    title: 'Agent match for upcoming listing',
    description: "Diana Reyes has a tech relocatee buyer looking for 4BR+ in Cupertino, $2-3.5M. Your listing at 789 Elm Street (3BR, $2.15M) is close but may be too small. Consider discussing when 789 Elm hits market.",
    listingId: 'l-3',
    listingAddress: '789 Elm Street',
    actionLabel: 'View agent profile',
    actionUrl: '/contacts/c-7',
    timestamp: '2026-04-08T14:00:00',
    timeAgo: 'Yesterday',
    dismissed: false,
  },
  {
    id: 'ai-6',
    type: 'recommendation',
    title: 'Optimal listing timing',
    description: 'Based on seasonal patterns and current inventory, listing 789 Elm Street in the next 10 days positions you ahead of 3 comparable properties expected to hit market in early May.',
    listingId: 'l-3',
    listingAddress: '789 Elm Street',
    timestamp: '2026-04-08T06:00:00',
    timeAgo: 'Yesterday',
    dismissed: false,
  },
];

// ─── Showings ────────────────────────────────────────────────────────────────

export const showings: Showing[] = [
  {
    id: 's-1',
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    date: '2026-04-08',
    time: '2:00 PM',
    agentName: 'Brian Foster',
    agentCompany: 'Sereno Group',
    buyerType: 'Downsizer couple',
    feedback: 'Loved the kitchen remodel and backyard. Concern about street noise. Will discuss with buyers tonight.',
    rating: 4,
    interestedLevel: 'very',
  },
  {
    id: 's-2',
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    date: '2026-04-07',
    time: '10:00 AM',
    agentName: 'Diana Reyes',
    agentCompany: 'Keller Williams',
    buyerType: 'Tech family relocating',
    feedback: 'Good layout but they need a 4th bedroom. The bonus room could work. Need to check school districts.',
    rating: 3,
    interestedLevel: 'somewhat',
  },
  {
    id: 's-3',
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
    date: '2026-04-08',
    time: '4:00 PM',
    agentName: 'Sarah Kim',
    agentCompany: 'Compass',
    buyerType: 'Move-up buyer',
    feedback: 'Beautiful property. Buyers love the lot size. Concern about dated bathrooms. May submit offer with renovation credit.',
    rating: 4,
    interestedLevel: 'very',
  },
  {
    id: 's-4',
    listingId: 'l-2',
    listingAddress: '456 Oak Avenue',
    date: '2026-04-06',
    time: '1:00 PM',
    agentName: 'Unknown Agent',
    agentCompany: 'Open House Walk-in',
    buyerType: 'First-time buyer',
    feedback: 'Just browsing the neighborhood. Price is out of their range.',
    rating: 2,
    interestedLevel: 'not',
  },
  {
    id: 's-5',
    listingId: 'l-6',
    listingAddress: '945 Cherry Blossom Lane',
    date: '2026-04-05',
    time: '11:00 AM',
    agentName: 'Brian Foster',
    agentCompany: 'Sereno Group',
    buyerType: 'Luxury upgrade',
    feedback: 'Strong interest. Love the lot and the Saratoga schools. Will submit offer within 48 hours.',
    rating: 5,
    interestedLevel: 'very',
  },
];

// ─── Offers ──────────────────────────────────────────────────────────────────

export const offers: Offer[] = [
  {
    id: 'o-1',
    listingId: 'l-6',
    listingAddress: '945 Cherry Blossom Lane',
    buyerName: 'The Westfield Group',
    buyerAgent: 'Brian Foster',
    price: 3150000,
    priceFormatted: '$3,150,000',
    earnestDeposit: 100000,
    contingencies: ['Inspection (10 days)', 'Appraisal'],
    closeDate: '2026-05-15',
    financingType: 'Conventional 20% down',
    status: 'reviewed',
    submittedDate: '2026-04-07',
    expirationDate: '2026-04-11',
    notes: 'Strong buyers, pre-approved. Willing to be flexible on close date.',
  },
  {
    id: 'o-2',
    listingId: 'l-6',
    listingAddress: '945 Cherry Blossom Lane',
    buyerName: 'Yun & Associates Trust',
    buyerAgent: 'Sarah Kim',
    price: 3275000,
    priceFormatted: '$3,275,000',
    earnestDeposit: 150000,
    contingencies: ['Inspection (7 days)'],
    closeDate: '2026-05-08',
    financingType: 'All cash',
    status: 'reviewed',
    submittedDate: '2026-04-08',
    expirationDate: '2026-04-12',
    notes: 'All-cash offer. Fast close. No appraisal contingency. 7-day inspection only.',
  },
  {
    id: 'o-3',
    listingId: 'l-6',
    listingAddress: '945 Cherry Blossom Lane',
    buyerName: 'Pham Family',
    buyerAgent: 'Diana Reyes',
    price: 3100000,
    priceFormatted: '$3,100,000',
    earnestDeposit: 80000,
    contingencies: ['Inspection (14 days)', 'Appraisal', 'Loan (21 days)'],
    closeDate: '2026-05-30',
    financingType: 'Conventional 15% down',
    status: 'received',
    submittedDate: '2026-04-09',
    expirationDate: '2026-04-13',
    notes: 'First-time move-up buyers. Love the neighborhood. Extended contingency timelines.',
  },
  {
    id: 'o-4',
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    buyerName: 'Chen-Williams',
    buyerAgent: 'Brian Foster',
    price: 2450000,
    priceFormatted: '$2,450,000',
    earnestDeposit: 75000,
    contingencies: ['Inspection (10 days)', 'Appraisal'],
    closeDate: '2026-05-20',
    financingType: 'Conventional 25% down',
    status: 'received',
    submittedDate: '2026-04-09',
    expirationDate: '2026-04-13',
    notes: 'Downsizer couple. Very motivated. Flexible on timeline.',
  },
  {
    id: 'o-5',
    listingId: 'l-1',
    listingAddress: '123 Main Street',
    buyerName: 'Johnson Trust',
    buyerAgent: 'Unknown',
    price: 2400000,
    priceFormatted: '$2,400,000',
    earnestDeposit: 50000,
    contingencies: ['Inspection (14 days)', 'Appraisal', 'Loan (17 days)'],
    closeDate: '2026-06-01',
    financingType: 'Jumbo loan 10% down',
    status: 'received',
    submittedDate: '2026-04-08',
    expirationDate: '2026-04-12',
    notes: 'First offer received. Some contingency concerns.',
  },
];

// ─── Vendors ─────────────────────────────────────────────────────────────────

export const vendors: Vendor[] = [
  {
    id: 'v-1',
    name: 'Tom Bradley',
    company: 'Bradley Renovations',
    category: 'contractor',
    categoryLabel: 'General Contractor',
    phone: '(408) 555-6600',
    email: 'tom@bradleyrenovations.com',
    initials: 'TB',
    rating: 4.8,
    reliabilityScore: 95,
    avgResponseTime: '< 4 hours',
    projectsCompleted: 12,
    avgCost: '$8,500',
    serviceArea: 'South Bay, Peninsula',
    specialties: ['Kitchen remodels', 'Bathroom updates', 'Flooring', 'Paint'],
  },
  {
    id: 'v-2',
    name: 'Ana Gonzalez',
    company: 'Meridian Home Staging',
    category: 'stager',
    categoryLabel: 'Home Staging',
    phone: '(650) 555-1100',
    email: 'ana@meridianstaging.com',
    initials: 'AG',
    rating: 4.9,
    reliabilityScore: 98,
    avgResponseTime: '< 2 hours',
    projectsCompleted: 18,
    avgCost: '$6,200',
    serviceArea: 'Bay Area wide',
    specialties: ['Luxury staging', 'Vacant staging', 'Occupied consultation', 'Virtual staging'],
  },
  {
    id: 'v-3',
    name: 'Kevin Tran',
    company: 'Tran Group Photography',
    category: 'photographer',
    categoryLabel: 'Photography & Video',
    phone: '(408) 555-3300',
    email: 'kevin@trangroupphoto.com',
    initials: 'KT',
    rating: 5.0,
    reliabilityScore: 100,
    avgResponseTime: '< 1 hour',
    projectsCompleted: 24,
    avgCost: '$1,800',
    serviceArea: 'Bay Area wide',
    specialties: ['Aerial drone', 'Twilight shoots', 'Video tours', '3D Matterport'],
  },
  {
    id: 'v-4',
    name: 'Robert Cheng',
    company: 'Bay Area Property Inspections',
    category: 'inspector',
    categoryLabel: 'Property Inspector',
    phone: '(510) 555-2299',
    email: 'rcheng@bayareainspect.com',
    initials: 'RC',
    rating: 4.7,
    reliabilityScore: 92,
    avgResponseTime: '< 6 hours',
    projectsCompleted: 8,
    avgCost: '$650',
    serviceArea: 'East Bay, South Bay',
    specialties: ['Full home inspection', 'Pest/termite', 'Foundation', 'Roof certification'],
  },
  {
    id: 'v-5',
    name: 'Maria Santos',
    company: 'Green Thumb Landscaping',
    category: 'landscaper',
    categoryLabel: 'Landscaping',
    phone: '(408) 555-9911',
    email: 'maria@greenthumbland.com',
    initials: 'MS',
    rating: 4.6,
    reliabilityScore: 88,
    avgResponseTime: '< 12 hours',
    projectsCompleted: 6,
    avgCost: '$3,200',
    serviceArea: 'South Bay',
    specialties: ['Curb appeal', 'Drought-tolerant', 'Lawn installation', 'Hardscaping'],
  },
  {
    id: 'v-6',
    name: 'David Park',
    company: 'Park Painting Co.',
    category: 'painter',
    categoryLabel: 'Painting',
    phone: '(650) 555-4422',
    email: 'david@parkpainting.com',
    initials: 'DP',
    rating: 4.5,
    reliabilityScore: 90,
    avgResponseTime: '< 8 hours',
    projectsCompleted: 10,
    avgCost: '$4,500',
    serviceArea: 'Peninsula, South Bay',
    specialties: ['Interior painting', 'Exterior painting', 'Cabinet refinishing', 'Wallpaper removal'],
  },
];

// ─── Financial Data ──────────────────────────────────────────────────────────

export const financials: FinancialSummary[] = [
  {
    listingId: 'l-1',
    totalBudget: 28000,
    spent: 22400,
    remaining: 5600,
    pendingQuotes: 0,
    categories: [
      { name: 'Kitchen Update', budgeted: 12000, actual: 11200, variance: 800 },
      { name: 'Staging', budgeted: 6500, actual: 6200, variance: 300 },
      { name: 'Photography & Video', budgeted: 2500, actual: 1800, variance: 700 },
      { name: 'Marketing & Ads', budgeted: 3000, actual: 2200, variance: 800 },
      { name: 'Landscaping', budgeted: 4000, actual: 1000, variance: 3000 },
    ],
  },
  {
    listingId: 'l-2',
    totalBudget: 45000,
    spent: 38500,
    remaining: 6500,
    pendingQuotes: 1,
    categories: [
      { name: 'Full Renovation', budgeted: 25000, actual: 24000, variance: 1000 },
      { name: 'Staging (Luxury)', budgeted: 9000, actual: 8500, variance: 500 },
      { name: 'Photography & Drone', budgeted: 3500, actual: 3200, variance: 300 },
      { name: 'Marketing & Ads', budgeted: 5000, actual: 2800, variance: 2200 },
      { name: 'Landscaping', budgeted: 2500, actual: 0, variance: 2500 },
    ],
  },
];

// ─── Documents ──────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  name: string;
  category: 'disclosures' | 'inspection' | 'title' | 'contracts' | 'marketing' | 'photos' | 'other';
  categoryLabel: string;
  listingId: string;
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
  fileType: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'complete' | 'expired';
  statusLabel: string;
  version: number;
}

export const documents: Document[] = [
  { id: 'd-1', name: 'Transfer Disclosure Statement (TDS)', category: 'disclosures', categoryLabel: 'Disclosures', listingId: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-28', fileSize: '245 KB', fileType: 'PDF', status: 'signed', statusLabel: 'Signed', version: 1 },
  { id: 'd-2', name: 'Seller Property Questionnaire (SPQ)', category: 'disclosures', categoryLabel: 'Disclosures', listingId: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-28', fileSize: '180 KB', fileType: 'PDF', status: 'signed', statusLabel: 'Signed', version: 1 },
  { id: 'd-3', name: 'Natural Hazard Disclosure (NHD)', category: 'disclosures', categoryLabel: 'Disclosures', listingId: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-30', fileSize: '1.2 MB', fileType: 'PDF', status: 'complete', statusLabel: 'Complete', version: 1 },
  { id: 'd-4', name: 'Home Inspection Report', category: 'inspection', categoryLabel: 'Inspection', listingId: 'l-1', uploadedBy: 'Robert Cheng', uploadedDate: '2026-03-25', fileSize: '3.8 MB', fileType: 'PDF', status: 'complete', statusLabel: 'Complete', version: 1 },
  { id: 'd-5', name: 'Pest Inspection Report', category: 'inspection', categoryLabel: 'Inspection', listingId: 'l-1', uploadedBy: 'Robert Cheng', uploadedDate: '2026-03-25', fileSize: '890 KB', fileType: 'PDF', status: 'complete', statusLabel: 'Complete', version: 1 },
  { id: 'd-6', name: 'Listing Agreement', category: 'contracts', categoryLabel: 'Contracts', listingId: 'l-1', uploadedBy: 'Lauren Chen', uploadedDate: '2026-03-20', fileSize: '320 KB', fileType: 'PDF', status: 'signed', statusLabel: 'Signed', version: 2 },
  { id: 'd-7', name: 'MLS Photo Package', category: 'photos', categoryLabel: 'Photos', listingId: 'l-1', uploadedBy: 'Kevin Tran', uploadedDate: '2026-04-02', fileSize: '48 MB', fileType: 'ZIP', status: 'complete', statusLabel: 'Complete', version: 1 },
  { id: 'd-8', name: 'Property Brochure', category: 'marketing', categoryLabel: 'Marketing', listingId: 'l-1', uploadedBy: 'Jordan Nakamura', uploadedDate: '2026-04-03', fileSize: '5.2 MB', fileType: 'PDF', status: 'complete', statusLabel: 'Complete', version: 3 },
  { id: 'd-9', name: 'Purchase Agreement - Chen-Williams', category: 'contracts', categoryLabel: 'Contracts', listingId: 'l-1', uploadedBy: 'Priya Patel', uploadedDate: '2026-04-09', fileSize: '420 KB', fileType: 'PDF', status: 'pending_signature', statusLabel: 'Pending Signature', version: 1 },
  { id: 'd-10', name: 'Preliminary Title Report', category: 'title', categoryLabel: 'Title', listingId: 'l-2', uploadedBy: 'Priya Patel', uploadedDate: '2026-03-18', fileSize: '2.1 MB', fileType: 'PDF', status: 'complete', statusLabel: 'Complete', version: 1 },
  { id: 'd-11', name: 'HOA Documents Package', category: 'disclosures', categoryLabel: 'Disclosures', listingId: 'l-8', uploadedBy: 'Marcus Rivera', uploadedDate: '2026-04-05', fileSize: '8.5 MB', fileType: 'PDF', status: 'draft', statusLabel: 'Draft', version: 1 },
  { id: 'd-12', name: 'Renovation Scope of Work', category: 'other', categoryLabel: 'Other', listingId: 'l-8', uploadedBy: 'Sofia Andrade', uploadedDate: '2026-04-06', fileSize: '1.4 MB', fileType: 'PDF', status: 'draft', statusLabel: 'Draft', version: 2 },
];

// ─── Comparable Sales ────────────────────────────────────────────────────────

export interface CompSale {
  id: string;
  address: string;
  city: string;
  price: number;
  priceFormatted: string;
  sqft: number;
  pricePerSqft: number;
  beds: number;
  baths: number;
  saleDate: string;
  daysOnMarket: number;
  distance: string;
  adjustedValue: number;
  adjustedValueFormatted: string;
  adjustments: { label: string; amount: number }[];
  photoUrl: string;
  lat: number;
  lng: number;
}

export const compSales: CompSale[] = [
  { id: 'comp-1', address: '145 Main Street', city: 'Los Gatos', price: 2380000, priceFormatted: '$2,380,000', sqft: 2650, pricePerSqft: 898, beds: 4, baths: 3, saleDate: '2026-02-15', daysOnMarket: 12, distance: '0.2 mi', adjustedValue: 2460000, adjustedValueFormatted: '$2,460,000', adjustments: [{ label: 'Larger lot', amount: 30000 }, { label: 'Updated kitchen', amount: 50000 }], photoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop', lat: 37.2365, lng: -121.9610 },
  { id: 'comp-2', address: '88 University Avenue', city: 'Los Gatos', price: 2550000, priceFormatted: '$2,550,000', sqft: 2900, pricePerSqft: 879, beds: 4, baths: 3, saleDate: '2026-01-28', daysOnMarket: 8, distance: '0.4 mi', adjustedValue: 2510000, adjustedValueFormatted: '$2,510,000', adjustments: [{ label: 'Slightly larger', amount: -40000 }], photoUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop', lat: 37.2340, lng: -121.9650 },
  { id: 'comp-3', address: '302 Tait Avenue', city: 'Los Gatos', price: 2650000, priceFormatted: '$2,650,000', sqft: 3100, pricePerSqft: 855, beds: 4, baths: 3.5, saleDate: '2026-03-02', daysOnMarket: 15, distance: '0.5 mi', adjustedValue: 2520000, adjustedValueFormatted: '$2,520,000', adjustments: [{ label: 'Extra half bath', amount: -20000 }, { label: 'Larger sqft', amount: -110000 }], photoUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop', lat: 37.2380, lng: -121.9580 },
  { id: 'comp-4', address: '75 Edelen Avenue', city: 'Los Gatos', price: 2290000, priceFormatted: '$2,290,000', sqft: 2500, pricePerSqft: 916, beds: 3, baths: 2.5, saleDate: '2026-02-20', daysOnMarket: 21, distance: '0.3 mi', adjustedValue: 2430000, adjustedValueFormatted: '$2,430,000', adjustments: [{ label: 'Fewer beds', amount: 80000 }, { label: 'Smaller sqft', amount: 60000 }], photoUrl: 'https://images.unsplash.com/photo-1600573472572-8aba140b2c78?w=400&h=300&fit=crop', lat: 37.2345, lng: -121.9635 },
  { id: 'comp-5', address: '1120 Arroyo Seco', city: 'Los Gatos', price: 2425000, priceFormatted: '$2,425,000', sqft: 2750, pricePerSqft: 882, beds: 4, baths: 2.5, saleDate: '2026-03-10', daysOnMarket: 10, distance: '0.6 mi', adjustedValue: 2490000, adjustedValueFormatted: '$2,490,000', adjustments: [{ label: 'Half bath less', amount: 15000 }, { label: 'Newer build', amount: 50000 }], photoUrl: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=400&h=300&fit=crop', lat: 37.2320, lng: -121.9590 },
];

// ─── Time-Series Chart Data ─────────────────────────────────────────────────

export const viewsTimeSeries = {
  labels: ['Mar 22', 'Mar 24', 'Mar 26', 'Mar 28', 'Mar 30', 'Apr 1', 'Apr 3', 'Apr 5', 'Apr 7', 'Apr 9'],
  zillow: [45, 62, 85, 120, 98, 110, 95, 78, 65, 52],
  redfin: [32, 48, 55, 72, 68, 75, 62, 55, 48, 38],
  realtor: [20, 28, 35, 45, 40, 42, 38, 32, 28, 22],
};

export const showingsTimeSeries = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  showings: [3, 6, 8, 4],
  openHouseAttendees: [12, 18, 15, 0],
};

export const pipelineValueTimeSeries = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  values: [8500000, 12200000, 16800000, 18405000],
  closedDeals: [2, 1, 3, 0],
};

export const teamPerformanceData = {
  members: ['Lauren C.', 'Marcus R.', 'Priya P.', 'Jordan N.', 'Sofia A.'],
  activeTasks: [4, 3, 2, 3, 2],
  completedThisMonth: [12, 8, 15, 10, 7],
  avgCompletionDays: [2.1, 1.8, 1.5, 2.4, 3.2],
};

// ─── Quotes ─────────────────────────────────────────────────────────────────

export interface Quote {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorCompany: string;
  listingId: string;
  listingAddress: string;
  scope: string;
  amount: number;
  amountFormatted: string;
  status: 'requested' | 'received' | 'approved' | 'declined';
  requestedDate: string;
  receivedDate?: string;
  validUntil?: string;
  lineItems: { description: string; amount: number }[];
  notes?: string;
}

export const quotes: Quote[] = [
  { id: 'q-1', vendorId: 'v-1', vendorName: 'Tom Bradley', vendorCompany: 'Bradley Renovations', listingId: 'l-8', listingAddress: '88 Sunnyvale Avenue', scope: 'Bathroom renovation', amount: 12400, amountFormatted: '$12,400', status: 'received', requestedDate: '2026-04-03', receivedDate: '2026-04-07', validUntil: '2026-04-21', lineItems: [{ description: 'Demo & haul', amount: 1800 }, { description: 'Plumbing rough-in', amount: 2200 }, { description: 'Tile & grout', amount: 3400 }, { description: 'Vanity & fixtures', amount: 3200 }, { description: 'Paint & trim', amount: 1800 }], notes: 'Can start as early as next Monday if approved' },
  { id: 'q-2', vendorId: 'v-2', vendorName: 'Ana Gonzalez', vendorCompany: 'Meridian Home Staging', listingId: 'l-4', listingAddress: '2200 Willow Glen Way', scope: 'Full vacant staging (2 months)', amount: 5800, amountFormatted: '$5,800', status: 'approved', requestedDate: '2026-03-28', receivedDate: '2026-03-29', validUntil: '2026-04-15', lineItems: [{ description: 'Staging design', amount: 800 }, { description: 'Furniture rental (2 mo)', amount: 3600 }, { description: 'Delivery & install', amount: 700 }, { description: 'De-stage & pickup', amount: 700 }] },
  { id: 'q-3', vendorId: 'v-3', vendorName: 'Kevin Tran', vendorCompany: 'Tran Group Photography', listingId: 'l-3', listingAddress: '789 Elm Street', scope: 'Full photo + video package', amount: 2200, amountFormatted: '$2,200', status: 'approved', requestedDate: '2026-04-05', receivedDate: '2026-04-05', validUntil: '2026-04-20', lineItems: [{ description: 'Professional photos (40+)', amount: 800 }, { description: 'Drone aerial (8 shots)', amount: 400 }, { description: 'Video walkthrough (2 min)', amount: 600 }, { description: 'Twilight shoot', amount: 400 }] },
  { id: 'q-4', vendorId: 'v-5', vendorName: 'Maria Santos', vendorCompany: 'Green Thumb Landscaping', listingId: 'l-1', listingAddress: '123 Main Street', scope: 'Curb appeal package', amount: 3800, amountFormatted: '$3,800', status: 'requested', requestedDate: '2026-04-08', lineItems: [] },
  { id: 'q-5', vendorId: 'v-6', vendorName: 'David Park', vendorCompany: 'Park Painting Co.', listingId: 'l-8', listingAddress: '88 Sunnyvale Avenue', scope: 'Interior repaint - full unit', amount: 4200, amountFormatted: '$4,200', status: 'received', requestedDate: '2026-04-04', receivedDate: '2026-04-06', validUntil: '2026-04-20', lineItems: [{ description: 'Prep & prime (all rooms)', amount: 1200 }, { description: 'Paint (2 coats)', amount: 2400 }, { description: 'Trim & baseboards', amount: 600 }] },
];

// ─── Marketing Assets ────────────────────────────────────────────────────────

export interface MarketingAsset {
  id: string;
  listingId: string;
  type: 'photo' | 'video' | 'floorplan' | 'brochure' | 'social_post' | 'virtual_tour';
  typeLabel: string;
  name: string;
  status: 'scheduled' | 'in_production' | 'complete' | 'published';
  url?: string;
  date: string;
  platform?: string;
  metrics?: { impressions?: number; clicks?: number; saves?: number };
}

export const marketingAssets: MarketingAsset[] = [
  { id: 'ma-1', listingId: 'l-1', type: 'photo', typeLabel: 'Photography', name: 'Professional photo package (42 photos)', status: 'complete', date: '2026-04-02' },
  { id: 'ma-2', listingId: 'l-1', type: 'video', typeLabel: 'Video Tour', name: 'Cinematic video walkthrough', status: 'complete', date: '2026-04-03' },
  { id: 'ma-3', listingId: 'l-1', type: 'floorplan', typeLabel: 'Floor Plan', name: '2D floor plan with measurements', status: 'complete', date: '2026-04-01' },
  { id: 'ma-4', listingId: 'l-1', type: 'brochure', typeLabel: 'Brochure', name: 'Property brochure (digital + print)', status: 'complete', date: '2026-04-03' },
  { id: 'ma-5', listingId: 'l-1', type: 'social_post', typeLabel: 'Social Post', name: 'Instagram carousel — Just Listed', status: 'published', date: '2026-04-04', platform: 'Instagram', metrics: { impressions: 3420, clicks: 186, saves: 45 } },
  { id: 'ma-6', listingId: 'l-1', type: 'social_post', typeLabel: 'Social Post', name: 'Facebook Open House promo', status: 'published', date: '2026-04-06', platform: 'Facebook', metrics: { impressions: 1890, clicks: 92, saves: 18 } },
  { id: 'ma-7', listingId: 'l-1', type: 'social_post', typeLabel: 'Social Post', name: 'LinkedIn — Market insight post', status: 'scheduled', date: '2026-04-12', platform: 'LinkedIn' },
  { id: 'ma-8', listingId: 'l-1', type: 'virtual_tour', typeLabel: 'Virtual Tour', name: '3D Matterport walkthrough', status: 'complete', date: '2026-04-02' },
  { id: 'ma-9', listingId: 'l-3', type: 'photo', typeLabel: 'Photography', name: 'Professional photos (scheduled)', status: 'scheduled', date: '2026-04-14' },
  { id: 'ma-10', listingId: 'l-3', type: 'video', typeLabel: 'Video Tour', name: 'Video walkthrough', status: 'scheduled', date: '2026-04-15' },
];

// ─── Integrations Config ─────────────────────────────────────────────────────

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'email' | 'calendar' | 'documents' | 'mls' | 'marketing' | 'financial' | 'communication';
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  connectedBy?: string;
}

export const integrations: Integration[] = [
  { id: 'int-1', name: 'Gmail', description: 'Email sync and send', category: 'email', icon: 'Mail', status: 'connected', lastSync: '2 minutes ago', connectedBy: 'Lauren Chen' },
  { id: 'int-2', name: 'Google Calendar', description: 'Showings and appointments', category: 'calendar', icon: 'Calendar', status: 'connected', lastSync: '5 minutes ago', connectedBy: 'Lauren Chen' },
  { id: 'int-3', name: 'DocuSign', description: 'E-signatures and document routing', category: 'documents', icon: 'FileSignature', status: 'connected', lastSync: '1 hour ago', connectedBy: 'Priya Patel' },
  { id: 'int-4', name: 'MLSListings (Bay Area)', description: 'MLS data and comp feeds', category: 'mls', icon: 'Database', status: 'connected', lastSync: '30 minutes ago', connectedBy: 'Lauren Chen' },
  { id: 'int-5', name: 'Zillow', description: 'View and save analytics', category: 'marketing', icon: 'BarChart', status: 'connected', lastSync: '1 hour ago', connectedBy: 'Lauren Chen' },
  { id: 'int-6', name: 'QuickBooks', description: 'Financial tracking and invoicing', category: 'financial', icon: 'Receipt', status: 'disconnected' },
  { id: 'int-7', name: 'Instagram Business', description: 'Social media posting and analytics', category: 'marketing', icon: 'Instagram', status: 'connected', lastSync: '3 hours ago', connectedBy: 'Jordan Nakamura' },
  { id: 'int-8', name: 'Twilio', description: 'SMS messaging (Phase 2)', category: 'communication', icon: 'MessageSquare', status: 'disconnected' },
];

// ─── Workflow Templates ──────────────────────────────────────────────────────

export interface WorkflowTemplate {
  id: string;
  name: string;
  phase: ListingPhase;
  taskCount: number;
  description: string;
  isDefault: boolean;
}

export const workflowTemplates: WorkflowTemplate[] = [
  { id: 'wf-1', name: 'Standard Onboarding', phase: 'onboarding', taskCount: 8, description: 'Client intake, listing agreement, initial docs', isDefault: true },
  { id: 'wf-2', name: 'Pre-Market Improvements', phase: 'improvement', taskCount: 6, description: 'Vendor quotes, improvement planning, permits', isDefault: true },
  { id: 'wf-3', name: 'Staging & Preparation', phase: 'staging', taskCount: 5, description: 'Staging coordination, vendor scheduling', isDefault: true },
  { id: 'wf-4', name: 'Content Production', phase: 'content', taskCount: 7, description: 'Photography, video, copy, materials', isDefault: true },
  { id: 'wf-5', name: 'Active Marketing Launch', phase: 'marketing', taskCount: 8, description: 'MLS, social, open houses, advertising', isDefault: true },
  { id: 'wf-6', name: 'Showings Management', phase: 'showings', taskCount: 4, description: 'Showing coordination, feedback, follow-up', isDefault: true },
  { id: 'wf-7', name: 'Offer Review', phase: 'offers', taskCount: 5, description: 'Offer intake, comparison, negotiation', isDefault: true },
  { id: 'wf-8', name: 'Under Contract', phase: 'contract', taskCount: 10, description: 'Inspections, appraisal, contingencies, closing prep', isDefault: true },
  { id: 'wf-9', name: 'Closing Process', phase: 'closing', taskCount: 6, description: 'Final walkthrough, signing, key handoff', isDefault: true },
  { id: 'wf-10', name: 'Luxury Marketing', phase: 'marketing', taskCount: 12, description: 'Extended marketing for $2M+ properties', isDefault: false },
];

// ─── Dashboard Summary Helpers ───────────────────────────────────────────────

export function getListingsByPhase(): Record<ListingPhase, Listing[]> {
  const grouped = {} as Record<ListingPhase, Listing[]>;
  for (const phase of Object.keys(PHASES) as ListingPhase[]) {
    grouped[phase] = listings.filter((l) => l.phase === phase);
  }
  return grouped;
}

export function getMyTasks(memberId: string = 'tm-1'): Task[] {
  return tasks
    .filter((t) => t.assignee.id === memberId && t.status !== 'done')
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

export function getOverdueTasks(): Task[] {
  return tasks.filter((t) => t.isOverdue);
}

export function getActiveListingsCount(): number {
  return listings.length;
}

export function getTotalPipelineValue(): string {
  const total = listings.reduce((sum, l) => sum + l.price, 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(total);
}

export function getRecentActivity(limit: number = 10): ActivityItem[] {
  return activityItems.slice(0, limit);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
