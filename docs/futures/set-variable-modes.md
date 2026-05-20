# 🧮 Узел «Переменные» — новые режимы (futures)

## Текущее название: "🧮 Переменные" (set_variable)

### Альтернативные названия:
- **🧮 Вычисления** — акцент на математику
- **⚙️ Обработка данных** — более общее
- **🔧 Трансформации** — как в ETL

### Рекомендация: **🧮 Вычисления**
Отражает суть — узел не просто "устанавливает переменные", а вычисляет, форматирует, ищет, генерирует.

---

## Новые режимы (planned)

### weighted_random — Взвешенный рандом

**Описание:** Случайный выбор элемента с указанными весами (процентами).

**UI в панели свойств:**
```
переменная = [event]
режим: [🎲 Взвешенный рандом]

┌─────────────────────────────────────┐
│ [ничего         ] [60] %    [🗑]    │
│ [пираты         ] [25] %    [🗑]    │
│ [артефакт       ] [10] %    [🗑]    │
│ [джекпот        ] [ 5] %    [🗑]    │
│                                     │
│ [+ Добавить]     Сумма: 100% ✅     │
└─────────────────────────────────────┘
```

**JSON:**
```json
{
  "variable": "event",
  "mode": "weighted_random",
  "weightedItems": [
    {"value": "ничего", "weight": 60},
    {"value": "пираты", "weight": 25},
    {"value": "артефакт", "weight": 10},
    {"value": "джекпот", "weight": 5}
  ]
}
```

**Генерация Python:**
```python
import random as _rnd
_items = [("ничего", 60), ("пираты", 25), ("артефакт", 10), ("джекпот", 5)]
_roll = _rnd.randint(1, 100)
_cumulative = 0
_result = _items[-1][0]
for _item, _weight in _items:
    _cumulative += _weight
    if _roll <= _cumulative:
        _result = _item
        break
user_data[user_id]["event"] = _result
```

**Применение:** лут-таблицы, события, дроп, выбор NPC реплик.

---

### date_format — Форматирование даты

**Описание:** Преобразует Unix timestamp в читаемую дату.

**UI:** поле value (timestamp переменная) + поле формата.

**JSON:**
```json
{
  "variable": "date_str",
  "value": "{pilot.registered_at}",
  "mode": "date_format",
  "dateFormat": "DD.MM.YYYY HH:mm"
}
```

**Результат:** `"20.05.2026 08:30"`

---

### conditional — Тернарный оператор

**Описание:** Если условие true → значение A, иначе → значение B. Без отдельной ноды condition.

**UI:**
```
переменная = [status_emoji]
режим: [❓ Условие]

Если: [{pilot.credits}] [больше] [1000]
  То: [💰]
  Иначе: [💸]
```

**JSON:**
```json
{
  "variable": "status_emoji",
  "mode": "conditional",
  "conditionVariable": "pilot.credits",
  "conditionOperator": "greater_than",
  "conditionValue": "1000",
  "trueValue": "💰",
  "falseValue": "💸"
}
```

**Применение:** динамические эмодзи, статусы, подсказки без лишних нод.

---

### split_get — Разделить и взять элемент

**Описание:** Разделяет строку по разделителю и берёт N-й элемент.

**JSON:**
```json
{
  "variable": "first_word",
  "value": "{user_input}",
  "mode": "split_get",
  "separator": " ",
  "index": "0"
}
```

---

### math_round — Округление

**Описание:** Округляет число до N знаков после запятой.

**JSON:**
```json
{
  "variable": "price_rounded",
  "value": "{raw_price}",
  "mode": "math_round",
  "precision": "0"
}
```

---

## Приоритет реализации

1. **weighted_random** — самый востребованный (игровые боты, лут, события)
2. **date_format** — часто нужен (регистрация, логи, расписания)
3. **conditional** — убирает лишние ноды condition для простых случаев
4. **split_get** — парсинг пользовательского ввода
5. **math_round** — нишевый

---

## Реализация (порядок по AGENTS.md)

Для каждого нового mode:
1. Фронтенд: добавить в `AssignmentMode` type, `MODE_CONFIGS`, кастомный UI если нужен
2. Схема: `set-variable.schema.ts` (zod enum + новые поля)
3. Параметры: `set-variable.params.ts`
4. Шаблон: `set-variable.py.jinja2` (генерация Python)
5. Фазовый тест: `test-phase24-set-variable.ts`
6. Промт: `docs/bot-json-prompt.md`
