-- Zeva app schema (Postgres / Neon). Better Auth owns "user"/"session"/
-- "account"/"verification"/"jwks" (migrated separately via the Better Auth
-- CLI from the Next.js app) — this file owns the product tables and
-- references "user"(id) for bot ownership.
--
-- Safe to re-run: CREATE ... IF NOT EXISTS + DROP POLICY IF EXISTS before
-- each CREATE POLICY.

CREATE TABLE IF NOT EXISTS bots (
  bot_id          TEXT PRIMARY KEY,
  owner_user_id   TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  name            TEXT,
  accent          TEXT DEFAULT '#4f46e5',
  welcome         TEXT,
  suggestions     JSONB DEFAULT '[]'::jsonb,
  allowed_domains JSONB DEFAULT '["*"]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id         BIGSERIAL PRIMARY KEY,
  bot_id     TEXT NOT NULL REFERENCES bots(bot_id) ON DELETE CASCADE,
  name       TEXT,
  email      TEXT,
  phone      TEXT,
  message    TEXT,
  score      TEXT DEFAULT 'cold',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chats (
  id           BIGSERIAL PRIMARY KEY,
  bot_id       TEXT NOT NULL REFERENCES bots(bot_id) ON DELETE CASCADE,
  question     TEXT,
  answer       TEXT,
  is_guardrail BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS handoffs (
  id         BIGSERIAL PRIMARY KEY,
  bot_id     TEXT NOT NULL REFERENCES bots(bot_id) ON DELETE CASCADE,
  name       TEXT,
  contact    TEXT,
  summary    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bots_owner   ON bots(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_bot    ON leads(bot_id);
CREATE INDEX IF NOT EXISTS idx_chats_bot    ON chats(bot_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_bot ON handoffs(bot_id);

-- ---- Row-Level Security -----------------------------------------------
-- Cross-tenant reads are blocked by Postgres itself, not only by app code
-- forgetting a WHERE clause. FORCE is required because the connecting role
-- (neondb_owner) owns these tables, and table owners bypass RLS unless
-- FORCE is also set.
ALTER TABLE bots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots     FORCE  ROW LEVEL SECURITY;
ALTER TABLE leads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads    FORCE  ROW LEVEL SECURITY;
ALTER TABLE chats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats    FORCE  ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bots_select           ON bots;
DROP POLICY IF EXISTS bots_insert_owner     ON bots;
DROP POLICY IF EXISTS bots_update_owner     ON bots;
DROP POLICY IF EXISTS leads_select_owner    ON leads;
DROP POLICY IF EXISTS leads_insert_any      ON leads;
DROP POLICY IF EXISTS chats_select_owner    ON chats;
DROP POLICY IF EXISTS chats_insert_any      ON chats;
DROP POLICY IF EXISTS handoffs_select_owner ON handoffs;
DROP POLICY IF EXISTS handoffs_insert_any   ON handoffs;

-- bots: the owner sees their own bots (admin listing / dashboard). An
-- anonymous/public caller (widget, /config, /chat, /lead) can only see the
-- ONE bot they explicitly asked for — db.get_bot() sets app.public_bot_id
-- to that bot_id before the lookup. Nobody can list all tenants by default.
CREATE POLICY bots_select ON bots
  FOR SELECT
  USING (
    owner_user_id = NULLIF(current_setting('app.user_id', true), '')
    OR bot_id = NULLIF(current_setting('app.public_bot_id', true), '')
  );

CREATE POLICY bots_insert_owner ON bots
  FOR INSERT
  WITH CHECK (owner_user_id = NULLIF(current_setting('app.user_id', true), ''));

CREATE POLICY bots_update_owner ON bots
  FOR UPDATE
  USING (owner_user_id = NULLIF(current_setting('app.user_id', true), ''));

-- leads/chats/handoffs: only the owning bot's owner can read them (dashboard
-- / /leads / /admin/stats / /admin/handoffs). Anyone can insert — anonymous
-- website visitors are the ones submitting leads and chatting, not the bot
-- owner. INSERT is still scoped to a real, existing bot_id.
CREATE POLICY leads_select_owner ON leads
  FOR SELECT
  USING (bot_id IN (
    SELECT bot_id FROM bots WHERE owner_user_id = NULLIF(current_setting('app.user_id', true), '')
  ));
CREATE POLICY leads_insert_any ON leads
  FOR INSERT
  WITH CHECK (bot_id IN (SELECT bot_id FROM bots));

CREATE POLICY chats_select_owner ON chats
  FOR SELECT
  USING (bot_id IN (
    SELECT bot_id FROM bots WHERE owner_user_id = NULLIF(current_setting('app.user_id', true), '')
  ));
CREATE POLICY chats_insert_any ON chats
  FOR INSERT
  WITH CHECK (bot_id IN (SELECT bot_id FROM bots));

CREATE POLICY handoffs_select_owner ON handoffs
  FOR SELECT
  USING (bot_id IN (
    SELECT bot_id FROM bots WHERE owner_user_id = NULLIF(current_setting('app.user_id', true), '')
  ));
CREATE POLICY handoffs_insert_any ON handoffs
  FOR INSERT
  WITH CHECK (bot_id IN (SELECT bot_id FROM bots));
