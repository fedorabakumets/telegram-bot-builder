-- Migration: Изменение дефолтного уровня логирования на DEBUG
-- Created: 2026-05-15
-- Description: Меняет DEFAULT для log_level в bot_tokens с WARNING на DEBUG

ALTER TABLE bot_tokens ALTER COLUMN log_level SET DEFAULT 'DEBUG';
