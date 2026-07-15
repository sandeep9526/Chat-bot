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

-- ---- Subscriptions (Phase 3 foundation: license gate + plan limits) ----
-- One row per paying account (owner_user_id = Better Auth user.id — a solo
-- founder's first customers are one user each, no separate "accounts" table
-- yet; add one later if multi-seat orgs are ever needed). Bots with no owner
-- (the 5 pre-existing demo bots) are never gated — see get_bot()'s is_active
-- computation in db.py.
--
-- Writes only ever come from two trusted, narrow code paths: trial
-- auto-provisioning at first-bot-creation (db.ensure_trial_subscription,
-- runs with the creating user's own app.user_id) and the Paddle webhook
-- handler (verified by webhook signature before it ever touches the DB, and
-- sets app.user_id to the subscription's own owner from Paddle's
-- custom_data). There is no user-facing "set my own plan" endpoint — RLS
-- here is defense-in-depth on top of that, not the only gate.
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      BIGSERIAL PRIMARY KEY,
  owner_user_id           TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  plan                    TEXT NOT NULL DEFAULT 'trial',      -- trial | starter | pro | business
  status                  TEXT NOT NULL DEFAULT 'trialing',   -- trialing | active | past_due | canceled | expired
  max_bots                INT NOT NULL DEFAULT 1,
  max_messages_per_month  INT NOT NULL DEFAULT 500,
  trial_ends_at           TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  paddle_subscription_id  TEXT,
  paddle_customer_id      TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select_owner ON subscriptions;
DROP POLICY IF EXISTS subscriptions_select_public_bot ON subscriptions;
DROP POLICY IF EXISTS subscriptions_insert_owner ON subscriptions;
DROP POLICY IF EXISTS subscriptions_update_owner ON subscriptions;

CREATE POLICY subscriptions_select_owner ON subscriptions
  FOR SELECT
  USING (owner_user_id = NULLIF(current_setting('app.user_id', true), ''));

-- The public /chat|/config path (db.get_bot) needs to read the license
-- status of the ONE bot it's already scoped to via app.public_bot_id — same
-- exception shape as bots_select. This is the row itself becoming visible
-- (status/trial_ends_at/max_messages_per_month), not a listing: a caller
-- must already know the exact bot_id, same as for the bots table.
CREATE POLICY subscriptions_select_public_bot ON subscriptions
  FOR SELECT
  USING (
    owner_user_id IN (
      SELECT owner_user_id FROM bots WHERE bot_id = NULLIF(current_setting('app.public_bot_id', true), '')
    )
  );

CREATE POLICY subscriptions_insert_owner ON subscriptions
  FOR INSERT
  WITH CHECK (owner_user_id = NULLIF(current_setting('app.user_id', true), ''));

CREATE POLICY subscriptions_update_owner ON subscriptions
  FOR UPDATE
  USING (owner_user_id = NULLIF(current_setting('app.user_id', true), ''));

-- ---- Grants for the least-privilege runtime role -----------------------
-- zeva_app (NOBYPASSRLS) is what the FastAPI backend actually connects as;
-- neondb_owner (BYPASSRLS, used to run this file) stays reserved for
-- schema/migrations. Kept here — not a one-off script — so a fresh
-- environment only needs this one file plus the role-creation step in
-- ONBOARDING.md.
GRANT USAGE ON SCHEMA public TO zeva_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON bots, leads, chats, handoffs, subscriptions TO zeva_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO zeva_app;
GRANT REFERENCES ON "user" TO zeva_app;
