/** @fileoverview Постоянные интервальные расписания проверок без секретов Telegram. */
CREATE TABLE IF NOT EXISTS check_schedules (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER REFERENCES bot_tokens(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('private-chats','telegram-bots')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  every_count INTEGER NOT NULL CHECK(every_count BETWEEN 1 AND 10080),
  unit TEXT NOT NULL CHECK(unit IN ('minute','hour','day','week','month')),
  first_at TIMESTAMPTZ NOT NULL,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_by BIGINT NOT NULL,
  last_run_at TIMESTAMPTZ,
  last_outcome TEXT,
  claim_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS check_schedules_scope ON check_schedules(project_id,kind,COALESCE(token_id,0));
CREATE INDEX IF NOT EXISTS check_schedules_due ON check_schedules(next_run_at) WHERE enabled;
