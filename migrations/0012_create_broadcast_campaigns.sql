-- @fileoverview Кампании рассылок («большая рассылка») по нескольким ботам проекта
--
-- Таблица broadcast_campaigns — родительская запись кампании.
-- Каждый выбранный бот получает дочернюю запись в broadcasts со ссылкой campaign_id.
-- Агрегаты (total/sent/delivered/failed) пересчитываются из дочерних рассылок.

CREATE TABLE IF NOT EXISTS broadcast_campaigns (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message_text TEXT NOT NULL,
  media_urls JSON DEFAULT '[]',
  buttons JSON DEFAULT '[]',
  buttons_per_row INTEGER DEFAULT 0,
  filters JSONB NOT NULL DEFAULT '{}',
  token_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  total_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS broadcast_campaigns_project_idx
  ON broadcast_campaigns (project_id, created_at DESC);

-- Связь дочерних рассылок с кампанией (NULL — одиночная рассылка)
ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES broadcast_campaigns(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS broadcasts_campaign_idx ON broadcasts (campaign_id);
