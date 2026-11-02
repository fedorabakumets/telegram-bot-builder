/** @fileoverview Реестр источников, размещений, ссылок и точных дневных расходов. */
BEGIN;
SELECT pg_advisory_xact_lock(270027);
CREATE TABLE IF NOT EXISTS analytics_sources (
  id serial PRIMARY KEY, project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 200), kind text NOT NULL DEFAULT 'other', url text,
  archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id,id)
);
CREATE TABLE IF NOT EXISTS analytics_placements (
  id serial PRIMARY KEY, project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE, source_id integer NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 200), starts_on date, ends_on date,
  timezone text NOT NULL DEFAULT 'Europe/Moscow', archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id,id), FOREIGN KEY(project_id,source_id) REFERENCES analytics_sources(project_id,id),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);
CREATE TABLE IF NOT EXISTS analytics_links (
  id serial PRIMARY KEY, project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE, source_id integer NOT NULL,
  placement_id integer NOT NULL, code varchar(64) NOT NULL CHECK (code ~ '^[A-Za-z0-9_-]{1,64}$'),
  purpose text NOT NULL DEFAULT 'acquisition' CHECK (purpose IN ('acquisition','referral','combined')),
  referrer_id text CHECK (referrer_id IS NULL OR referrer_id ~ '^[1-9][0-9]{0,19}$'),
  archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id,token_id,code), UNIQUE(project_id,id),
  FOREIGN KEY(project_id,source_id) REFERENCES analytics_sources(project_id,id),
  FOREIGN KEY(project_id,placement_id) REFERENCES analytics_placements(project_id,id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS analytics_expenses (
  id serial PRIMARY KEY, project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  placement_id integer NOT NULL, amount numeric(20,2) NOT NULL CHECK(amount >= 0),
  currency text NOT NULL CHECK(currency IN ('RUB','USD')), day date NOT NULL,
  exchange_rate_rub_per_usd numeric(20,8) CHECK(exchange_rate_rub_per_usd > 0),
  exchange_rate_date date,
  note text NOT NULL DEFAULT '', allocation_group_id uuid, estimated boolean NOT NULL DEFAULT false,
  archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id,id), FOREIGN KEY(project_id,placement_id) REFERENCES analytics_placements(project_id,id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS analytics_acquisition_audit (
  id bigserial PRIMARY KEY, project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  resource text NOT NULL, resource_id integer NOT NULL, actor_id text,
  before_data jsonb, after_data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE analytics_expenses ADD COLUMN IF NOT EXISTS exchange_rate_date date;
CREATE INDEX IF NOT EXISTS analytics_placements_scope_idx ON analytics_placements(project_id,token_id);
CREATE INDEX IF NOT EXISTS analytics_expenses_scope_day_idx ON analytics_expenses(project_id,placement_id,day);
CREATE INDEX IF NOT EXISTS analytics_links_placement_idx ON analytics_links(project_id,placement_id);
COMMENT ON TABLE analytics_expenses IS 'Дневные расходы в исходной валюте; курс фиксируется вручную.';
COMMENT ON TABLE analytics_links IS 'Публичные постоянные метки; одноразовые коды авторизации здесь запрещены.';
COMMIT;
