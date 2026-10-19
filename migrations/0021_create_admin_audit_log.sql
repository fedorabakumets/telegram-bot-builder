-- Журнал действий администратора над проектами и аккаунтами.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES bot_projects(id) ON DELETE SET NULL,
  owner_id BIGINT REFERENCES telegram_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  status_code INTEGER NOT NULL DEFAULT 200,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_project_idx
  ON admin_audit_log (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_owner_idx
  ON admin_audit_log (owner_id, created_at DESC);
