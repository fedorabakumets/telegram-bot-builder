# Шаблон `condition` — ветвление потока по переменной

## Что делает

Генерирует Python-функцию `handle_callback_<nodeId>` для каждого узла типа `condition`.
Функция читает значение переменной пользователя через `get_user_variable` и переходит
к нужному обработчику в зависимости от оператора ветки.

## Поддерживаемые операторы

| Оператор       | Условие Python                                     | Описание                              |
|----------------|----------------------------------------------------|---------------------------------------|
| `filled`       | `if val`                                           | Переменная заполнена (не пустая)      |
| `empty`        | `if not val`                                       | Переменная не заполнена (пустая)      |
| `equals`       | `if val == "значение"`                             | Переменная равна указанному значению  |
| `contains`     | `if "значение" in val`                             | Переменная содержит подстроку         |
| `greater_than` | `if _num_val is not None and _num_val > N`         | Переменная больше числа N             |
| `less_than`    | `if _num_val is not None and _num_val < N`         | Переменная меньше числа N             |
| `between`      | `if _num_val is not None and N1 <= _num_val <= N2` | Переменная в диапазоне [N1, N2]       |
| `else`         | `else:`                                            | Ветка по умолчанию (fallback)         |

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
