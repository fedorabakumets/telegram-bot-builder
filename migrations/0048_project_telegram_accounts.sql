/** @fileoverview Хранение проектных Telegram-аккаунтов и связей ботов. */
BEGIN;

CREATE TABLE IF NOT EXISTS project_telegram_accounts (
  id serial PRIMARY KEY,
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  masked_phone text,
  telegram_user_id text,
  telegram_name text,
  telegram_username text,
  session_kind text,
  session_secret text,
  session_fingerprint text,
  session_verified boolean NOT NULL DEFAULT false,
  proxy jsonb,
  proxy_secret text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_telegram_accounts_project_id_id UNIQUE (project_id, id),
  CONSTRAINT project_telegram_accounts_session_fingerprint UNIQUE (session_fingerprint)
);

/** Составные ключи исключают связывание ботов и аккаунтов из разных проектов. */
CREATE UNIQUE INDEX IF NOT EXISTS bot_tokens_project_id_id ON bot_tokens (project_id, id);

ALTER TABLE project_telegram_accounts ADD COLUMN IF NOT EXISTS session_verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS project_telegram_account_bots (
  bot_token_id integer PRIMARY KEY,
  project_id integer NOT NULL,
  account_id integer NOT NULL,
  CONSTRAINT project_telegram_account_bots_project_account_fk
    FOREIGN KEY (project_id, account_id) REFERENCES project_telegram_accounts (project_id, id) ON DELETE CASCADE,
  CONSTRAINT project_telegram_account_bots_project_token_fk
    FOREIGN KEY (project_id, bot_token_id) REFERENCES bot_tokens (project_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS project_telegram_account_bots_project_account_idx
  ON project_telegram_account_bots (project_id, account_id);

/** Журнал переноса хранит только ссылки и этапы выполнения. */
CREATE TABLE IF NOT EXISTS project_telegram_account_cutovers (
  id text PRIMARY KEY,
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  account_id integer NOT NULL,
  bot_ids jsonb NOT NULL,
  phase text NOT NULL CHECK (phase IN (
    'prepared', 'legacy-stopped', 'shared-installed', 'shared-ready',
    'rollback-started', 'shared-stopped', 'legacy-restored', 'rolled-back'
  )),
  runtime_state jsonb,
  execution_fence text,
  execution_backend_pid integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS project_telegram_account_cutovers_active_project_idx
  ON project_telegram_account_cutovers (project_id)
  WHERE phase NOT IN ('shared-ready', 'rolled-back');

COMMIT;
