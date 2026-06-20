-- Добавление флага генерации catch-all обработчиков в bot_tokens
-- 1 = генерировать handle_unhandled_message/handle_unhandled_photo/fallback_callback_handler
-- 0 = не генерировать (при наличии incoming-триггеров/динамических кнопок генератор включает их принудительно)
-- Default 1 — существующие боты сохраняют прежнее поведение
ALTER TABLE bot_tokens ADD COLUMN IF NOT EXISTS catch_all_handlers INTEGER DEFAULT 1;
