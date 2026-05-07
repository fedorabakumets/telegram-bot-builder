<!-- @fileoverview План реализации нового типа узла `psql_query` для BotCraft Studio.
     Описывает проблему, концепцию, сценарии использования, структуру JSON,
     этапы реализации, генерируемый Python-код и граничные случаи. -->

# Узел `psql_query` — прямой SQL-запрос к базе данных

## 1. Проблема

Сейчас в BotCraft работа с данными ограничена двумя способами:

| Способ | Ограничение |
|--------|-------------|
| `http_request` | Нужен внешний API-сервер даже для простых SELECT/UPDATE |
| `user_vars` / `set_variable` | Только per-user переменные, нет доступа к глобальным данным |

Это создаёт реальные проблемы:

**Пример 1 — статистика для админа.** Нужно показать `/stats` с количеством пользователей
по рефералам. Сейчас — только через внешний API, который нужно отдельно разрабатывать и деплоить.

**Пример 2 — проверка подписки/доступа.** Нужно проверить есть ли у пользователя активная
подписка в таблице `subscriptions`. Без SQL — невозможно без внешнего бэкенда.

**Пример 3 — счётчик подписок по рефералам.** В ветке `is_subscribed` нужно атомарно
инкрементировать глобальный счётчик по `referrer_id`. `set_variable` не подходит — это per-user.

**Пример 4 — динамические данные.** Нужно загрузить список товаров из таблицы `products`
для отображения в кнопках. Без SQL — только через HTTP к своему апишнику.

---

## 2. Концепция

Узел `psql_query` выполняет произвольный SQL-запрос к PostgreSQL-базе бота прямо в flow,
без внешних запросов. Поддерживает подстановку `{переменных}` в запрос, сохранение результата
в переменную и форматирование вывода.

### Как выглядит в UI редактора

```
┌─────────────────────────────────────────────┐
│  🗄️ SQL-запрос                              │
├─────────────────────────────────────────────┤
│  SQL:                                       │
│  ┌─────────────────────────────────────────┐│
│  │ SELECT referrer_id, COUNT(*) as cnt     ││
│  │ FROM bot_users                          ││
│  │ GROUP BY referrer_id                    ││
│  │ ORDER BY cnt DESC                       ││
│  └─────────────────────────────────────────┘│
│                                             │
│  Сохранить результат в: [stats_result    ]  │
│  Формат: [● JSON  ○ Текст  ○ Первая строка] │
│                                             │
│  Следующий узел: [msg-stats ▼]              │
└─────────────────────────────────────────────┘
```

Поддерживаемые форматы результата:
- `json` — массив объектов `[{"referrer_id": "ref_kor", "cnt": 312}, ...]`
- `text` — форматированная строка для вставки в сообщение
- `first_row` — только первая строка результата (для `SELECT ... WHERE user_id = {user_id}`)
- `affected` — количество затронутых строк (для `UPDATE`/`INSERT`/`DELETE`)

---

## 3. Сценарии использования

### 3.1 Статистика по рефералам для админа

```json
{
  "id": "sql-stats",
  "type": "psql_query",
  "data": {
    "query": "SELECT COALESCE(referrer_id, '(прямой вход)') as src, COUNT(*) as cnt FROM bot_users GROUP BY referrer_id ORDER BY cnt DESC",
    "saveResultTo": "stats_rows",
    "resultFormat": "text",
    "textTemplate": "{src} — {cnt} чел.",
    "autoTransitionTo": "msg-stats"
  }
}
```

Генерируемый Python:
```python
rows = await pool.fetch("SELECT COALESCE(referrer_id, '(прямой вход)') as src, COUNT(*) as cnt FROM bot_users GROUP BY referrer_id ORDER BY cnt DESC")
user_data[user_id]["stats_rows"] = "\n".join(f"{r['src']} — {r['cnt']} чел." for r in rows)
```

### 3.2 Фиксация факта подписки (счётчик по рефералам)

```json
{
  "id": "sql-mark-subscribed",
  "type": "psql_query",
  "data": {
    "query": "UPDATE bot_users SET subscribed_at = NOW() WHERE user_id = {user_id} AND subscribed_at IS NULL",
    "saveResultTo": "",
    "resultFormat": "affected",
    "autoTransitionTo": "msg-final"
  }
}
```

### 3.3 Проверка активной подписки пользователя

```json
{
  "id": "sql-check-access",
  "type": "psql_query",
  "data": {
    "query": "SELECT COUNT(*) as has_access FROM subscriptions WHERE user_id = {user_id} AND expires_at > NOW()",
    "saveResultTo": "has_access",
    "resultFormat": "first_row",
    "autoTransitionTo": "check-access-condition"
  }
}
```

Затем в `condition`: `{has_access}` equals `1` → пустить / заблокировать.

### 3.4 Загрузка профиля пользователя

```json
{
  "id": "sql-load-profile",
  "type": "psql_query",
  "data": {
    "query": "SELECT plan, expires_at, bonus_points FROM subscriptions WHERE user_id = {user_id}",
    "saveResultTo": "profile",
    "resultFormat": "first_row",
    "autoTransitionTo": "msg-profile"
  }
}
```

После выполнения `{profile.plan}`, `{profile.expires_at}` доступны в шаблонах сообщений.

### 3.5 Лидерборд / рейтинг

```json
{
  "id": "sql-leaderboard",
  "type": "psql_query",
  "data": {
    "query": "SELECT username, score FROM game_scores ORDER BY score DESC LIMIT 10",
    "saveResultTo": "leaderboard",
    "resultFormat": "text",
    "textTemplate": "{username} — {score} очков",
    "autoTransitionTo": "msg-leaderboard"
  }
}
```

### 3.6 Инкремент счётчика

```json
{
  "id": "sql-increment",
  "type": "psql_query",
  "data": {
    "query": "INSERT INTO referral_stats (ref_id, subscribed_count) VALUES ('{referrer_id}', 1) ON CONFLICT (ref_id) DO UPDATE SET subscribed_count = referral_stats.subscribed_count + 1",
    "saveResultTo": "",
    "resultFormat": "affected",
    "autoTransitionTo": "msg-final"
  }
}
```

---

## 4. Структура узла в `project.json`

```json
{
  "id": "sql-stats",
  "type": "psql_query",
  "position": { "x": 400, "y": 200 },
  "data": {
    "query": "SELECT COUNT(*) as total FROM bot_users",
    "saveResultTo": "total_users",
    "resultFormat": "first_row",
    "textTemplate": "",
    "autoTransitionTo": "msg-stats",
    "enableAutoTransition": true
  }
}
```

### Схема полей `data`

| Поле | Тип | Обязательное | Описание |
|------|-----|:---:|---------|
| `query` | `string` | ✅ | SQL-запрос, поддерживает `{переменные}` |
| `saveResultTo` | `string` | ❌ | Имя переменной для сохранения результата |
| `resultFormat` | `string` | ✅ | `json` / `text` / `first_row` / `affected` |
| `textTemplate` | `string` | ❌ | Шаблон строки для формата `text` (напр. `{name} — {value}`) |
| `autoTransitionTo` | `string` | ❌ | ID следующего узла |
| `enableAutoTransition` | `boolean` | ❌ | Включить автопереход |

---

## 5. Этапы реализации

### 5.1 Схема узла (`shared/schema/tables/node-schema.ts`)

- [ ] Добавить `'psql_query'` в `z.enum([...])` поля `type`
- [ ] Добавить поля `query`, `saveResultTo`, `resultFormat`, `textTemplate`

```typescript
/** SQL-запрос для узла psql_query */
query: z.string().default(''),
/** Переменная для сохранения результата */
saveResultTo: z.string().default(''),
/** Формат результата */
resultFormat: z.enum(['json', 'text', 'first_row', 'affected']).default('first_row'),
/** Шаблон строки для формата text */
textTemplate: z.string().default(''),
```

### 5.2 UI компонент в редакторе свойств

- [ ] Создать `client/components/editor/properties/components/configuration/psql-query-configuration.tsx`
- [ ] Textarea для SQL с подсветкой `{переменных}`
- [ ] Select для `resultFormat`
- [ ] Input для `saveResultTo` и `textTemplate`
- [ ] Зарегистрировать в `properties-panel.tsx`
- [ ] Добавить иконку и метку в сайдбар

### 5.3 Шаблон генератора Python (`lib/templates/psql-query/`)

- [ ] `psql-query.schema.ts` — Zod-схема
- [ ] `psql-query.params.ts` — интерфейсы
- [ ] `psql-query.py.jinja2` — Jinja2-шаблон
- [ ] `psql-query.renderer.ts` — рендерер
- [ ] `psql-query.fixture.ts` — фикстуры
- [ ] `psql-query.test.ts` — тесты
- [ ] `index.ts` — экспорт

### 5.4 Регистрация в генераторе

- [ ] Импорт и `case 'psql_query':` в `node-handlers.dispatcher.ts`
- [ ] Убедиться что `pool` доступен в контексте (требует `userDatabaseEnabled: true`)

### 5.5 Документация

- [ ] Добавить раздел `### psql_query` в `docs/bot-json-prompt.md`

---

## 6. Генерируемый Python-код

### Шаблон `psql-query.py.jinja2`

```jinja2
{# Шаблон узла psql_query — прямой SQL-запрос к PostgreSQL #}
{%- set safe_node_id = nodeId | safe_name -%}

@dp.callback_query(lambda c: c.data == "{{ nodeId }}")
async def handle_callback_{{ safe_node_id }}(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Узел psql_query: выполняет SQL-запрос к базе данных."""
    try:
        user_id = callback_query.from_user.id
        _all_vars = await init_all_user_vars(user_id)
        # Подставляем переменные в запрос
        _query = replace_variables_in_text({{ query | tojson }}, _all_vars)
        logging.info(f"🗄️ psql_query {{ nodeId }}: выполняем запрос для {user_id}")
        {% if resultFormat == 'affected' %}
        _result = await pool.execute(_query)
        {% elif resultFormat == 'first_row' %}
        _row = await pool.fetchrow(_query)
        _result = dict(_row) if _row else {}
        {% else %}
        _rows = await pool.fetch(_query)
        _result = [dict(r) for r in _rows]
        {% endif %}
        {% if saveResultTo %}
        {% if resultFormat == 'text' %}
        _lines = []
        for _r in _result:
            _line = replace_variables_in_text({{ textTemplate | tojson }}, _r)
            _lines.append(_line)
        user_data[user_id]["{{ saveResultTo }}"] = "\n".join(_lines)
        {% else %}
        user_data[user_id]["{{ saveResultTo }}"] = _result
        {% endif %}
        await set_user_var(user_id, "{{ saveResultTo }}", user_data[user_id]["{{ saveResultTo }}"])
        {% endif %}
        logging.info(f"✅ psql_query {{ nodeId }}: выполнено для {user_id}")
        {% if autoTransitionTo %}
        {%- set safe_target = autoTransitionTo | safe_name %}
        class FakeCallback:
            def __init__(self, data, user, msg):
                self.data = data; self.from_user = user; self.message = msg; self._is_fake = True
            async def answer(self, *a, **kw): pass
        fake_cb = FakeCallback("{{ autoTransitionTo }}", callback_query.from_user, callback_query.message)
        await handle_callback_{{ safe_target }}(fake_cb, state=state)
        {% endif %}
    except Exception as e:
        logging.error(f"❌ Ошибка в psql_query {{ nodeId }}: {e}")
```

---

## 7. Граничные случаи

### 7.1 `pool` недоступен (userDatabaseEnabled: false)

Если база данных отключена — узел генерирует предупреждение в логе и пропускает запрос:
```python
if pool is None:
    logging.warning("psql_query: pool недоступен, userDatabaseEnabled=false")
    return
```

### 7.2 Пустой результат SELECT

`first_row` → `{}`, `text` → пустая строка, `json` → `[]`. Не выбрасывает исключение.

### 7.3 Подстановка переменных в SQL

`{user_id}` в запросе заменяется через `replace_variables_in_text` — та же функция что в `set_variable`.
Для безопасности числовые значения кастуются через `int()` при подстановке в WHERE.

### 7.4 Ошибка SQL

Попадает в `except Exception` → `logging.error`. Бот не падает, переход не выполняется.

### 7.5 Большой результат

Для `text`-формата с тысячами строк — результат обрезается до 4096 символов (лимит Telegram).

---

## 8. Ссылки на файлы для изменений

| Файл | Что изменить |
|------|-------------|
| `shared/schema/tables/node-schema.ts` | Добавить `psql_query` в enum, поля `query`, `saveResultTo`, `resultFormat`, `textTemplate` |
| `lib/templates/psql-query/` | Создать новую директорию шаблона |
| `lib/templates/node-handlers/node-handlers.dispatcher.ts` | Добавить `case 'psql_query'` |
| `docs/bot-json-prompt.md` | Добавить описание узла |
| `client/components/editor/properties/` | Создать `psql-query-configuration.tsx` |
| `client/components/editor/sidebar/` | Добавить узел в палитру |

---

## Статус

🔲 Не реализовано — план готов, ожидает реализации
