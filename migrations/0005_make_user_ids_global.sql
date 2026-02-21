-- Migration: Make user_ids table global (shared across all projects)
-- Created: 2026-02-21
-- Description: Убирает привязку к проекту, делает базу пользователей общей

-- Удаляем существующее уникальное ограничение (если есть)
ALTER TABLE user_ids
DROP CONSTRAINT IF EXISTS user_ids_project_user_unique;

-- Удаляем дубликаты по user_id (оставляем самую новую запись)
DELETE FROM user_ids a USING user_ids b
WHERE a.id < b.id
  AND a.user_id = b.user_id;

-- Удаляем столбец project_id
ALTER TABLE user_ids
DROP COLUMN IF EXISTS project_id;

-- Добавляем уникальное ограничение на user_id
ALTER TABLE user_ids
ADD CONSTRAINT user_ids_user_unique UNIQUE (user_id);

-- Добавляем столбец source для отслеживания источника добавления
ALTER TABLE user_ids
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
