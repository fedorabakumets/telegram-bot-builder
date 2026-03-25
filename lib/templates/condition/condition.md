# Шаблон `condition` — ветвление потока по переменной

## Что делает

Генерирует Python-функцию `handle_callback_<nodeId>` для каждого валидного узла типа `condition`.
Для обычных веток функция читает значение переменной пользователя через
`init_all_user_vars(...)` и `_all_vars.get(...)`, после чего переходит
к нужному обработчику в зависимости от оператора ветки.

## Поддерживаемые операторы

| Оператор       | Условие Python                                                        | Описание                              |
|----------------|-----------------------------------------------------------------------|---------------------------------------|
| `filled`       | `if val`                                                              | Переменная заполнена (не пустая)      |
| `empty`        | `if not val`                                                          | Переменная не заполнена (пустая)      |
| `equals`       | `if val == "значение"`                                                | Переменная равна указанному значению  |
| `contains`     | `if "значение" in val`                                                | Переменная содержит подстроку         |
| `greater_than` | `if _num_val is not None and _num_val > N`                            | Переменная больше числа N             |
| `less_than`    | `if _num_val is not None and _num_val < N`                            | Переменная меньше числа N             |
| `between`      | `if _num_val is not None and N1 <= _num_val <= N2`                    | Переменная в диапазоне [N1, N2]       |
| `is_private`   | `if callback_query.message.chat.type == 'private'`                   | Приватный чат                         |
| `is_group`     | `if callback_query.message.chat.type in ('group', 'supergroup')`     | Групповой чат (включая супергруппы)   |
| `is_channel`   | `if callback_query.message.chat.type == 'channel'`                   | Канал                                 |
| `is_admin`     | `if callback_query.from_user.id in ADMIN_IDS`                        | Пользователь — администратор бота     |
| `is_premium`   | `if getattr(callback_query.from_user, 'is_premium', False)`          | Пользователь — Telegram Premium       |
| `is_bot`       | `if getattr(callback_query.from_user, 'is_bot', False)`              | Пользователь — бот                    |
| `is_subscribed` | `if await _is_user_subscribed("@channel")`                          | Пользователь подписан на канал/чат    |
| `is_not_subscribed` | `if not await _is_user_subscribed("@channel")`                 | Пользователь не подписан              |
| `else`         | `else:`                                                               | Ветка по умолчанию (fallback)         |

## Системные операторы

Операторы `is_private`, `is_group`, `is_channel`, `is_admin`, `is_premium`, `is_bot`, `is_subscribed`, `is_not_subscribed` — **системные**: они проверяют свойства пользователя, тип чата или статус подписки напрямую из контекста callback, без чтения пользовательской переменной.

### Операторы типа чата

| Оператор     | Проверяет                                      |
|--------------|------------------------------------------------|
| `is_private` | `chat.type == 'private'`                       |
| `is_group`   | `chat.type in ('group', 'supergroup')`         |
| `is_channel` | `chat.type == 'channel'`                       |

### Операторы флагов пользователя

| Оператор     | Проверяет                                                        |
|--------------|------------------------------------------------------------------|
| `is_admin`   | `callback_query.from_user.id in ADMIN_IDS`                       |
| `is_premium` | `getattr(callback_query.from_user, 'is_premium', False)`         |
| `is_bot`     | `getattr(callback_query.from_user, 'is_bot', False)`             |

`is_admin` использует список `ADMIN_IDS`, который задаётся при инициализации бота.  
`is_premium` и `is_bot` используют `getattr` с дефолтом `False` — Telegram не всегда передаёт эти поля.

### Особенности

- **Не требуют переменной**: если все ветки узла являются системными (плюс `else`), поле "Переменная" в редакторе скрывается автоматически.
- **Не используют `_all_vars`**: код не вызывает `init_all_user_vars` и не читает переменные из базы данных.
- **Порядок генерации**: системные ветки идут первыми (проход 0), затем числовые (проход 1), строковые (проход 2), `else` (проход 3).
- **Невалидные узлы пропускаются**: если у узла нет веток, либо есть строковые/числовые ветки без непустой `variable`, обработчик не генерируется.

### Пример — только системные ветки (тип чата)

```python
async def handle_callback_condition_check_chat(callback_query):
    # Узел условия condition_check_chat
    user_id = callback_query.from_user.id
    logging.info(f"Узел условия condition_check_chat: проверка типа чата")
    if callback_query.message.chat.type == 'private':
        # Ветка: is_private
        await handle_callback_msg_private(callback_query)
    elif callback_query.message.chat.type in ('group', 'supergroup'):
        # Ветка: is_group
        await handle_callback_msg_group(callback_query)
    else:
        # Ветка по умолчанию
        await handle_callback_msg_other(callback_query)
```

### Пример — флаги пользователя (is_admin, is_premium, is_bot)

```python
async def handle_callback_condition_check_user(callback_query):
    # Узел условия condition_check_user
    user_id = callback_query.from_user.id
    logging.info(f"Узел условия condition_check_user: проверка типа чата")
    if callback_query.from_user.id in ADMIN_IDS:
        # Ветка: is_admin
        await handle_callback_msg_admin(callback_query)
    elif getattr(callback_query.from_user, 'is_premium', False):
        # Ветка: is_premium
        await handle_callback_msg_premium(callback_query)
    elif getattr(callback_query.from_user, 'is_bot', False):
        # Ветка: is_bot
        await handle_callback_msg_bot(callback_query)
    else:
        # Ветка по умолчанию
        await handle_callback_msg_other(callback_query)
```

### Пример — смешанный узел (системные + переменная)

```python
async def handle_callback_condition_mixed(callback_query):
    # Узел условия condition_mixed, переменная: user_role
    user_id = callback_query.from_user.id
    _all_vars = await init_all_user_vars(user_id)
    val = _all_vars.get("user_role", "")
    logging.info(f"Узел условия condition_mixed: переменная 'user_role' = {val}")
    if callback_query.message.chat.type == 'private':
        # Ветка: is_private
        await handle_callback_msg_private(callback_query)
    elif val == "admin":
        # Ветка: equals == "admin"
        await handle_callback_msg_admin(callback_query)
    else:
        # Ветка по умолчанию
        await handle_callback_msg_other(callback_query)
```

### Поведение поля "Переменная" в редакторе

- Если **все** ветки (кроме `else`) являются системными — поле "Переменная" скрывается.
- Если есть хотя бы одна не-системная ветка — поле "Переменная" отображается.

## Пример входных данных

```ts
const params: ConditionTemplateParams = {
  entries: [
    {
      nodeId: 'condition_check_role',
      variable: 'user_role',
      branches: [
        { id: 'b1', operator: 'equals',   value: 'admin',  target: 'msg_admin' },
        { id: 'b2', operator: 'contains', value: 'mod',    target: 'msg_mod'   },
        { id: 'b3', operator: 'else',     value: '',       target: 'msg_user'  },
      ],
    },
  ],
};
```

## Пример выходного Python-кода

```python
async def handle_callback_condition_check_role(callback_query):
    # Узел условия condition_check_role, переменная: user_role
    user_id = callback_query.from_user.id
    _all_vars = await init_all_user_vars(user_id)
    val = _all_vars.get("user_role", "")
    logging.info(f"Узел условия condition_check_role: переменная 'user_role' = {val}")

    if val == "admin":
        # Ветка: equals == "admin"
        await handle_callback_msg_admin(callback_query)
    elif "mod" in val:
        # Ветка: contains == "mod"
        await handle_callback_msg_mod(callback_query)
    else:
        # Ветка по умолчанию
        await handle_callback_msg_user(callback_query)
```

## API модуля

- `collectConditionEntries(nodes)` — собирает `ConditionEntry[]` из массива узлов графа
- `generateConditionHandlers(nodes | params)` — генерирует Python-код (перегруженная функция)
- `conditionParamsSchema` — Zod-схема для валидации параметров

## Числовые операторы

Для операторов `greater_than`, `less_than`, `between` генерируется блок вычисления `_num_val` один раз в начале функции:

```python
try:
    _num_val = float(val)
except (ValueError, TypeError):
    _num_val = None
```

Если значение переменной не является числом — `_num_val` будет `None` и числовые ветки не сработают.

### Пример с числовыми операторами

```python
async def handle_callback_condition_check_age(callback_query):
    user_id = callback_query.from_user.id
    _all_vars = await init_all_user_vars(user_id)
    val = _all_vars.get("user_age", "")
    logging.info(f"Узел условия condition_check_age: переменная 'user_age' = {val}")
    try:
        _num_val = float(val)
    except (ValueError, TypeError):
        _num_val = None
    if _num_val is not None and _num_val > 18:
        await handle_callback_msg_adult(callback_query)
    elif _num_val is not None and 18 <= _num_val <= 65:
        await handle_callback_msg_working(callback_query)
    else:
        await handle_callback_msg_other(callback_query)
```
