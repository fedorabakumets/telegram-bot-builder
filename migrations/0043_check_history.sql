/**
 * @fileoverview Постоянная история проверок личных чатов и ограничений ботов без секретов Telegram.
 */

/** На новой базе служебные таблицы нужны до более позднего bootstrap приложения. */
CREATE TABLE IF NOT EXISTS chat_access_check_jobs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','cancelling','cancelled','completed','failed')),
  total_count INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  available_count INTEGER NOT NULL DEFAULT 0,
  kicked_count INTEGER NOT NULL DEFAULT 0,
  deleted_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE chat_access_check_jobs ADD COLUMN IF NOT EXISTS historical_token_id INTEGER;
ALTER TABLE chat_access_check_jobs ADD COLUMN IF NOT EXISTS token_name TEXT;
ALTER TABLE chat_access_check_jobs ADD COLUMN IF NOT EXISTS token_username TEXT;
ALTER TABLE chat_access_check_jobs ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE chat_access_check_jobs ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE chat_access_check_jobs ADD COLUMN IF NOT EXISTS worker_id TEXT;
ALTER TABLE chat_access_check_jobs ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ;

/** Числовой ID бота остаётся историческим, поэтому удаление бота не удаляет проверку. */
DO $$
DECLARE constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname FROM pg_constraint c
    WHERE c.conrelid = 'chat_access_check_jobs'::regclass AND c.contype = 'f'
      AND c.confrelid = 'bot_tokens'::regclass
      AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.conrelid
        AND a.attname = 'token_id' AND a.attnum = ANY(c.conkey))
  LOOP
    EXECUTE format('ALTER TABLE chat_access_check_jobs DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END;
$$;

/** Заполняются только неизвестные снимки; переименование не меняет уже сохранённую историю. */
UPDATE chat_access_check_jobs j SET project_name = p.name FROM bot_projects p
WHERE p.id = j.project_id AND j.project_name IS NULL;
UPDATE chat_access_check_jobs j SET
  token_name = COALESCE(j.token_name, t.bot_first_name, t.name),
  token_username = COALESCE(j.token_username, t.bot_username)
FROM bot_tokens t
WHERE t.id = j.token_id AND t.project_id = j.project_id
  AND j.historical_token_id IS NULL;
UPDATE chat_access_check_jobs SET historical_token_id = token_id WHERE historical_token_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chat_access_check_jobs_one_active
  ON chat_access_check_jobs(project_id, token_id) WHERE status IN ('pending','running','cancelling');
CREATE INDEX IF NOT EXISTS chat_access_check_jobs_history
  ON chat_access_check_jobs(project_id, token_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS chat_access_check_jobs_project_history
  ON chat_access_check_jobs(project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS chat_access_check_jobs_expired
  ON chat_access_check_jobs(lease_until) WHERE status IN ('pending','running','cancelling');

/** Группы сохраняют времена и причину завершения независимо от дочерних задач. */
CREATE TABLE IF NOT EXISTS chat_access_check_batches (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  job_ids INTEGER[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE chat_access_check_batches ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE chat_access_check_batches ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;
ALTER TABLE chat_access_check_batches ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE chat_access_check_batches ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE chat_access_check_batches ADD COLUMN IF NOT EXISTS worker_id TEXT;
ALTER TABLE chat_access_check_batches ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ;
UPDATE chat_access_check_batches b SET project_name = p.name FROM bot_projects p
WHERE p.id = b.project_id AND b.project_name IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chat_access_batch_one_active
  ON chat_access_check_batches(project_id) WHERE status IN ('pending','running','cancelling');
CREATE INDEX IF NOT EXISTS chat_access_check_batches_history
  ON chat_access_check_batches(project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS chat_access_check_batches_expired
  ON chat_access_check_batches(lease_until) WHERE status IN ('pending','running','cancelling');

/** Старые группы без проектного FK также удаляются вместе с проектом. */
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'chat_access_check_batches'::regclass
    AND confrelid = 'bot_projects'::regclass AND contype = 'f') THEN
    ALTER TABLE chat_access_check_batches ADD CONSTRAINT chat_access_check_batches_project_fk
      FOREIGN KEY(project_id) REFERENCES bot_projects(id) ON DELETE CASCADE NOT VALID;
  END IF;
END;
$$;

/** Даты завершения восстанавливаются лишь при наличии всех завершённых дочерних задач. */
WITH times AS (
  SELECT b.id, MIN(j.started_at) AS started_at,
    CASE WHEN COUNT(j.id) = cardinality(b.job_ids)
      AND COUNT(j.id) > 0 AND bool_and(j.status IN ('cancelled','completed','failed'))
      AND COUNT(j.finished_at) = COUNT(j.id) THEN MAX(j.finished_at) END AS finished_at
  FROM chat_access_check_batches b LEFT JOIN chat_access_check_jobs j
    ON j.project_id = b.project_id AND j.id = ANY(b.job_ids)
  GROUP BY b.id, b.job_ids
)
UPDATE chat_access_check_batches b SET
  started_at = COALESCE(b.started_at, times.started_at),
  finished_at = COALESCE(b.finished_at,
    CASE WHEN b.status IN ('cancelled','completed','failed') THEN times.finished_at END)
FROM times WHERE times.id = b.id AND (b.started_at IS NULL OR b.finished_at IS NULL);

/** Отдельный запуск проверки Telegram хранит сводку, область и аренду исполнителя. */
CREATE TABLE IF NOT EXISTS telegram_bot_check_runs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  scope_token_id INTEGER,
  scope_name TEXT,
  project_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','cancelling','cancelled','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_count INTEGER NOT NULL DEFAULT 0 CHECK (total_count >= 0),
  processed_count INTEGER NOT NULL DEFAULT 0 CHECK (processed_count >= 0),
  available_count INTEGER NOT NULL DEFAULT 0 CHECK (available_count >= 0),
  unavailable_count INTEGER NOT NULL DEFAULT 0 CHECK (unavailable_count >= 0),
  error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  failure_reason TEXT,
  worker_id TEXT,
  lease_until TIMESTAMPTZ,
  UNIQUE(id, project_id)
);
CREATE INDEX IF NOT EXISTS telegram_bot_check_runs_history
  ON telegram_bot_check_runs(project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS telegram_bot_check_runs_scope_history
  ON telegram_bot_check_runs(project_id, scope_token_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS telegram_bot_check_runs_expired
  ON telegram_bot_check_runs(lease_until) WHERE status IN ('pending','running','cancelling');

/** Результат содержит только безопасные коды и снимок подписи исторического бота. */
CREATE TABLE IF NOT EXISTS telegram_bot_check_items (
  run_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  token_id INTEGER NOT NULL,
  name TEXT,
  username TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','available','unavailable','error')),
  reason TEXT CHECK (reason IN ('no_test_chat','chat_unavailable','rate_limited','error','timeout','network',
    'telegram_error','invalid_response','unauthorized','telegram_frozen','bot_deactivated','token_changed')),
  method TEXT CHECK (method IN ('getMe','getMyCommands','setMyCommands')),
  error_code INTEGER,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  PRIMARY KEY(run_id, token_id),
  FOREIGN KEY(run_id, project_id) REFERENCES telegram_bot_check_runs(id, project_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS telegram_bot_check_items_history
  ON telegram_bot_check_items(project_id, token_id, run_id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS telegram_bot_check_items_one_active
  ON telegram_bot_check_items(project_id, token_id) WHERE status IN ('pending','running');
