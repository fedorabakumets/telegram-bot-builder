# Catch-all обработчики (`CATCH_ALL_HANDLERS`)

Флаг `catchAllHandlers` (env `CATCH_ALL_HANDLERS`, значения `0`/`1`, по умолчанию `1`) управляет генерацией универсальных catch-all обработчиков `handle_unhandled_message`, `handle_unhandled_photo`, `fallback_callback_handler`.

Действует **предохранитель-автодетект**: при наличии `incoming_message_trigger`, `incoming_callback_trigger` или динамических кнопок catch-all генерируются **принудительно**, даже если флаг выключен — иначе в aiogram 3 middleware этих триггеров не срабатывает. Формула: `generateCatchAll = (catchAllHandlers !== 0) || есть incoming-триггеры/динамические кнопки`.
