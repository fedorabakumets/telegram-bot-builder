-- @fileoverview Миграция: добавление поля media_urls в таблицу broadcasts
-- Позволяет прикреплять медиафайлы к рассылке (фото, видео, аудио, документы, Telegram file_id)
-- Created: 2026-05-10

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS media_urls JSON NOT NULL DEFAULT '[]';
