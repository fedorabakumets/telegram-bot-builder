-- Добавление флага живого обновления контента в bot_tokens
-- 1 = генерировать машинерию live-reload (load_content/reload_content/_content_reload_loop/_content_subscribe_redis)
-- 0 = не генерировать машинерию (аксессор get_content и кэш _content_cache остаются, контент берётся из вшитых fallback-текстов)
-- Default 1 — существующие боты сохраняют прежнее поведение
ALTER TABLE bot_tokens ADD COLUMN IF NOT EXISTS content_cache INTEGER DEFAULT 1;
