-- ============================================================
-- 0007_rls_new_tables.sql
-- Add RLS policies and grants for tables added after the
-- initial RLS migration: properties, buyer_preferences,
-- external_listings, market_analyses, analysis_schedules,
-- comp_listings.
-- ============================================================

-- --------------------------------------------------------
-- Grants for new tables
-- --------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON buyer_preferences TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON external_listings TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON market_analyses TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON analysis_schedules TO authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON comp_listings TO authenticated;--> statement-breakpoint

-- --------------------------------------------------------
-- RLS: properties (accessed via listings.property_id)
-- --------------------------------------------------------
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "team_member_access" ON properties
  FOR ALL USING (
    id IN (
      SELECT l.property_id FROM listings l
      WHERE l.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );--> statement-breakpoint

-- --------------------------------------------------------
-- RLS: buyer_preferences (accessed via contacts.contact_id)
-- --------------------------------------------------------
ALTER TABLE buyer_preferences ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "team_member_access" ON buyer_preferences
  FOR ALL USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      WHERE c.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );--> statement-breakpoint

-- --------------------------------------------------------
-- RLS: external_listings (has team_id directly)
-- --------------------------------------------------------
ALTER TABLE external_listings ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "team_member_access" ON external_listings
  FOR ALL USING (team_id IN (SELECT get_team_ids_for_user(auth.uid())));--> statement-breakpoint

-- --------------------------------------------------------
-- RLS: market_analyses (accessed via listings.listing_id)
-- --------------------------------------------------------
ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "team_member_access" ON market_analyses
  FOR ALL USING (
    listing_id IN (
      SELECT l.id FROM listings l
      WHERE l.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );--> statement-breakpoint

-- --------------------------------------------------------
-- RLS: analysis_schedules (accessed via listings)
-- --------------------------------------------------------
ALTER TABLE analysis_schedules ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "team_member_access" ON analysis_schedules
  FOR ALL USING (
    listing_id IN (
      SELECT l.id FROM listings l
      WHERE l.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );--> statement-breakpoint

-- --------------------------------------------------------
-- RLS: comp_listings (accessed via market_analyses -> listings)
-- --------------------------------------------------------
ALTER TABLE comp_listings ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "team_member_access" ON comp_listings
  FOR ALL USING (
    market_analysis_id IN (
      SELECT ma.id FROM market_analyses ma
      JOIN listings l ON ma.listing_id = l.id
      WHERE l.team_id IN (SELECT get_team_ids_for_user(auth.uid()))
    )
  );
