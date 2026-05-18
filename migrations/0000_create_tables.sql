-- =============================================================================
-- Baseline schema: telegram-bot-builder
-- Актуальный снимок всей БД. Все предыдущие миграции сквошены сюда.
-- =============================================================================

-- ─── Платформа ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS telegram_users (
  id BIGINT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  photo_url TEXT,
  auth_date BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session USING btree (expire);

CREATE TABLE IF NOT EXISTS user_telegram_settings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  api_id TEXT,
  api_hash TEXT,
  phone_number TEXT,
  session_string TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Проекты ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_projects (
  id SERIAL PRIMARY KEY,
  owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  bot_token TEXT,
  user_database_enabled INTEGER DEFAULT 1,
  admin_ids TEXT DEFAULT '',
  session_id TEXT,
  sort_order REAL DEFAULT 0,
  last_exported_google_sheet_id TEXT,
  last_exported_google_sheet_url TEXT,
  last_exported_at TIMESTAMP,
  last_exported_structure_sheet_id TEXT,
  last_exported_structure_sheet_url TEXT,
  last_exported_structure_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_collaborators (
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  invited_by BIGINT REFERENCES telegram_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);

-- ─── Токены ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_tokens (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  description TEXT,
  bot_first_name TEXT,
  bot_username TEXT,
  bot_description TEXT,
  bot_short_description TEXT,
  bot_photo_url TEXT,
  bot_can_join_groups INTEGER,
  bot_can_read_all_group_messages INTEGER,
  bot_supports_inline_queries INTEGER,
  bot_has_main_web_app INTEGER,
  last_used_at TIMESTAMP,
  track_execution_time INTEGER DEFAULT 0,
  total_execution_seconds INTEGER DEFAULT 0,
  auto_restart INTEGER DEFAULT 0,
  max_restart_attempts INTEGER DEFAULT 3,
  log_level TEXT DEFAULT 'DEBUG',
  execution_mode TEXT DEFAULT 'polling',
  launch_mode TEXT DEFAULT 'polling',
  webhook_base_url TEXT,
  webhook_secret_token TEXT,
  protect_content INTEGER DEFAULT 0,
  save_incoming_media INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_env_variables (
  id SERIAL PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  is_secret INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_env_variables_token_id ON bot_env_variables(token_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_env_variables_token_key ON bot_env_variables(token_id, key);

-- ─── Инстансы и запуски ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_instances (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  token TEXT NOT NULL,
  process_id TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  stopped_at TIMESTAMP,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS bot_launch_history (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMP DEFAULT NOW(),
  stopped_at TIMESTAMP,
  error_message TEXT,
  process_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_bot_launch_history_token ON bot_launch_history(token_id);

-- ─── Логи ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_logs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'stdout',
  timestamp TIMESTAMP DEFAULT NOW(),
  launch_id INTEGER REFERENCES bot_launch_history(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_bot_logs_project_token ON bot_logs(project_id, token_id);
CREATE INDEX IF NOT EXISTS idx_bot_logs_launch_id ON bot_logs(launch_id);
CREATE INDEX IF NOT EXISTS idx_bot_logs_timestamp ON bot_logs(timestamp);

-- ─── Пользователи ботов ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_users (
  user_id BIGINT NOT NULL,
  project_id INTEGER NOT NULL DEFAULT 0,
  token_id INTEGER NOT NULL DEFAULT 0,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  registered_at TIMESTAMP DEFAULT NOW(),
  last_interaction TIMESTAMP DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 0,
  user_data JSONB DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  avatar_url TEXT,
  is_bot INTEGER DEFAULT 0,
  is_premium INTEGER DEFAULT 0,
  language_code TEXT,
  deep_link_param TEXT,
  referrer_id TEXT,
  PRIMARY KEY (user_id, project_id, token_id)
);
CREATE INDEX IF NOT EXISTS idx_bot_users_project_token ON bot_users(project_id, token_id);
CREATE INDEX IF NOT EXISTS idx_bot_users_project_token_active ON bot_users(project_id, token_id, is_active);

-- ─── Сообщения ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_messages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL DEFAULT 0,
  user_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message_text TEXT,
  message_data JSONB,
  node_id TEXT,
  primary_media_id INTEGER,
  telegram_message_id INTEGER,
  chat_type TEXT DEFAULT 'private',
  chat_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_messages_project_token ON bot_messages(project_id, token_id);
CREATE INDEX IF NOT EXISTS idx_bot_messages_project_token_user ON bot_messages(project_id, token_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bot_messages_user_project ON bot_messages(user_id, project_id, token_id);

-- ─── Медиафайлы ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  telegram_file_id TEXT,
  thumbnail_media_id INTEGER REFERENCES media_files(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (url, project_id)
);

CREATE TABLE IF NOT EXISTS bot_message_media (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES bot_messages(id) ON DELETE CASCADE,
  media_file_id INTEGER NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
  media_kind TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- FK для bot_messages.primary_media_id (после создания media_files)
ALTER TABLE bot_messages
  DROP CONSTRAINT IF EXISTS bot_messages_primary_media_id_media_files_id_fk;
ALTER TABLE bot_messages
  ADD CONSTRAINT bot_messages_primary_media_id_media_files_id_fk
  FOREIGN KEY (primary_media_id) REFERENCES media_files(id) ON DELETE SET NULL;

-- ─── Группы ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_groups (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  group_id TEXT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  member_count INTEGER,
  is_active INTEGER DEFAULT 1,
  description TEXT,
  settings JSONB DEFAULT '{}',
  avatar_url TEXT,
  chat_type TEXT DEFAULT 'group',
  invite_link TEXT,
  admin_rights JSONB DEFAULT '{"can_change_info":false,"can_manage_chat":false,"can_invite_users":false,"can_pin_messages":false,"can_delete_messages":false,"can_promote_members":false,"can_restrict_members":false,"can_manage_video_chats":false}',
  messages_count INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  last_activity TIMESTAMP,
  is_public INTEGER DEFAULT 0,
  language TEXT DEFAULT 'ru',
  timezone TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS bot_groups_project_group_uniq ON bot_groups(project_id, group_id) WHERE group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES bot_groups(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  status TEXT DEFAULT 'member',
  is_bot INTEGER DEFAULT 0,
  admin_rights JSONB DEFAULT '{}',
  custom_title TEXT,
  restrictions JSONB DEFAULT '{}',
  restricted_until TIMESTAMP,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Пользовательские таблицы (конструктор) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_tables (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_tables_project_id ON bot_tables(project_id);

CREATE TABLE IF NOT EXISTS bot_table_columns (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES bot_tables(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_bot_table_columns_table_id ON bot_table_columns(table_id);

CREATE TABLE IF NOT EXISTS bot_table_rows (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES bot_tables(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_bot_table_rows_table_id ON bot_table_rows(table_id);
CREATE INDEX IF NOT EXISTS idx_bot_table_rows_data ON bot_table_rows USING gin(data);

-- ─── Шаблоны ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bot_templates (
  id SERIAL PRIMARY KEY,
  owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  category TEXT DEFAULT 'custom',
  tags TEXT[],
  is_public INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'easy',
  author_id TEXT,
  author_name TEXT,
  use_count INTEGER NOT NULL DEFAULT 0,
  rating INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  version TEXT DEFAULT '1.0.0',
  preview_image TEXT,
  last_used_at TIMESTAMP,
  download_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  language TEXT DEFAULT 'ru',
  requires_token INTEGER NOT NULL DEFAULT 0,
  complexity INTEGER NOT NULL DEFAULT 1,
  estimated_time INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Рассылки ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broadcasts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  total_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  media_urls JSON NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_broadcasts_project_token ON broadcasts(project_id, token_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);

CREATE TABLE IF NOT EXISTS broadcast_results (
  id SERIAL PRIMARY KEY,
  broadcast_id INTEGER NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  telegram_message_id INTEGER,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broadcast_results_broadcast_id ON broadcast_results(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_results_status ON broadcast_results(broadcast_id, status);

-- ─── Расписания ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schedule_state (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  token_id INTEGER NOT NULL,
  node_id VARCHAR NOT NULL,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER NOT NULL DEFAULT 0,
  last_duration_ms INTEGER,
  last_error TEXT,
  last_status VARCHAR NOT NULL DEFAULT 'idle',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, token_id, node_id)
);
CREATE INDEX IF NOT EXISTS idx_schedule_state_project_token ON schedule_state(project_id, token_id);
CREATE INDEX IF NOT EXISTS idx_schedule_state_enabled ON schedule_state(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_schedule_state_status ON schedule_state(last_status);
