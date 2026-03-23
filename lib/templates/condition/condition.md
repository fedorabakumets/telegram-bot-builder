# Шаблон `condition` — ветвление потока по переменной

## Что делает

Генерирует Python-функцию `handle_callback_<nodeId>` для каждого узла типа `condition`.
Функция читает значение переменной пользователя через `get_user_variable` и переходит
к нужному обработчику в зависимости от оператора ветки.

## Поддерживаемые операторы

| Оператор   | Условие Python                  | Описание                              |
|------------|---------------------------------|---------------------------------------|
| `filled`   | `if val`                        | Переменная заполнена (не пустая)      |
| `empty`    | `if not val`                    | Переменная не заполнена (пустая)      |
| `equals`   | `if val == "значение"`          | Переменная равна указанному значению  |
| `contains` | `if "значение" in val`          | Переменная содержит подстроку         |
| `else`     | `else:`                         | Ветка по умолчанию (fallback)         |

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
