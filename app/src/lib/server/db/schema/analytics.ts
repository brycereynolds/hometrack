import { pgTable, text, timestamp, integer, real, index, serial, date } from 'drizzle-orm/pg-core';
import { listings } from './listing.js';
import { teams, teamMembers } from './team.js';

// analytics_events — tracks listing views/engagement by platform
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: serial('id').primaryKey(),
    listingId: text('listing_id').references(() => listings.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(), // 'zillow', 'redfin', 'realtor', 'website', 'social'
    eventType: text('event_type').notNull(), // 'view', 'save', 'share', 'inquiry'
    count: integer('count').notNull().default(0),
    date: date('date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('analytics_events_listing_id_idx').on(table.listingId),
    index('analytics_events_date_idx').on(table.date),
    index('analytics_events_listing_date_idx').on(table.listingId, table.date),
  ],
);

// analytics_showings — showing volume tracking
export const analyticsShowings = pgTable(
  'analytics_showings',
  {
    id: serial('id').primaryKey(),
    listingId: text('listing_id').references(() => listings.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    showingCount: integer('showing_count').notNull().default(0),
    openHouseAttendees: integer('open_house_attendees').notNull().default(0),
    feedbackScore: real('feedback_score'), // average feedback rating
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('analytics_showings_listing_id_idx').on(table.listingId),
    index('analytics_showings_date_idx').on(table.date),
  ],
);

// pipeline_metrics — daily pipeline snapshot
export const pipelineMetrics = pgTable(
  'pipeline_metrics',
  {
    id: serial('id').primaryKey(),
    teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    totalValue: real('total_value').notNull(),
    activeListings: integer('active_listings').notNull(),
    preMarketListings: integer('pre_market_listings').notNull(),
    closedValue: real('closed_value').notNull().default(0),
    closedDeals: integer('closed_deals').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('pipeline_metrics_team_id_idx').on(table.teamId),
    index('pipeline_metrics_date_idx').on(table.date),
  ],
);

// team_performance — agent performance metrics
export const teamPerformance = pgTable(
  'team_performance',
  {
    id: serial('id').primaryKey(),
    teamMemberId: text('team_member_id').references(() => teamMembers.id, { onDelete: 'cascade' }),
    period: text('period').notNull(), // 'monthly', 'quarterly', 'yearly'
    periodStart: date('period_start').notNull(),
    activeListings: integer('active_listings').notNull().default(0),
    closedDeals: integer('closed_deals').notNull().default(0),
    totalVolume: real('total_volume').notNull().default(0),
    avgDaysOnMarket: integer('avg_days_on_market'),
    clientSatisfaction: real('client_satisfaction'),
    tasksCompleted: integer('tasks_completed').notNull().default(0),
    avgCompletionDays: real('avg_completion_days'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('team_performance_member_id_idx').on(table.teamMemberId),
    index('team_performance_period_idx').on(table.period, table.periodStart),
  ],
);
