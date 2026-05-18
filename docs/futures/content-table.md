# Фича: Таблица контента (_content)

## Статус реализации

### ✅ Реализовано

| Компонент | Статус | Описание |
|-----------|--------|----------|
| Бэкенд: создание таблицы | ✅ | `ensureContentTable` — автосоздание при создании/сохранении проекта |
| Бэкенд: синхронизация JSON → таблица | ✅ | `syncContentToTable` — upsert при сохранении проекта |
| Бэкенд: синхронизация таблица → JSON | ✅ | `syncTableToScenario` — обратная запись при изменении строки |
| UI: отображение таблицы | ✅ | Иконка ✏️, "Контент (авто)", нельзя удалить |
| UI: фильтры по type/sheet | ✅ | Чипсы-кнопки в тулбаре |
| UI: read-only колонки | ✅ | key, type, sheet — не редактируемые |
| UI: textarea для value | ✅ | Многострочное редактирование с переносами |
| UI: toast при сохранении | ✅ | "✓ Сохранено" при обновлении ячейки |
| UI: индикатор в панели свойств | ✅ | "🔗 Синхронизировано с таблицей контента" |
| Генератор: шаблон content | ✅ | `load_content`, `get_content`, `_content_reload_loop` |
| Генератор: messageText | ✅ | `get_content("nodeId", fallback)` в message.py.jinja2 |
| Генератор: buttons[].text | ✅ | `get_content("nodeId.btn.btnId", fallback)` в keyboard.py.jinja2 |
| Генератор: parse_mode динамический | ✅ | Определяется из HTML-тегов в тексте |
| Генератор: вызов в main() | ✅ | `load_content(db_pool)` + `_content_reload_loop` при старте |
| Redis: мгновенное обновление | ✅ | `bot:table_updated:{projectId}` pub/sub |
| Redis: подписка в боте | ✅ | `_content_subscribe_redis()` — мгновенный reload |
| Инвалидация кэша клиента | ✅ | `invalidateQueries` при обновлении строки |
| Тесты: unit (content.test.ts) | ✅ | 15 тестов |
| Тесты: фазовый (test-phase30) | ✅ | 22 теста |

### 🔲 Не реализовано (горячая перезагрузка)

| Поле | Шаблон | Приоритет |
|------|--------|-----------|
| `mediaCaption` | message.py.jinja2 | Высокий |
| `buttons[].url` | keyboard.py.jinja2 | Высокий |
| `imageUrl`/`videoUrl`/`audioUrl`/`documentUrl` | message.py.jinja2 | Средний |
| `httpRequestUrl` | http-request.py.jinja2 | Средний |
| `httpRequestBody` | http-request.py.jinja2 | Низкий |
| `httpRequestHeaders` | http-request.py.jinja2 | Низкий |
| `psql_query.query` | psql-query.py.jinja2 | Низкий |
| `command_trigger.description` | main.py.jinja2 (set_bot_commands) | Не нужно — только при старте |

### 🔲 Не реализовано (UI/UX)

| Функция | Описание |
|---------|----------|
| WebSocket обновление редактора | При изменении в таблице — обновить ноду в реальном времени |
| Reply-кнопки | Горячая перезагрузка текста reply-кнопок |
| Колонка format | Хранить formatMode в таблице для точного контроля parse_mode |

---

## Концепция

Автоматическая таблица `_content` на уровне проекта — единый реестр всего редактируемого контента бота. Двусторонняя синхронизация с JSON сценария. Бот читает контент из таблицы (с кэшем) — горячая перезагрузка без рестарта.

## Архитектура

```
┌─────────────┐     PUT /projects/:id      ┌──────────────┐
│  Редактор   │ ──────────────────────────► │   Сервер     │
│  (клиент)   │                             │              │
└─────────────┘                             │ syncContent  │
                                            │ ToTable()    │
┌─────────────┐     PUT /tables/:id/rows    │              │
│  Таблица    │ ──────────────────────────► │ syncTable    │
│  _content   │                             │ ToScenario() │
└─────────────┘                             └──────┬───────┘
                                                   │
                                          Redis pub/sub
                                    bot:table_updated:{projectId}
                                                   │
                                            ┌──────▼───────┐
                                            │     Бот      │
                                            │ reload_content│
                                            │ get_content() │
                                            └──────────────┘
```

## Структура таблицы

| Колонка | Описание | Редактируемая |
|---------|----------|:---:|
| key | Уникальный ключ (`node_id[.тип.sub_id]`) | ❌ |
| type | Тип контента | ❌ |
| sheet | Имя листа (группировка) | ❌ |
| value | Значение (текст, URL) | ✅ |

## Маппинг полей

| Источник в ноде | type | Формат key |
|-----------------|------|------------|
| `messageText` | message | `{node_id}` |
| `mediaCaption` | caption | `{node_id}.caption` |
| `buttons[].text` | button | `{node_id}.btn.{btn_id}` |
| `buttons[].url` | url | `{node_id}.btn.{btn_id}.url` |
| `buttons[].webAppUrl` | url | `{node_id}.btn.{btn_id}.webapp` |
| `imageUrl`/`videoUrl`/`audioUrl`/`documentUrl` | media_url | `{node_id}.media` |
| `httpRequestUrl` | api_url | `{node_id}.api` |
| `httpRequestBody` | http_body | `{node_id}.body` |
| `httpRequestHeaders` | http_headers | `{node_id}.headers` |
| `psql_query.query` | sql | `{node_id}.sql` |
| `command_trigger.description` | command | `{node_id}.desc` |
| `inputPrompt` | prompt | `{node_id}.prompt` |

## Файлы реализации

### Сервер
- `server/services/content-table/create-content-table.ts` — создание таблицы
- `server/services/content-table/content-key-parser.ts` — маппинг нод ↔ ключи
- `server/services/content-table/sync-content-to-table.ts` — JSON → таблица
- `server/services/content-table/sync-table-to-scenario.ts` — таблица → JSON
- `server/services/content-table/index.ts` — barrel-экспорт

### Генератор
- `lib/templates/content/content.py.jinja2` — Python-шаблон
- `lib/templates/content/content.renderer.ts` — рендерер
- `lib/templates/content/content.params.ts` — параметры
- `lib/templates/content/content.schema.ts` — Zod-схема
- `lib/templates/content/content.test.ts` — unit-тесты
- `lib/tests/test-phase30-content.ts` — фазовый тест

### Клиент
- `client/components/editor/tables/components/content-table-filters.tsx` — фильтры
- `client/components/editor/properties/components/content-sync-badge.tsx` — индикатор

### Изменённые файлы
- `server/routes/projectRoutes/handlers/createProjectHandler.ts`
- `server/routes/projectRoutes/handlers/updateProjectHandler.ts`
- `server/routes/tables/handlers/updateRowHandler.ts`
- `client/components/editor/tables/components/table-list.tsx`
- `client/components/editor/tables/components/table-editor.tsx`
- `client/components/editor/tables/hooks/use-tables-state.ts`
- `client/components/editor/tables/hooks/use-tables-mutations.ts`
- `client/components/editor/tables/tables-panel.tsx`
- `lib/bot-generator.ts`
- `lib/templates/message/message.py.jinja2`
- `lib/templates/keyboard/keyboard.py.jinja2`
- `lib/templates/main/main.py.jinja2`
