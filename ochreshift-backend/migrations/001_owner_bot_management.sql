-- Migration: owner-facing bot management (pause/resume + delete).
-- Additive + idempotent; run via the admin connection (DATABASE_URL /
-- neondb_owner), same as schema.sql. Also folded into schema.sql so a fresh
-- environment gets it from the single file.
--
--   psql "$DATABASE_URL" -f migrations/001_owner_bot_management.sql
--
BEGIN;

-- 1. Owner's own pause switch (distinct from platform-admin `suspended`).
ALTER TABLE bots ADD COLUMN IF NOT EXISTS paused BOOLEAN NOT NULL DEFAULT false;

-- 2. Owner-scoped DELETE policies (none existed before — owners couldn't
--    delete a bot at all). delete_bot_for_owner() removes children first, so
--    each child table needs its own delete policy too.
DROP POLICY IF EXISTS bots_delete_owner ON bots;
CREATE POLICY bots_delete_owner ON bots
  FOR DELETE
  USING (owner_user_id = NULLIF(current_setting('app.user_id', true), ''));

DROP POLICY IF EXISTS chats_delete_owner ON chats;
CREATE POLICY chats_delete_owner ON chats
  FOR DELETE
  USING (bot_id IN (
    SELECT bot_id FROM bots WHERE owner_user_id = NULLIF(current_setting('app.user_id', true), '')
  ));

DROP POLICY IF EXISTS handoffs_delete_owner ON handoffs;
CREATE POLICY handoffs_delete_owner ON handoffs
  FOR DELETE
  USING (bot_id IN (
    SELECT bot_id FROM bots WHERE owner_user_id = NULLIF(current_setting('app.user_id', true), '')
  ));

COMMIT;
