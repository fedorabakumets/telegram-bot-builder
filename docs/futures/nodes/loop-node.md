<!-- @fileoverview Концепция узла `loop` для BotCraft Studio.
     Цикл по массиву — выполнить цепочку нод для каждого элемента. -->

# Узел `loop` — цикл по массиву

## Статус

🔲 Не реализовано — концепция, ожидает реализации

---

## 1. Проблема

Сейчас для обработки нескольких однотипных элементов (обменников, товаров, пользователей)
нужно создавать **отдельную цепочку нод для каждого элемента вручную**.

| Сценарий | Сейчас | С loop |
|----------|--------|--------|
| 4 обменника × 1 пара | 16 нод (4 fetch + 4 set + ...) | 3 ноды (loop + fetch + set) |
| 4 обменника × 8 пар | 53 ноды | 5 нод |
| 1000 обменников × 1000 пар | невозможно | 7 нод |
| Рассылка 100 пользователям | 100 message-нод | 2 ноды (loop + message) |
| Удаление старых записей | ручной SQL на каждую | loop + table_delete |

**Реальная проблема:** добавить новый обменник = перегенерация всего проекта.
С loop — добавить строку в таблицу, ноды не трогаешь.

---

## 2. Концепция

Узел `loop` берёт массив из переменной и выполняет цепочку нод **для каждого элемента**.
На каждой итерации выставляет текущий элемент и его индекс как переменные,
доступные внутри тела цикла через `{item}` и `{item.field}`.

### Аналоги

| Платформа | Реализация |
|-----------|-----------|
| n8n | Loop Over Items (SplitInBatches) — два выхода: Loop / Done |
| Salebot | Цикл по массиву — встроенный блок |
| Make (Integromat) | Iterator — разбивает массив на элементы |
| Python | `for item in array:` |

### Ключевые свойства

- **Два выхода**: тело цикла (`autoTransitionTo`) и после цикла (`afterLoopTo`)
- **Совместимость**: любая существующая нода работает внутри loop без изменений
- **Вложенность**: поддержка loop внутри loop (обменники × пары)
- **Переменные**: `{item}`, `{item.field}`, `{index}` доступны внутри тела

---

## 3. Как выглядит в UI

### На холсте (canvas)

```
┌─────────────────────────────────┐
│ 🔄 Цикл                         │
│                                 │
│ Источник: exchangers_list       │
│ Элемент:  exchanger             │
│ Индекс:   i                    │
│                                 │
│  ● Тело ────→ [http_request] → [json_extract] → [table_set]
│                                 │
│  ● Далее ───→ [message "Готово"]│
└─────────────────────────────────┘
```

Два выхода (Handle/порта):
- **↻ Тело** — цепочка, выполняемая для каждого элемента
- **→ Далее** — куда идти после завершения всех итераций

### Панель настроек (правая сайдбар)

```
┌─────────────────────────────────────┐
│ 🔄 Цикл (Loop)                      │
├─────────────────────────────────────┤
│                                     │
│ Переменная-источник *:              │
│ ┌───────────────────────────────┐   │
│ │ exchangers_list            ▼  │   │
│ └───────────────────────────────┘   │
│ ℹ️ Массив для итерации              │
│                                     │
│ Имя элемента *:                     │
│ ┌───────────────────────────────┐   │
│ │ exchanger                     │   │
│ └───────────────────────────────┘   │
│ ℹ️ Доступно как {exchanger} и       │
│    {exchanger.name}, {exchanger.url}│
│                                     │
│ Имя индекса:                        │
│ ┌───────────────────────────────┐   │
│ │ i                             │   │
│ └───────────────────────────────┘   │
│ ℹ️ Номер итерации (0, 1, 2...)      │
│                                     │
│ ─── Дополнительно ───               │
│                                     │
│ ☐ Параллельное выполнение           │
│   (asyncio.gather вместо for)       │
│                                     │
│ Задержка между итерациями (сек):    │
│ ┌───────────────────────────────┐   │
│ │ 0                             │   │
│ └───────────────────────────────┘   │
│ ℹ️ Anti-flood: пауза между шагами   │
│                                     │
│ Максимум итераций:                  │
│ ┌───────────────────────────────┐   │
│ │ 0 (без лимита)               │   │
│ └───────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Структура узла в `project.json`

```json
{
  "id": "loop-exchangers",
  "type": "loop",
  "position": { "x": 800, "y": 400 },
  "data": {
    "sourceVariable": "exchangers_list",
    "itemVariable": "exchanger",
    "indexVariable": "i",
    "parallel": false,
    "delaySeconds": 0,
    "maxIterations": 0,
    "autoTransitionTo": "fetch-rate",
    "afterLoopTo": "msg-results",
    "enableAutoTransition": true
  }
}
```

### Схема полей `data`

| Поле | Тип | Обязательное | По умолчанию | Описание |
|------|-----|:---:|:---:|---------|
| `sourceVariable` | `string` | ✅ | — | Имя переменной с массивом |
| `itemVariable` | `string` | ✅ | `"item"` | Имя переменной для текущего элемента |
| `indexVariable` | `string` | ❌ | `"index"` | Имя переменной для индекса итерации |
| `parallel` | `boolean` | ❌ | `false` | Параллельное выполнение (asyncio.gather) |
| `delaySeconds` | `number` | ❌ | `0` | Пауза между итерациями в секундах |
| `maxIterations` | `number` | ❌ | `0` | Максимум итераций (0 = без лимита) |
| `autoTransitionTo` | `string` | ✅ | — | ID первой ноды тела цикла |
| `afterLoopTo` | `string` | ❌ | — | ID ноды после завершения цикла |
| `enableAutoTransition` | `boolean` | ✅ | `true` | Включить автопереход в тело |

---

## 5. Сценарии использования

### 5.1 Мониторинг обменников (основной кейс)

```
table_get (exchangers, enabled=true) → exchangers_list
  → loop (exchangers_list, item=exchanger)
      → http_request (GET {exchanger.url}) → api_response
        → json_extract (exchange.{pair.from_id}.to.{exchanger.to_id}) → current_rate
          → table_set (rates, upsert: exchanger_id={exchanger.id}, rate={current_rate})
  (после loop)
  → message "✅ Курсы обновлены"
```

### 5.2 Вложенный loop — обменники × пары

```
table_get (pairs, enabled=true) → pairs_list
  → loop (pairs_list, item=pair)
      → table_get (exchangers, enabled=true) → exchangers_list
        → loop (exchangers_list, item=exchanger)
            → http_request (GET {exchanger.url})
              → json_extract (exchange.{pair.from_id}.to.{exchanger.to_id})
                → table_set (rates, upsert: pair_id={pair.id}, exchanger_id={exchanger.id})
      (после внутреннего loop)
  (после внешнего loop)
  → message "✅ Все курсы обновлены"
```

### 5.3 Рассылка подписчикам

```
table_get (subscribers, active=true) → subscribers_list
  → loop (subscribers_list, item=subscriber, delaySeconds=0.1)
      → message (chat_id={subscriber.user_id}, "📢 {broadcast_text}")
  (после loop)
  → message (admin, "✅ Рассылка завершена: {i} сообщений")
```

### 5.4 Формирование текста из массива

```
http_request (GET /api/products) → products
  → set_variable (result_text = "📋 Товары:\n")
    → loop (products, item=product)
        → set_variable (result_text += "{index+1}. {product.name} — {product.price} руб.\n")
    (после loop)
    → message "{result_text}"
```

### 5.5 Удаление устаревших записей

```
table_get (rates, updated_at < {threshold}) → old_rates
  → loop (old_rates, item=old_rate)
      → table_delete (rates, id={old_rate.id})
  (после loop)
  → message "🗑 Удалено {i} устаревших записей"
```

### 5.6 Параллельные HTTP-запросы (parallel: true)

```
table_get (exchangers) → exchangers_list
  → loop (exchangers_list, item=exchanger, parallel=true)
      → http_request (GET {exchanger.url}) → api_response
        → table_set (rates, upsert)
  (после loop)
  → message "✅ Готово за 2 сек вместо 30"
```

---

## 6. Генерируемый Python-код

### 6.1 Последовательный loop (parallel=false)

```python
# Обработчик цикла: loop-exchangers
@dp.callback_query(lambda c: c.data == "loop-exchangers")
async def handle_callback_loop_exchangers(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Цикл по массиву exchangers_list."""
    user_id = callback_query.from_user.id
    await init_user_variables(user_id, callback_query.from_user)

    try:
        await callback_query.answer()
    except Exception:
        pass

    _all_vars = await init_all_user_vars(user_id)
    if state is not None:
        try:
            _fsm_data = await state.get_data()
            if _fsm_data:
                _all_vars.update(_fsm_data)
        except Exception:
            pass

    # Получаем массив из переменной
    _items = _all_vars.get("exchangers_list", [])
    if isinstance(_items, str):
        try:
            import json as _json
            _items = _json.loads(_items)
        except Exception:
            _items = []

    if not isinstance(_items, list):
        _items = []

    _max_iterations = 0  # 0 = без лимита
    _delay_seconds = 0

    for _i, _item in enumerate(_items):
        if _max_iterations > 0 and _i >= _max_iterations:
            break

        # Выставляем текущий элемент как переменную
        await set_user_var(user_id, "exchanger", _item)
        await set_user_var(user_id, "i", str(_i))

        # Разворачиваем поля словаря как плоские переменные
        if isinstance(_item, dict):
            for _k, _v in _item.items():
                await set_user_var(user_id, f"exchanger.{_k}", str(_v) if _v is not None else "")

        # Вызываем тело цикла
        await handle_callback_fetch_rate(callback_query, state=state)

        # Задержка между итерациями (anti-flood)
        if _delay_seconds > 0 and _i < len(_items) - 1:
            await asyncio.sleep(_delay_seconds)

    # После цикла — переход к следующей ноде
    await handle_callback_msg_results(callback_query, state=state)
```

### 6.2 Параллельный loop (parallel=true)

```python
# Обработчик цикла: loop-exchangers (параллельный)
@dp.callback_query(lambda c: c.data == "loop-exchangers")
async def handle_callback_loop_exchangers(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Цикл по массиву exchangers_list (параллельное выполнение)."""
    user_id = callback_query.from_user.id
    await init_user_variables(user_id, callback_query.from_user)

    try:
        await callback_query.answer()
    except Exception:
        pass

    _all_vars = await init_all_user_vars(user_id)
    if state is not None:
        try:
            _fsm_data = await state.get_data()
            if _fsm_data:
                _all_vars.update(_fsm_data)
        except Exception:
            pass

    _items = _all_vars.get("exchangers_list", [])
    if isinstance(_items, str):
        try:
            import json as _json
            _items = _json.loads(_items)
        except Exception:
            _items = []

    if not isinstance(_items, list):
        _items = []

    async def _loop_iteration(_i, _item):
        await set_user_var(user_id, "exchanger", _item)
        await set_user_var(user_id, "i", str(_i))
        if isinstance(_item, dict):
            for _k, _v in _item.items():
                await set_user_var(user_id, f"exchanger.{_k}", str(_v) if _v is not None else "")
        await handle_callback_fetch_rate(callback_query, state=state)

    await asyncio.gather(*[
        _loop_iteration(_i, _item)
        for _i, _item in enumerate(_items)
    ])

    # После цикла
    await handle_callback_msg_results(callback_query, state=state)
```

---

## 7. Совместимость с существующими нодами

Loop вызывает `await handle_callback_xxx()` — стандартный callback-обработчик.
**Любая нода**, которая использует `replace_variables_in_text()` для подстановки
`{переменных}`, автоматически работает внутри loop.

| Нода внутри loop | Что делает | Пример переменной |
|---|---|---|
| `http_request` | Запрос с динамическим URL | `{exchanger.url}` |
| `set_variable` | Сохранить/накопить результат | `{exchanger.name}: {rate}` |
| `condition` | Ветвление по элементу | `{exchanger.enabled} == true` |
| `message` | Отправить сообщение | `"🔸 {exchanger.name}: {rate}"` |
| `json_extract` | Извлечь поле из ответа | `exchange.{pair.from_id}.to.{exchanger.to_id}` |
| `table_set` | Записать в таблицу | `exchanger_id={exchanger.id}` |
| `table_get` | Прочитать из таблицы | `filter: id={exchanger.id}` |
| `psql_query` | SQL запрос | `WHERE id={exchanger.id}` |
| `convert_file` | Конвертация | XML-обменники |
| `broadcast` | Рассылка | `chat_id={subscriber.user_id}` |
| `loop` (вложенный) | Цикл в цикле | Обменники × пары |

### Что НЕ имеет смысла внутри loop

- `command_trigger`, `text_trigger`, `schedule_trigger` — точки входа, не действия
- `webhook_trigger` — точка входа

---

## 8. Граничные случаи

### 8.1 Пустой массив

Если `sourceVariable` содержит пустой массив `[]` или не существует —
тело цикла не выполняется, сразу переход к `afterLoopTo`.

```python
if not isinstance(_items, list) or len(_items) == 0:
    await handle_callback_msg_results(callback_query, state=state)
    return
```

### 8.2 Не массив (строка, число, объект)

Если переменная содержит строку — попытка `json.loads()`.
Если после парсинга не массив — пропуск, переход к `afterLoopTo`.

### 8.3 Вложенный loop — конфликт переменных

При вложенных циклах внутренний loop перезаписывает свои переменные.
Внешний `{pair.name}` остаётся доступным внутри, если `itemVariable` разные.

```
loop (pairs_list, item=pair)        ← {pair.name} доступно
  → loop (exchangers_list, item=exchanger)  ← {exchanger.url} + {pair.name} доступны
```

Если оба loop используют одинаковый `itemVariable` — внутренний перезапишет внешний.
UI должен предупреждать о конфликте имён.

### 8.4 Параллельный loop + запись в одну переменную

При `parallel: true` несколько итераций пишут в `user_data` одновременно.
Это безопасно для `table_set` (каждая итерация пишет свою строку),
но опасно для `set_variable` с накоплением (`result_text += ...`).

Рекомендация в UI: показывать предупреждение если `parallel: true`
и внутри есть `set_variable` с шаблоном, содержащим `{itemVariable}`.

### 8.5 Бесконечный цикл

Защита: `maxIterations` по умолчанию 0 (без лимита), но генератор
добавляет жёсткий лимит `10000` итераций как safety net:

```python
_HARD_LIMIT = 10000
for _i, _item in enumerate(_items):
    if _i >= _HARD_LIMIT:
        logging.warning(f"loop [loop-exchangers]: достигнут лимит {_HARD_LIMIT} итераций")
        break
```

### 8.6 Элемент — не словарь (примитив)

Если элемент массива — строка или число (не dict):
```python
_items = ["swop.is", "sova.is", "ferma.cc"]
```

Тогда `{exchanger}` = `"swop.is"`, а `{exchanger.xxx}` — пустая строка.
Разворачивание полей (`exchanger.field`) пропускается.

### 8.7 afterLoopTo не указан

Если `afterLoopTo` пустой — после цикла выполнение просто завершается.
Это валидный сценарий (например, фоновый сборщик без ответа пользователю).

---

## 9. Зависимости от других фич

| Фича | Зачем нужна для loop | Статус |
|------|---------------------|--------|
| `table_get` | Источник массива (список обменников из таблицы) | 🔲 не реализовано |
| `json_extract` | Извлечение поля по динамическому пути внутри loop | 🔲 не реализовано |
| `table_set` | Запись результата каждой итерации в таблицу | 🔲 не реализовано |
| `schedule_trigger` | Фоновый запуск loop без участия пользователя | 🔲 не реализовано |
| `http_request` | Запрос с динамическим URL внутри loop | ✅ уже работает |
| `set_variable` | Накопление результатов | ✅ уже работает |
| `condition` | Ветвление внутри loop | ✅ уже работает |

---

## 10. Что нужно реализовать

| Файл | Что изменить |
|------|-------------|
| `shared/schema/tables/node-schema.ts` | Добавить `'loop'` в enum типов, поля `sourceVariable`, `itemVariable`, `indexVariable`, `parallel`, `delaySeconds`, `maxIterations`, `afterLoopTo` |
| `lib/bot-generator/types/node-type.constants.ts` | Добавить `LOOP: 'loop'` |
| `lib/templates/loop/` | Создать директорию: `loop.params.ts`, `loop.schema.ts`, `loop.renderer.ts`, `loop.py.jinja2`, `index.ts` |
| `lib/templates/node-handlers/node-handlers.dispatcher.ts` | Добавить `case 'loop'` → `generateLoopFromNode(node)` |
| `lib/bot-generator/core/feature-flags.ts` | Добавить `hasLoopNodes` флаг (для импорта `asyncio` при parallel) |
| `client/components/editor/properties/` | Создать `LoopProperties.tsx` — панель настроек |
| `client/components/editor/canvas/nodes/` | Создать `LoopNode.tsx` — компонент ноды с двумя выходами |
| `docs/bot-json-prompt.md` | Добавить описание узла `loop` |

### Порядок реализации

1. Схема + типы (shared/schema, constants)
2. Шаблон генератора (lib/templates/loop/)
3. Регистрация в dispatcher
4. UI компонент ноды на холсте (два выхода)
5. UI панель настроек
6. Тесты генерации

---

## 11. Сравнение с n8n Loop Over Items

| | n8n Loop Over Items | Наш `loop` |
|---|---|---|
| Модель данных | Items flow (массив проходит через ноды) | Переменные пользователя (user_data) |
| Batch size | Настраивается (по N элементов за раз) | 1 элемент за итерацию (batch через maxIterations) |
| Параллельность | Items обрабатываются параллельно по умолчанию | Последовательно по умолчанию, опция `parallel` |
| Вложенность | Поддерживается | Поддерживается |
| Выходы | Loop / Done | Тело / Далее |
| Контекст элемента | `{{ $json.field }}` | `{exchanger.field}` |
| Сбор результатов | Merge нода | Накопление в переменной или table_set |
| Anti-flood | Нет встроенного | `delaySeconds` между итерациями |
| Safety limit | Нет | `maxIterations` + жёсткий лимит 10000 |

### Что мы берём от n8n
- Два выхода (Loop / Done) — проверенный UX-паттерн
- Batch processing — можно добавить позже

### Что у нас лучше
- Явные переменные `{exchanger.url}` понятнее чем `{{ $json.url }}`
- Anti-flood из коробки (delaySeconds)
- Safety limit защищает от бесконечных циклов
- Работает с существующими нодами без адаптации
