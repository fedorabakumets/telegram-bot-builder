/**
 * @fileoverview Добавляет монотонную ревизию проекта для атомарной защиты записи.
 */
ALTER TABLE bot_projects ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
