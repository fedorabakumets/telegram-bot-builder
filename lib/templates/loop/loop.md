# Шаблон узла `loop`

Генерирует Python-обработчик цикла по массиву — итерирует по переменной-списку и вызывает тело цикла для каждого элемента.

## Параметры

| Параметр                    | Тип       | Описание                                        |
|-----------------------------|-----------|-------------------------------------------------|
| `nodeId`                    | `string`  | ID узла в графе бота                            |
| `safeName`                  | `string`  | Безопасное имя для Python функции               |
| `sourceVariable`            | `string`  | Имя переменной с массивом                       |
| `itemVariable`              | `string`  | Имя переменной для текущего элемента            |
| `indexVariable`             | `string`  | Имя переменной для индекса                      |
| `parallel`                  | `boolean` | Параллельное выполнение итераций                |
| `delaySeconds`              | `number`  | Задержка между итерациями (секунды)             |
| `maxIterations`             | `number`  | Максимум итераций (0 = без лимита)              |
| `autoTransitionTo`          | `string`  | ID ноды тела цикла                              |
| `autoTransitionToSafe`      | `string`  | Безопасное имя целевой ноды тела                |
| `autoTransitionTargetExists`| `boolean` | Существует ли целевая нода тела                 |
| `afterLoopTo`               | `string`  | ID ноды после цикла                             |
| `afterLoopToSafe`           | `string`  | Безопасное имя целевой ноды после цикла         |
| `afterLoopTargetExists`     | `boolean` | Существует ли целевая нода после цикла          |

## Пример входных данных

```typescript
const entry: LoopEntry = {
  nodeId: 'loop_users',
  safeName: 'loop_users',
  sourceVariable: 'users_list',
  itemVariable: 'current_user',
  indexVariable: 'i',
  parallel: false,
  delaySeconds: 1,
  maxIterations: 100,
  autoTransitionTo: 'msg_body',
  autoTransitionToSafe: 'msg_body',
  autoTransitionTargetExists: true,
  afterLoopTo: 'msg_done',
  afterLoopToSafe: 'msg_done',
  afterLoopTargetExists: true,
};
```

## Пример выходного Python-кода (последовательный цикл)

```python
@dp.callback_query(lambda c: c.data == "loop_users")
async def handle_callback_loop_users(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Цикл по массиву users_list."""
    user_id = callback_query.from_user.id
    await init_user_variables(user_id, callback_query.from_user)

    _all_vars = await init_all_user_vars(user_id)
    _items = _all_vars.get("users_list", [])
    if isinstance(_items, str):
        try:
            import json as _json
            _items = _json.loads(_items)
        except Exception:
            _items = []

    if not isinstance(_items, list):
        _items = []

    if len(_items) == 0:
        await handle_callback_msg_done(callback_query, state=state)
        return

    _max_iterations = 100
    _delay_seconds = 1
    _HARD_LIMIT = 10000

    for _i, _item in enumerate(_items):
        if _i >= _HARD_LIMIT:
            logging.warning(f"loop [loop_users]: достигнут лимит {_HARD_LIMIT} итераций")
            break
        if _max_iterations > 0 and _i >= _max_iterations:
            break

        await set_user_var(user_id, "current_user", _item)
        await set_user_var(user_id, "i", str(_i))

        if isinstance(_item, dict):
            for _k, _v in _item.items():
                await set_user_var(user_id, f"current_user.{_k}", str(_v) if _v is not None else "")

        await handle_callback_msg_body(callback_query, state=state)

        if _delay_seconds > 0 and _i < len(_items) - 1:
            await asyncio.sleep(_delay_seconds)

    await handle_callback_msg_done(callback_query, state=state)
```

## Использование API

```typescript
import { collectLoopEntries, generateLoopHandlers } from './loop';

// Генерация Python-кода для всех loop-узлов
const code = generateLoopHandlers(nodes);

// Только сбор параметров (без рендеринга)
const entries = collectLoopEntries(nodes);
```
