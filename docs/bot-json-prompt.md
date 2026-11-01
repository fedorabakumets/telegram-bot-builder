# Документация Bot Builder для ИИ

Это короткий индекс. Подробные правила разделены по тематическим Markdown-файлам.
Полная прежняя версия сохранена в `docs/mcp/legacy/bot-json-prompt-source.md`.

## Основные правила

- [Формат project.json](mcp/rules/project-format.md)
- [Переменные и контекст](mcp/rules/variables.md)
- [Переходы](mcp/rules/transitions.md)
- [Команды](mcp/rules/commands.md)
- [Runtime-контекст](mcp/rules/runtime-context.md)
- [Безопасность](mcp/rules/security.md)
- [Отладка и логи](mcp/rules/debugging.md)

## Ноды

- [Input](mcp/nodes/input.md)
- [Code](mcp/nodes/code.md)
- [Message](mcp/nodes/message.md)
- [Keyboard](mcp/nodes/keyboard.md)
- [Condition](mcp/nodes/condition.md)
- [Set variable](mcp/nodes/set-variable.md)
- [Bot table](mcp/nodes/bot-table.md)

## Workflow

- [Калькулятор](mcp/workflows/calculator.md)
- [Создание ноды](mcp/workflows/create-node.md)
- [Изменение проекта](mcp/workflows/update-project.md)
- [Навигация кнопок](mcp/workflows/button-navigation.md)
- [Запуск и перезапуск](mcp/workflows/start-bot.md)
- [Диагностика](mcp/workflows/diagnose-logs.md)
- [Таблицы](mcp/workflows/tables.md)
- [Telethon Userbot](mcp/workflows/telethon-userbot.md)

## MCP-инструменты документации

- `get_node_docs(node_type)` — подробное руководство по ноде.
- `get_rule_docs(rule_name)` — тематические правила.
- `get_workflow_docs(task)` — рекомендуемый workflow.
- `search_docs(query)` — поиск по документации.
- `get_tool_docs(tool_name)` — технический контракт MCP-тулa.
# Секретные ссылки входа

Для `/start link_…` генератор скрывает код в логах, аналитике и истории сообщений. Проверяйте исходное сообщение в code-ноде; не сохраняйте и не выводите код.

### Метаданные исходящих фотографий

При включённой истории сообщений генератор сохраняет `photo.file_size` из ответа Telegram для `bot.send_photo`, `message.answer_photo` и `send_photo_with_caption`. Размер берётся у наибольшего варианта фото (`photo[-1]`) и записывается рядом с его `file_id`, шириной и высотой. Если Telegram не вернул размер, сохраняется `null`; значение нельзя выдумывать или заменять нулём. Новые настройки ноды не требуются. Изменение применяется к новым отправкам после повторной генерации и перезапуска бота; старые записи автоматически не дополняются.
<!-- Связь исходящих сообщений с блоком сценария. -->
При включённой истории сообщений генератор передаёт ID message-блока при отправке текста, фото, видео, аудио, документов и альбомов, включая Telegram file_id и повторную отправку из кэша. Каждый элемент альбома сохраняется отдельно с тем же `node_id`. Это позволяет определить блок отправки в истории файлов; старые сообщения без `node_id` автоматически не восстанавливаются. Эта связь отличается от поиска текущих использований URL файла в сценарии.
