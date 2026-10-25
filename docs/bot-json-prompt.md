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
