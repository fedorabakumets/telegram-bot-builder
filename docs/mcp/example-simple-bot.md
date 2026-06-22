# Пример: простой бот через MCP

Демонстрационный проект, собранный **инструментами MCP botcraft-builder**.

**Файл:** `bots/mcp-simple-bot/project.json`

---

## Логика бота

| Команда | Действие |
|---------|----------|
| `/start` | Приветствие |
| `/help` | Справка по командам |

## Граф

```
command_trigger (/start)  ──►  message (приветствие)
command_trigger (/help)   ──►  message (справка)
```

4 ноды, связи через `autoTransitionTo` на триггерах.

---

## Как воспроизвести через MCP

Пошагово (агент в Cursor):

1. `scaffold_minimal_project` — `sheet_name: "Простой бот MCP"`
2. `update_node` — текст на `start-message`
3. `create_node` — `command_trigger` `/help` и `message` со справкой
4. `add_node` — добавить обе ноды в проект
5. `connect_nodes` — `help-command-trigger` → `help-message`, `port_type: auto-transition`
6. `validate_bot_project` → `valid: true`
7. Сохранить JSON в `bots/<имя>/project.json`

Подробнее о тулах: [[mcp/bot-builder#Справочник инструментов (15 тулов)]].

---

## Фрагмент JSON (message — минимальный data)

```json
{
  "id": "start-message",
  "type": "message",
  "position": { "x": 400, "y": 300 },
  "data": {
    "messageText": "👋 Привет! Я простой бот, собранный через MCP.\n\nНажми /help для справки."
  }
}
```

Без лишних `keyboardType`, `buttons`, `markdown` — см. [[mcp/bot-builder#Минимальный JSON (minimize)]].

---

## Импорт в конструктор

```bash
npm run dev
```

Открой редактор → вкладка JSON → вставь содержимое `project.json` или импортируй файл.

---

## См. также

- [[mcp/overview]]
- [[mcp/bot-builder]]
