-- Migration: Add unique constraint to user_ids table
-- Created: 2026-02-20
-- Description: Добавляет уникальное ограничение на комбинацию project_id и user_id

-- Сначала удалим дубликаты если они есть
DELETE FROM user_ids a USING user_ids b
WHERE a.id < b.id 
  AND a.project_id = b.project_id 
  AND a.user_id = b.user_id;

-- Добавляем уникальное ограничение
ALTER TABLE user_ids 
ADD CONSTRAINT user_ids_project_user_unique 
UNIQUE (project_id, user_id);
