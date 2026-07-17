# Вкладка ИИ-агента в конструкторе — Roadmap

Документ фиксирует идею встроенного чата с ИИ внутри BotCraft: пользователь правит сценарий бота из браузера, без Cursor. Агент думает через LLM (DeepSeek / OpenRouter и т.п.), а **руки** — те же `lib/bot-tools`, что уже использует MCP.

Приоритет: 🔴 высокий → 🟡 средний → 🟢 низкий.

Связанные документы:

- [Видение: вкладка ИИ + MCP](../futures/features/ai-agent-tab-vision.md)
- [Live-редактирование через MCP](../futures/mcp/mcp-live-editing.md)
- [MCP botcraft-builder](../mcp/bot-builder.md)
- [MCP overview](../mcp/overview.md)

---

## Идея одной фразой

**Чат на вкладке «Агент» управляет ботом так же, как Cursor через MCP — но LLM вызывает tools на нашем сервере, а холст обновляется live.**

DeepSeek (или другая модель) **не дергает MCP**. MCP — отдельный вход для IDE. Вкладка ИИ — второй вход к тем же tools.

```
Cursor ──stdio──► MCP botcraft-builder ──► lib/bot-tools ──► PUT /api/projects/:id
Браузер ──HTTP──► server/agent + LLM API ──► lib/bot-tools ──► тот же PUT / live WS
```

---

## Уже реализовано ✅

### Слой инструментов (`lib/bot-tools/`)

- Introspection: `list_node_types`, `get_node_schema`, `list_operators`, `get_prompt_guide`…
- Валидация: `validate_bot_project`, `validate_node`
- Генерация: `generate_bot_code`
- Конструирование: `create_node`, `connect_nodes`, `apply_ops`…
- Live DB: `db_add_node`, `db_update_node`, `applyOpsInDb`, `updateProjectInDb` (`agentEdit: true`)

### Внешний MCP

- `tools/mcp-server` — stdio для Cursor / Claude Desktop
- Персональные токены агента: `/api/agent-tokens`
- Вкладка **«Агент»** сейчас = только UI токенов (`AgentTokensPanel`), **не чат**

### Live на холсте

- `PUT /api/projects/:id` с `agentEdit: true` → broadcast в `/api/canvas`
- Бейдж «ИИ-агент», версии с `author_kind='agent'`

---

## Как это работает (UX)

1. Пользователь открывает вкладку **«Агент»** → подтаб **«Чат»** (рядом «Токены MCP»).
2. Пишет: *«Сделай /start с приветствием и кнопкой Меню»*.
3. В чате стрим текста + карточки tool calls («Смотрю схему…», «Добавляю ноды…»).
4. На холсте появляются ноды (live), как при правках из Cursor.
5. Режим **«Предлагать»** (default): сначала plan/diff → **Применить / Отменить**.  
   Режим **«Сразу»**: применять как MCP сейчас.

Мелкие правки: *«Переименуй кнопку в Каталог»* → `db_update_node` → холст обновляется.

---

## Техническая схема

### Что шлёт браузер (новые API)

```http
POST /api/projects/:projectId/agent/sessions
POST /api/projects/:projectId/agent/sessions/:id/messages
```

Тело сообщения (примерно):

```json
{
  "message": "Сделай /start с приветствием и кнопкой Меню",
  "context": {
    "activeSheetId": "main",
    "selectedNodeId": null,
    "mode": "propose"
  }
}
```

Ответ — **SSE**: `text` / `tool_call` / `tool_result` / `proposal` / `done`.

Auth — сессия пользователя сайта (не `MCP_AGENT_TOKEN`).

### Что делает сервер

1. Собирает `messages` + список `tools` (OpenAI-compatible).
2. Зовёт LLM: DeepSeek напрямую или через [OpenRouter](https://openrouter.ai) (`baseURL` + `model` в env).
3. Модель отвечает текстом и/или `tool_calls`.
4. Сервер выполняет tools через `lib/bot-tools` (**in-process**, без петли localhost→localhost для вкладки).
5. Mutating ops → запись проекта + broadcast на холст (как `agentEdit`).

### Куда стучится LLM

| Провайдер | Заметки |
|-----------|---------|
| DeepSeek напрямую | Часто дешевле для одной модели |
| OpenRouter | Единый API, 400+ моделей, ~5.5% fee на кредиты, free-модели с лимитом |
| Gemini Flash / др. | Бюджетный fallback |

Ключ **только на сервере** (`AGENT_LLM_API_KEY` / `OPENROUTER_API_KEY`). Браузер к провайдеру не ходит.

### Важно про ответ модели

- Текст = общение с пользователем.
- `tool_calls` = команды «рукам» (схема, validate, apply_ops).
- Оба могут быть в одном ответе. Без tools модель бы только сочиняла JSON руками.

---

## Фазы реализации

### Фаза A — Бэкенд агента 🔴

- `server/agent/agent-runner.ts` — цикл LLM ↔ tools
- `server/agent/tool-registry.ts` — маппинг имён → `lib/bot-tools`
- Routes: sessions + messages (SSE)
- Стартовый набор tools:
  - read: `get_node_schema`, `list_operators`, `db_project_summary`, `db_list_nodes`, `validate_bot_project`, `get_prompt_guide`
  - write: `apply_ops` / `db_add_node`, `db_update_node`, `db_connect_nodes`, `db_auto_layout`
- Env: `AGENT_LLM_BASE_URL`, `AGENT_LLM_API_KEY`, `AGENT_LLM_MODEL`
- Контекст: summary проекта + activeSheet + selectedNode (не весь огромный JSON)

**Критерий:** curl/POST «добавь /start» → ноды в БД → холст обновляется.

### Фаза B — UI чата 🔴

- `AgentChatPanel`, `use-agent-chat`, карточки tool calls
- Вкладка «Агент» → табы **Чат | Токены MCP**
- (Опционально позже) боковая панель на «Редактор» рядом с холстом
- Стриминг текста, бейдж ИИ (уже есть)

**Критерий:** пользователь в браузере собирает мини-бота через чат.

### Фаза C — Превью и подтверждение 🟡

- Режим `propose`: mutating tools → proposal/diff → Apply/Cancel
- Переиспользовать staging / ChangesModal где уместно
- Опасные ops (удалить лист, массово) — всегда confirm

### Фаза D — Полировка 🟢

- Быстрые промпты: «Проверь сценарий», «Добавь /start», «Объясни ноду»
- Роутинг моделей: мелочь → дешёвая, сборка → сильнее
- Prompt caching system + bot-json-prompt
- Лимиты/биллинг на пользователя

---

## Что не делать

- ❌ Дублировать логику MCP отдельным слоем — только `lib/bot-tools`
- ❌ Писать `project.json` на клиенте в обход canvas-sync / версий
- ❌ Ключ LLM на фронте
- ❌ MCP Apps как замена вкладки (UI уже свой React)
- ❌ Путать: DeepSeek ≠ MCP; MCP ≠ вкладка чата

---

## Стоимость (ориентир)

- OpenRouter: pay-as-you-go, комиссия платформы ~5.5% на покупку кредитов; free-модели — лимит запросов/день. См. [openrouter.ai/pricing](https://openrouter.ai/pricing).
- DeepSeek через OpenRouter / напрямую — порядка центов за типовую задачу агента (много зависит от размера контекста и числа tool-раундов).
- Для MVP достаточно $5–10 кредитов или прямого DeepSeek ключа.

Детали бюджетов моделей — в [ai-agent-tab-vision.md](../futures/features/ai-agent-tab-vision.md).

---

## Приоритет первых итераций

1. 🔴 Фаза A — runner + 5–8 tools + SSE  
2. 🔴 Фаза B — чат на вкладке «Агент»  
3. 🟡 Фаза C — propose/confirm  
4. 🟢 Фаза D — промпты, роутинг, биллинг  

---

## Не дублировать

- Полное видение слоёв 1–6 и вкладки — [ai-agent-tab-vision.md](../futures/features/ai-agent-tab-vision.md)
- Live MCP → холст — [mcp-live-editing.md](../futures/mcp/mcp-live-editing.md)
- Список MCP-тулов и установка — [mcp/bot-builder.md](../mcp/bot-builder.md)

---

*Зафиксировано: 2026-07-17 — идея встроенного ИИ-чата поверх bot-tools + LLM (DeepSeek/OpenRouter), без вызова MCP из модели.*
