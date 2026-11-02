/** @fileoverview Независимые от переписки события, аудитория и версии подтверждённой аналитики. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
CREATE TABLE IF NOT EXISTS analytics_events_v2 (
  id bigserial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  event_key text NOT NULL CHECK (length(event_key) BETWEEN 1 AND 220),
  kind text NOT NULL CHECK (kind IN ('message_in','message_out','callback','system')),
  user_id text CHECK (user_id ~ '^[1-9][0-9]{0,19}$'),
  chat_id text CHECK (chat_id ~ '^-?[0-9]{1,20}$'),
  chat_type text NOT NULL CHECK (chat_type IN ('private','group','supergroup','channel','unknown')),
  directed boolean NOT NULL DEFAULT false,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  source_id integer, link_id integer, placement_id integer,
  referrer_id text, purpose text, observed_tag varchar(64),
  attribution_status text NOT NULL DEFAULT 'no_marker',
  metadata jsonb NOT NULL DEFAULT '{}',
  provenance text NOT NULL DEFAULT 'live' CHECK (provenance IN ('live','backfill')),
  first_known boolean NOT NULL DEFAULT true,
  UNIQUE(project_id,token_id,event_key)
);
CREATE INDEX IF NOT EXISTS analytics_events_v2_scope_time ON analytics_events_v2(project_id,token_id,occurred_at);
CREATE INDEX IF NOT EXISTS analytics_events_v2_project_time ON analytics_events_v2(project_id,occurred_at);
CREATE INDEX IF NOT EXISTS analytics_events_v2_user_time ON analytics_events_v2(project_id,user_id,occurred_at);
CREATE INDEX IF NOT EXISTS analytics_events_v2_placement_time ON analytics_events_v2(project_id,placement_id,occurred_at);
CREATE TABLE IF NOT EXISTS analytics_audience_v2 (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  first_interaction_at timestamptz NOT NULL,
  last_interaction_at timestamptz NOT NULL,
  first_event_id bigint NOT NULL REFERENCES analytics_events_v2(id) ON DELETE CASCADE,
  first_known boolean NOT NULL,
  source_id integer, link_id integer, placement_id integer, referrer_id text, purpose text, observed_tag varchar(64),
  attribution_status text NOT NULL,
  PRIMARY KEY(project_id,token_id,user_id)
);
CREATE INDEX IF NOT EXISTS analytics_audience_v2_first ON analytics_audience_v2(project_id,first_interaction_at);
/** Поддерживаем повторный запуск миграции после ранней установки новой схемы. */
ALTER TABLE analytics_events_v2 ADD COLUMN IF NOT EXISTS observed_tag varchar(64);
ALTER TABLE analytics_audience_v2 ADD COLUMN IF NOT EXISTS observed_tag varchar(64);
CREATE TABLE IF NOT EXISTS analytics_legacy_people_v2 (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  PRIMARY KEY(project_id,token_id,user_id)
);
/** Минимальный хеш и граница удаления запрещают повторное восстановление старых фактов из очереди. */
CREATE TABLE IF NOT EXISTS analytics_person_deletions_v2 (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  person_key text NOT NULL,
  deleted_through timestamptz NOT NULL,
  PRIMARY KEY(project_id,token_id,person_key)
);
CREATE TABLE IF NOT EXISTS analytics_runtime_v2 (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 2,
  coverage_from timestamptz NOT NULL DEFAULT clock_timestamp(),
  last_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(project_id,token_id)
);
CREATE TABLE IF NOT EXISTS analytics_daily_v2 (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  day date NOT NULL,kind text NOT NULL,directed boolean NOT NULL,
  event_count bigint NOT NULL DEFAULT 0,
  PRIMARY KEY(project_id,token_id,day,kind,directed)
);
CREATE TABLE IF NOT EXISTS analytics_versions_v2 (
  project_id integer PRIMARY KEY REFERENCES bot_projects(id) ON DELETE CASCADE,
  revision bigint NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS analytics_outbox_v2 (
  id bigserial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer,
  revision bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  affected text[] NOT NULL DEFAULT ARRAY['audience','messages','groups','sources','leaders'],
  UNIQUE(project_id,revision)
);
CREATE INDEX IF NOT EXISTS analytics_outbox_v2_project_revision ON analytics_outbox_v2(project_id,revision);
CREATE TABLE IF NOT EXISTS analytics_backfill_v2 (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  last_message_id bigint NOT NULL DEFAULT 0,
  scanned bigint NOT NULL DEFAULT 0,
  imported bigint NOT NULL DEFAULT 0,
  skipped bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(project_id,token_id)
);
ALTER TABLE analytics_backfill_v2 ADD COLUMN IF NOT EXISTS skipped bigint NOT NULL DEFAULT 0;
COMMIT;
