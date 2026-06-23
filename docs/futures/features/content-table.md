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
| Reply-кнопки | Горячая перезагрузка текста reply-кнопок (KeyboardButton). Редко меняются — "Отмена", "Назад" |
| Колонка format | Хранить formatMode в таблице для точного контроля parse_mode. Сейчас эвристика (проверка HTML-тегов) покрывает 99% случаев |

---

## Следующий этап: Гибридный подход

### Концепция

Бот остаётся сгенерированным Python-кодом (сохраняется экспорт в .py), но **весь контент** читается из БД через кэш. При изменении любого поля — мгновенная перезагрузка через Redis без рестарта.

### Что меняется

Вместо отдельной таблицы `_content` с маппингом — бот загружает **весь JSON сценария** из `bot_projects.data` в кэш и читает данные нод напрямую:

```python
_scenario_cache = {}

async def load_scenario(pool):
    """Загрузка JSON сценария в кэш"""
    row = await pool.fetchrow("SELECT data FROM bot_projects WHERE id = $1", PROJECT_ID)
    if row:
        _scenario_cache = json.loads(row["data"]) if isinstance(row["data"], str) else row["data"]

def get_node_data(node_id, field, fallback=""):
    """Получить поле ноды из кэша сценария"""
    for sheet in _scenario_cache.get("sheets", []):
        for node in sheet.get("nodes", []):
            if node["id"] == node_id:
                return node.get("data", {}).get(field, fallback)
    return fallback
```

### Что это даёт

| Поле | Горячая перезагрузка |
|------|:---:|
| messageText | ✅ |
| mediaCaption | ✅ |
| buttons[].text | ✅ |
| buttons[].url | ✅ |
| imageUrl/videoUrl/audioUrl/documentUrl | ✅ |
| httpRequestUrl/Body/Headers | ✅ |
| psql_query.query | ✅ |
| inputPrompt | ✅ |
| condition branches (value) | ✅ |
| formatMode | ✅ |

### Что НЕ меняется без рестарта

- Структура графа (добавление/удаление нод)
- Связи между нодами (autoTransitionTo, buttons[].target)
- Типы нод
- Имена переменных
- Регистрация обработчиков (декораторы @dp.callback_query)

### Преимущества гибрида

- Не нужна отдельная таблица `_content` для каждого поля — читаем прямо из JSON
- Один SQL запрос загружает ВСЁ
- Таблица `_content` остаётся как удобный UI для редактирования (но источник правды — JSON в `bot_projects.data`)
- Экспорт в standalone .py сохраняется
- Минимальные изменения в генераторе

### План реализации

1. В `content.py.jinja2` — добавить `load_scenario(pool)` рядом с `load_content`
2. Заменить `get_content(key, fallback)` на `get_node_data(node_id, field, fallback)` в шаблонах
3. Или оставить `get_content` как обёртку над `get_node_data`
4. Redis notify при сохранении проекта — уже работает (`bot:table_updated`)
5. Таблица `_content` становится **view** поверх JSON — удобный UI, но не источник данных для бота

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
