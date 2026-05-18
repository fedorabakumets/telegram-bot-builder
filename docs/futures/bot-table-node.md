# Узел `bot_table` — работа с внутренними таблицами конструктора

## 1. Проблема

Сейчас для хранения пользовательских данных (профили, баланс, репутация, отношения) нужно использовать `psql_query` и писать SQL вручную. Это:

- Требует знания SQL
- Пугает новичков
- Не связано с UI-таблицами конструктора (вкладка "Таблицы")
- Нет атомарных операций (increment/decrement) через визуальный интерфейс

При этом в конструкторе уже есть **Bot Tables** — встроенные таблицы с UI-редактором (spreadsheet), API для CRUD, и механизм чтения через `{table.имя.колонка}`. Но **записи** из flow-узлов в эти таблицы по произвольному условию — нет.

---

## 2. Концепция

Отдельный узел `bot_table` — визуальный интерфейс для операций с внутренними таблицами конструктора. Без SQL, с dropdown'ами таблиц и колонок из API.

Аналог: [n8n Data Table node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/) — один узел с выбором операции (read/insert/update/upsert/delete).

### Принципы

- Один узел = одна операция с таблицей
- Dropdown таблиц и колонок из существующего API (`tables-api.ts`)
- WHERE по произвольным колонкам (не только user_id)
- Атомарные операции (increment/decrement на уровне SQL)
- Инвалидация кеша `_bot_tables_cache` после записи
- Результат доступен через `{переменная.колонка}`

---

## 3. Операции

| Операция | Описание | SQL-аналог |
|----------|----------|-----------|
| `read` | Получить строку(и) по условию | `SELECT ... WHERE ...` |
| `insert` | Вставить новую строку | `INSERT INTO ...` |
| `update` | Обновить поля по условию | `UPDATE ... SET ... WHERE ...` |
| `upsert` | Вставить или обновить | `INSERT ... ON CONFLICT DO UPDATE` |
| `delete` | Удалить строку по условию | `DELETE FROM ... WHERE ...` |

---

## 4. Структура узла в project.json

### 4.1 Read (чтение)

```json
{
  "id": "tbl-get-profile",
  "type": "bot_table",
  "position": { "x": 300, "y": 0 },
  "data": {
    "tableName": "profiles",
    "operation": "read",
    "where": [
      { "column": "telegram_id", "value": "{user_id}" }
    ],
    "saveResultTo": "profile",
    "resultFormat": "first_row",
    "autoTransitionTo": "msg-show-profile",
    "enableAutoTransition": true
  }
}
```

`resultFormat`:
- `"first_row"` — первая строка как объект (доступ: `{profile.balance}`)
- `"all_rows"` — массив строк (для loop)
- `"scalar"` — одно значение первой колонки первой строки
- `"count"` — количество найденных строк

### 4.2 Insert (вставка)

```json
{
  "id": "tbl-create-profile",
  "type": "bot_table",
  "position": { "x": 300, "y": 200 },
  "data": {
    "tableName": "profiles",
    "operation": "insert",
    "row": {
      "telegram_id": "{user_id}",
      "balance": "100",
      "reputation": "100",
      "bio": "",
      "username": "{username}"
    },
    "autoTransitionTo": "msg-welcome",
    "enableAutoTransition": true
  }
}
```

### 4.3 Update (обновление)

```json
{
  "id": "tbl-add-rep",
  "type": "bot_table",
  "position": { "x": 300, "y": 400 },
  "data": {
    "tableName": "profiles",
    "operation": "update",
    "where": [
      { "column": "telegram_id", "value": "{reply_to_user_id}" }
    ],
    "updates": [
      { "column": "reputation", "op": "increment", "value": "10" },
      { "column": "last_rep_at", "op": "set", "value": "{__now__}" }
    ],
    "saveResultTo": "updated",
    "returnColumns": ["reputation"],
    "autoTransitionTo": "msg-rep-done",
    "enableAutoTransition": true
  }
}
```

Операции `op`:
- `"set"` — установить значение
- `"increment"` — прибавить (SQL: `col = col + N`)
- `"decrement"` — вычесть (SQL: `col = col - N`)
- `"min"` — установить если меньше текущего (SQL: `col = LEAST(col, N)`)
- `"max"` — установить если больше текущего (SQL: `col = GREATEST(col, N)`)

### 4.4 Upsert (создать или обновить)

```json
{
  "id": "tbl-ensure-profile",
  "type": "bot_table",
  "position": { "x": 300, "y": 0 },
  "data": {
    "tableName": "profiles",
    "operation": "upsert",
    "key": "telegram_id",
    "row": {
      "telegram_id": "{user_id}",
      "balance": "100",
      "reputation": "100",
      "bio": ""
    },
    "onConflict": "ignore",
    "saveResultTo": "profile",
    "autoTransitionTo": "next-node",
    "enableAutoTransition": true
  }
}
```

`onConflict`:
- `"ignore"` — не трогать существующую строку
- `"update"` — перезаписать все поля
- `"merge"` — обновить только пустые поля

### 4.5 Delete (удаление)

```json
{
  "id": "tbl-delete-relation",
  "type": "bot_table",
  "position": { "x": 300, "y": 600 },
  "data": {
    "tableName": "relationships",
    "operation": "delete",
    "where": [
      { "column": "user_a", "value": "{user_id}" },
      { "column": "user_b", "value": "{target_user_id}" }
    ],
    "autoTransitionTo": "msg-deleted",
    "enableAutoTransition": true
  }
}
```

---

## 5. UI панели свойств

### 5.1 Общая структура

```
┌─────────────────────────────────────────────┐
│  🗄️ Таблица                                 │
├─────────────────────────────────────────────┤
│  Таблица        [profiles         ▼]        │
│  Операция       [Обновить         ▼]        │
│                                             │
│  ─── Секция зависит от операции ────────── │
│                                             │
│  ─── Результат (для read/update/upsert) ── │
│  Сохранить в    [profile          ]         │
│                                             │
│  ─── Переход ───────────────────────────── │
│  ☑ Автопереход  [next-node        ▼]        │
└─────────────────────────────────────────────┘
```

### 5.2 Секция WHERE (для read, update, delete)

```
│  ─── Условие ───────────────────────────── │
│  Колонка          Значение                  │
│  [telegram_id ▼]  [{reply_to_user_id}    ]  │
│  [+ Добавить условие]                       │
```

Dropdown колонок подтягивается из API при выборе таблицы.

### 5.3 Секция Updates (для update)

```
│  ─── Изменения ─────────────────────────── │
│  Колонка       Операция    Значение         │
│  [reputation▼] [  +   ▼]  [10           ]  │
│  [balance   ▼] [  −   ▼]  [5            ]  │
│  [+ Добавить поле]                          │
```

Dropdown операций: `=`, `+`, `−`, `min`, `max`

### 5.4 Секция Row (для insert, upsert)

```
│  ─── Данные строки ─────────────────────── │
│  Колонка          Значение                  │
│  [telegram_id ▼]  [{user_id}             ]  │
│  [balance     ▼]  [100                   ]  │
│  [reputation  ▼]  [100                   ]  │
│  [+ Добавить поле]                          │
```

### 5.5 Отображение на холсте

```
┌───────────────────────────┐
│  🗄️ profiles              │
│  Обновить: reputation +10 │
└───────────────────────────┘
```

Формат: иконка + имя таблицы + операция + краткое описание.

---

## 6. Взаимодействие с другими узлами

### Входящие (кто вызывает bot_table)

| Узел | Пример |
|------|--------|
| `command_trigger` | `/profile` → read профиль |
| `text_trigger` | "+реп" → update репутация |
| `callback_trigger` | Кнопка "Купить" → update баланс |
| `schedule_trigger` | 00:00 → update сброс репутации |
| `condition` | Если баланс ≥ 100 → update списание |
| `set_variable` | Подготовка данных → insert |
| `loop` | Для каждого элемента → upsert |
| `bot_table` | Прочитали → обновили |

### Исходящие (кто получает результат)

| Узел | Пример |
|------|--------|
| `message` | Показать `{profile.balance}` |
| `condition` | Проверить `{profile.reputation} > 80` |
| `set_variable` | Вычислить на основе данных |
| `loop` | Итерировать по массиву строк |
| `bot_table` | Цепочка операций |

---

## 7. Сценарии использования

### 7.1 Профиль пользователя

```
/profile → bot_table(upsert: создать если нет) → bot_table(read) → message(показать)
```

### 7.2 +реп / -реп через реплай

```
"+реп" → condition(есть reply?) 
  → bot_table(read: кулдаун инициатора)
  → condition(прошло 12ч?)
  → bot_table(update: reputation +10, target)
  → bot_table(update: last_rep_at, инициатор)
  → message("Репутация обновлена")
```

### 7.3 Магазин

```
Кнопка "Купить +10 реп" 
  → bot_table(read: баланс)
  → condition(balance ≥ 50?)
  → bot_table(update: balance -50, reputation +10)
  → message("Куплено!")
```

### 7.4 Ежедневный сброс репутации

```
schedule(00:00 МСК) → bot_table(update: SET reputation=50 WHERE reputation<50)
```

### 7.5 Отношения между пользователями

```
"обнять" 
  → bot_table(upsert: пара user_a + user_b, score=0)
  → bot_table(read: текущий score пары)
  → condition(actions_today < 3?)
  → bot_table(update: score +5)
  → bot_table(update: balance +5 инициатору)
  → message("Вы обняли @{reply_to_username}")
```

---

## 8. Примеры (20+ сценариев)

### Формат записи цепочек

```
триггер → узел → узел → ... → message
```

---

### 8.1 Регистрация при /start

```
/start → bot_table(upsert: profiles, telegram_id={user_id}, balance=100, reputation=100) → message("Добро пожаловать!")
```

### 8.2 Просмотр своего профиля

```
/profile → bot_table(read: profiles WHERE telegram_id={user_id}) → message("Баланс: {me.balance} 🍪\nРепутация: {me.reputation}")
```

### 8.3 Просмотр чужого профиля через реплай

```
/profile (реплай) → bot_table(read: profiles WHERE telegram_id={reply_to_user_id}) → message("Профиль @{target.username}: {target.reputation} реп")
```

### 8.4 Установить возраст

```
/setage → saveAnswer(inputVariable=user_input) → bot_table(update: profiles SET age={user_input} WHERE telegram_id={user_id}) → message("Возраст сохранён")
```

### 8.5 Установить био

```
/setbio → saveAnswer(inputVariable=user_input) → bot_table(update: profiles SET bio={user_input} WHERE telegram_id={user_id}) → message("Био обновлено")
```

### 8.6 +реп через реплай

```
"+реп" → condition(reply_to_user_id не пустой?) → bot_table(read: cooldowns WHERE action_key={user_id}_rep) → condition(прошло 5 мин?) → bot_table(update: profiles SET reputation+10 WHERE telegram_id={reply_to_user_id}) → bot_table(upsert: cooldowns, last_used_at={__now__}) → message("✅ Репутация @{reply_to_username}: {rep_result.reputation}")
```

### 8.7 -реп через реплай

```
"-реп" → condition(reply_to_user_id не пустой?) → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(reputation ≥ 50?) → bot_table(update: profiles SET reputation-10 WHERE telegram_id={reply_to_user_id}) → message("⬇️ Репутация @{reply_to_username}: {rep_result.reputation}")
```

### 8.8 Ежедневный сброс репутации

```
schedule(daily 00:00 МСК) → bot_table(update: profiles SET reputation=50 WHERE reputation < 50)
```

### 8.9 Магазин — показать товары

```
/shop → message("🛒 Магазин:\n1. Сброс лимитов — 100🍪\n2. +10 реп — 50🍪\n3. Префикс — 200🍪", buttons=[btn1, btn2, btn3])
```

### 8.10 Покупка +10 репутации за 50🍪

```
Кнопка "Купить +10 реп" → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(balance ≥ 50?) → bot_table(update: profiles SET balance-50, reputation+10 WHERE telegram_id={user_id}) → message("✅ Куплено! Баланс: {after.balance}🍪")
                                                                                   → else: message("❌ Недостаточно 🍪")
```

### 8.11 Покупка сброса лимитов за 100🍪

```
Кнопка "Сброс лимитов" → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(balance ≥ 100?) → bot_table(update: profiles SET balance-100 WHERE telegram_id={user_id}) → bot_table(update: relationships SET actions_today=0 WHERE user_a={user_id}) → message("✅ Лимиты сброшены!")
                                                                                  → else: message("❌ Нужно 100🍪")
```

### 8.12 Покупка кастомного префикса за 200🍪

```
Кнопка "Префикс" → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(balance ≥ 200?) → message("Введите префикс (до 10 символов):") → saveAnswer(inputVariable=prefix_input) → bot_table(update: profiles SET balance-200, prefix={prefix_input} WHERE telegram_id={user_id}) → message("✅ Префикс установлен: {prefix_input}")
```

### 8.13 Обнять (позитивное взаимодействие)

```
"обнять" (реплай) → condition(reply есть?) → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(reputation ≥ 80?) → bot_table(upsert: relationships, pair_id={user_id}_{reply_to_user_id}, score=0) → bot_table(read: relationships WHERE pair_id={user_id}_{reply_to_user_id}) → condition(actions_today < 3?) → bot_table(update: relationships SET score+5, actions_today+1 WHERE pair_id=...) → bot_table(update: profiles SET balance+5 WHERE telegram_id={user_id}) → message("🤗 Вы обняли @{reply_to_username}! Отношения: {rel.score}")
                                                                                                      → else (реп < 80): message("❌ Нужна репутация ≥ 80")
                                                                                                      → else (лимит): message("⏳ Лимит исчерпан (3/3)")
```

### 8.14 Пнуть (негативное взаимодействие)

```
"пнуть" (реплай) → condition(reply есть?) → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(reputation ≥ 80?) → bot_table(upsert: relationships, pair_id=...) → bot_table(read: relationships WHERE pair_id=...) → condition(actions_today < 3?) → bot_table(update: relationships SET score-5, actions_today+1 WHERE pair_id=...) → bot_table(update: profiles SET balance+5 WHERE telegram_id={user_id}) → message("👊 Вы пнули @{reply_to_username}! Отношения: {rel.score}")
```

### 8.15 Назначить ранг (только HeadAdmin)

```
/setrank (реплай) → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(rank == "headadmin"?) → saveAnswer(inputVariable=new_rank) → bot_table(update: profiles SET rank={new_rank} WHERE telegram_id={reply_to_user_id}) → message("✅ @{reply_to_username} теперь {new_rank}")
                                                                            → else: message("❌ Только HeadAdmin может назначать ранги")
```

### 8.16 Мут пользователя (Admin+)

```
/mute (реплай) → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(rank in [admin, headadmin]?) → mute_user(reply_to_user_id) → bot_table(insert: action_log, action=mute, target={reply_to_user_id}) → message("🔇 @{reply_to_username} замучен")
```

### 8.17 Автосообщения — настройка (/autoset)

```
/autoset → condition(is_admin?) → saveAnswer(inputVariable=auto_text) → bot_table(upsert: settings, key=auto_message_{chat_id}, message_text={auto_text}) → message("✅ Автосообщение сохранено")
```

### 8.18 Автосообщения — отправка по таймеру

```
schedule(interval 10 мин) → bot_table(read: settings WHERE setting_key=auto_message_{chat_id}) → condition(enabled == true?) → message("{auto_cfg.message_text}")
```

### 8.19 Топ-10 по репутации

```
/top → bot_table(read: profiles, all_rows, orderBy=reputation desc, limit=10) → loop(all_users, item=user) → set_variable(json_push: formatted, "{index+1}. {user.username} — {user.reputation} реп") → message("🏆 Топ репутации:\n{formatted}")
```

### 8.20 Статистика бота (/stats)

```
/stats → bot_table(read: profiles, count) → message("👥 Всего пользователей: {users_count}")
```

### 8.21 Проверка отношений (/relations)

```
/relations (реплай) → bot_table(read: relationships WHERE pair_id={user_id}_{reply_to_user_id}) → condition(найдено?) → message("💕 Отношения с @{reply_to_username}: {rel.score}/100")
                                                                                                  → else: message("Вы ещё не взаимодействовали с @{reply_to_username}")
```

### 8.22 Ежедневный сброс лимитов взаимодействий

```
schedule(daily 00:00 МСК) → bot_table(update: relationships SET actions_today=0 WHERE actions_today > 0)
```

### 8.23 Логирование всех действий

```
(после любого действия) → bot_table(insert: action_log, user_id={user_id}, target_id={reply_to_user_id}, action=..., timestamp={__now__}, chat_id={chat_id})
```

### 8.24 Перевод 🍪 другому пользователю

```
/give 50 (реплай) → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(balance ≥ 50?) → bot_table(update: profiles SET balance-50 WHERE telegram_id={user_id}) → bot_table(update: profiles SET balance+50 WHERE telegram_id={reply_to_user_id}) → message("✅ Переведено 50🍪 → @{reply_to_username}")
                                                                             → else: message("❌ Недостаточно 🍪")
```

### 8.25 Ежедневный бонус (/daily)

```
/daily → bot_table(read: cooldowns WHERE action_key={user_id}_daily) → condition(прошло 24ч?) → bot_table(update: profiles SET balance+25 WHERE telegram_id={user_id}) → bot_table(upsert: cooldowns, action_key={user_id}_daily, last_used_at={__now__}) → message("✅ +25🍪! Баланс: {profile.balance}")
                                                                      → else: message("⏳ Бонус доступен через {hours_left}ч")
```

### 8.26 Бан пользователя (HeadAdmin)

```
/ban (реплай) → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(rank == headadmin?) → ban_user(reply_to_user_id) → bot_table(update: profiles SET rank=banned WHERE telegram_id={reply_to_user_id}) → bot_table(insert: action_log, action=ban) → message("🚫 @{reply_to_username} забанен")
```

### 8.27 Разбан пользователя

```
/unban (реплай) → bot_table(read: profiles WHERE telegram_id={user_id}) → condition(rank == headadmin?) → unban_user(reply_to_user_id) → bot_table(update: profiles SET rank=user WHERE telegram_id={reply_to_user_id}) → message("✅ @{reply_to_username} разбанен")
```

```json
{
  "id": "tbl-register",
  "type": "bot_table",
  "position": { "x": 300, "y": 0 },
  "data": {
    "tableName": "profiles",
    "operation": "upsert",
    "key": "telegram_id",
    "row": {
      "telegram_id": "{user_id}",
      "username": "{username}",
      "first_name": "{first_name}",
      "balance": "100",
      "reputation": "100",
      "bio": "",
      "rank": "user",
      "registered_at": "{__now__}"
    },
    "onConflict": "ignore",
    "saveResultTo": "profile",
    "autoTransitionTo": "msg-welcome",
    "enableAutoTransition": true
  }
}
```



---

## 9. Дополнительные поля (расширение WHERE)

Для сценариев типа "ежедневный сброс" и "топ-10" нужны расширенные условия:

### WHERE с оператором

```json
{
  "where": [
    { "column": "reputation", "value": "50", "operator": "less_than" },
    { "column": "enabled", "value": "true", "operator": "equals" }
  ]
}
```

Операторы WHERE:
- `"equals"` (по умолчанию) — точное совпадение
- `"not_equals"` — не равно
- `"greater_than"` — больше
- `"less_than"` — меньше
- `"contains"` — содержит подстроку
- `"is_empty"` — пустое значение
- `"is_not_empty"` — не пустое

### Сортировка и лимит (для read)

```json
{
  "orderBy": "reputation",
  "orderDirection": "desc",
  "limit": 10
}
```

---

## 10. Генерируемый Python-код

### 8.1 Read

```python
async def handle_bot_table_tbl_get_profile(callback_query, state=None):
    user_id = callback_query.from_user.id
    if user_id not in user_data:
        user_data[user_id] = {}
    
    _vars = await init_all_user_vars(user_id)
    _where_telegram_id = replace_variables_in_text("{user_id}", _vars)
    
    if db_pool:
        async with db_pool.acquire() as conn:
            # Находим таблицу и колонки
            _tbl = await conn.fetchrow(
                "SELECT id FROM bot_tables WHERE project_id = $1 AND name = $2",
                PROJECT_ID, "profiles"
            )
            if _tbl:
                _rows = await conn.fetch("""
                    SELECT btr.data, btr.row_index
                    FROM bot_table_rows btr
                    WHERE btr.table_id = $1
                    ORDER BY btr.row_index
                """, _tbl["id"])
                
                # Фильтруем по WHERE
                _cols = await conn.fetch(
                    "SELECT id, name FROM bot_table_columns WHERE table_id = $1",
                    _tbl["id"]
                )
                _col_map = {str(c["id"]): c["name"] for c in _cols}
                _name_to_id = {c["name"]: str(c["id"]) for c in _cols}
                
                _result = None
                for _row in _rows:
                    _data = _row["data"] if isinstance(_row["data"], dict) else json.loads(_row["data"])
                    _named = {_col_map.get(k, k): v for k, v in _data.items()}
                    if str(_named.get("telegram_id", "")) == str(_where_telegram_id):
                        _result = _named
                        break
                
                if _result:
                    for _k, _v in _result.items():
                        user_data[user_id][f"profile.{_k}"] = str(_v) if _v else ""
    
    # Автопереход
    await handle_callback_msg_show_profile(...)
```

### 8.2 Update с increment

```python
async def handle_bot_table_tbl_add_rep(callback_query, state=None):
    user_id = callback_query.from_user.id
    _vars = await init_all_user_vars(user_id)
    _where_val = replace_variables_in_text("{reply_to_user_id}", _vars)
    
    if db_pool:
        async with db_pool.acquire() as conn:
            _tbl = await conn.fetchrow(
                "SELECT id FROM bot_tables WHERE project_id = $1 AND name = $2",
                PROJECT_ID, "profiles"
            )
            if _tbl:
                _cols = await conn.fetch(
                    "SELECT id, name FROM bot_table_columns WHERE table_id = $1", _tbl["id"]
                )
                _name_to_id = {c["name"]: str(c["id"]) for c in _cols}
                
                # Находим строку по WHERE
                _rows = await conn.fetch(
                    "SELECT id, data FROM bot_table_rows WHERE table_id = $1", _tbl["id"]
                )
                for _row in _rows:
                    _data = _row["data"] if isinstance(_row["data"], dict) else json.loads(_row["data"])
                    _tid_col = _name_to_id.get("telegram_id")
                    if str(_data.get(_tid_col, "")) == str(_where_val):
                        # Increment reputation
                        _rep_col = _name_to_id.get("reputation")
                        _old_val = int(_data.get(_rep_col, 0) or 0)
                        _data[_rep_col] = str(_old_val + 10)
                        
                        # Сохраняем
                        await conn.execute(
                            "UPDATE bot_table_rows SET data = $1 WHERE id = $2",
                            json.dumps(_data), _row["id"]
                        )
                        
                        # Результат в переменную
                        user_data[user_id]["updated.reputation"] = _data[_rep_col]
                        break
        
        # Инвалидация кеша
        global _bot_tables_cache
        _bot_tables_cache = None
    
    await handle_callback_msg_rep_done(...)
```

---

## 9. Системные переменные

Узел добавляет поддержку специальной переменной:
- `{__now__}` — текущий timestamp (ISO 8601) для записи времени действия

---

## 10. Этапы реализации

### Этап 1 — Схема и типы

- [ ] Добавить `'bot_table'` в enum типов узлов (`shared/schema/tables/node-schema.ts`)
- [ ] Описать поля data: `tableName`, `operation`, `where`, `updates`, `row`, `key`, `onConflict`, `saveResultTo`, `resultFormat`, `returnColumns`

### Этап 2 — Sidebar (палитра)

- [ ] Создать `client/components/editor/sidebar/massive/bot-table/bot-table.ts`
- [ ] Создать `client/components/editor/sidebar/massive/bot-table/index.ts`
- [ ] Добавить в `constants.ts` (категория "Интеграции")
- [ ] Зарегистрировать в `client/components/editor/shared/node-registry.ts`

### Этап 3 — UI панель свойств

- [ ] Создать компонент панели свойств `BotTableProperties.tsx`
- [ ] Подкомпоненты: `WhereConditions.tsx`, `UpdateFields.tsx`, `RowFields.tsx`
- [ ] Подключить API таблиц для dropdown'ов (таблицы, колонки)
- [ ] Зарегистрировать в маппинге тип → панель свойств

### Этап 4 — Генератор (Jinja2 шаблон)

- [ ] Создать `lib/templates/bot-table/bot-table.py.jinja2`
- [ ] Создать `lib/templates/bot-table/bot-table.schema.ts`
- [ ] Создать `lib/templates/bot-table/bot-table.renderer.ts`
- [ ] Создать `lib/templates/bot-table/bot-table.params.ts`
- [ ] Создать `lib/templates/bot-table/index.ts`
- [ ] Подключить в `lib/templates/node-handlers/node-handlers.dispatcher.ts`
- [ ] Инвалидация `_bot_tables_cache = None` после write-операций

### Этап 5 — Тесты и документация

- [ ] Создать `lib/tests/test-phase{N}-bot-table.ts`
- [ ] Обновить `docs/bot-json-prompt.md` — добавить описание узла
- [ ] Обновить промт — примеры с bot_table

---

## 11. Ограничения и edge-cases

| Ситуация | Поведение |
|----------|-----------|
| Таблица не существует | Логировать ошибку, не падать, пропустить узел |
| WHERE не нашёл строк (read) | `saveResultTo` = пустой объект, переменные не устанавливаются |
| WHERE не нашёл строк (update) | Ничего не обновлять, логировать warning |
| Increment на пустом поле | Считать как 0 + N |
| Несколько строк подходят под WHERE | Для read: вернуть первую (first_row) или все (all_rows). Для update: обновить все подходящие |
| Конкурентный доступ (race condition) | Для малых групп (< 500 юзеров) — допустимо. Для больших — рекомендовать `psql_query` |
| Кеш после записи | Инвалидировать `_bot_tables_cache = None` сразу после любой write-операции |

---

## 12. Где смотреть в коде

| Что | Где |
|-----|-----|
| API таблиц (клиент) | `client/components/editor/tables/api/tables-api.ts` |
| Типы таблиц | `client/components/editor/tables/types.ts` |
| Загрузка таблиц в рантайм | `lib/templates/utils/utils.py.jinja2` (строка ~151) |
| Макрос save-to-table | `lib/templates/database/save-to-table.py.jinja2` |
| Схема узлов | `shared/schema/tables/node-schema.ts` |
| Палитра узлов | `client/components/editor/sidebar/constants.ts` |
| Реестр узлов | `client/components/editor/shared/node-registry.ts` |
| Диспетчер генератора | `lib/templates/node-handlers/node-handlers.dispatcher.ts` |
| Аналог (psql_query) | `lib/templates/psql-query/` |
