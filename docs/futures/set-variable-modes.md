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

### extract_number — Извлечение числа из строки

**Описание:** Извлекает первое число из строки. Полезно для парсинга ввода пользователя или текста reply-кнопок.

**UI в панели свойств:**
```
переменная = [refuel_amount]
режим: [🔢 Извлечь число]
значение: [{raw_input}]
```

**JSON:**
```json
{
  "variable": "refuel_amount",
  "value": "{raw_input}",
  "mode": "extract_number"
}
```

**Генерация Python:**
```python
import re as _re_extract
_raw = replace_variables_in_text("{raw_input}", _vars)
_match = _re_extract.search(r'\d+', str(_raw))
user_data[user_id]["refuel_amount"] = _match.group() if _match else "0"
```

**Примеры:**
| Ввод | Результат |
|------|-----------|
| `"⛽ +1000"` | `"1000"` |
| `"Купить 5 штук"` | `"5"` |
| `"1000"` | `"1000"` |
| `"abc"` | `"0"` |

**Применение:**
- Динамические reply-кнопки с числами (заправка, покупка)
- Парсинг пользовательского ввода ("хочу 10 штук")
- Извлечение ID из callback_data

**Паттерн: динамические кнопки заправки**
```
msg (reply кнопки: "⛽ +{amount1}", "⛽ +{amount2}", "⛽ +{amount3}")
  ↓
input (сохраняет нажатие/ввод в raw_input)
  ↓
set_variable extract_number (raw_input → refuel_amount)
  ↓
set_variable expression (refuel_cost = refuel_amount * 5)
  ↓
condition → update → msg ok
```

---

### daily_random — Детерминированный рандом по дате

**Описание:** Генерирует число, которое одинаково для всех пользователей в течение одного дня, но меняется на следующий. Привязано к seed (строке) — разные seed дают разные числа в один день.

**UI в панели свойств:**
```
переменная = [iron_mult]
режим: [📅 Дневной рандом]
seed: [iron]
мин: [70]  макс: [130]
```

**JSON:**
```json
{
  "variable": "iron_mult",
  "value": "iron",
  "mode": "daily_random",
  "minValue": "70",
  "maxValue": "130"
}
```

**Генерация Python:**
```python
import hashlib, time
_seed = f"{time.strftime('%Y-%m-%d')}_{replace_variables_in_text('iron', _vars)}"
_hash = int(hashlib.md5(_seed.encode()).hexdigest()[:8], 16)
_min, _max = 70, 130
_result = _hash % (_max - _min + 1) + _min
user_data[user_id]["iron_mult"] = str(_result)
```

**Свойства:**
- Все пользователи видят одинаковое значение в один день
- На следующий день — новое значение
- Разные seed → разные значения (iron ≠ copper)
- Детерминированно — перезапуск бота не меняет результат
- Не нужен schedule_trigger

**Применение:**
- Динамические цены на руды (±30% от базовой каждый день)
- Ежедневные события ("сегодня бонус на Кристалл")
- Ротация контента по дням

**Паттерн: динамические цены**
```
set_variable [
  iron_mult = daily_random(seed="iron", min=70, max=130),
  iron_price = {base_price_iron} * {iron_mult} // 100 (expression)
]
```
Результат: цена железа каждый день разная (70-130% от базовой), но одинаковая для всех игроков.

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
2. **extract_number** — парсинг чисел из ввода/кнопок (динамические кнопки)
3. **daily_random** — детерминированный рандом привязанный к дате (динамические цены)
4. **date_format** — часто нужен (регистрация, логи, расписания)
5. **conditional** — убирает лишние ноды condition для простых случаев
6. **split_get** — парсинг пользовательского ввода
7. **math_round** — нишевый

---

## Реализация (порядок по AGENTS.md)

Для каждого нового mode:
1. Фронтенд: добавить в `AssignmentMode` type, `MODE_CONFIGS`, кастомный UI если нужен
2. Схема: `set-variable.schema.ts` (zod enum + новые поля)
3. Параметры: `set-variable.params.ts`
4. Шаблон: `set-variable.py.jinja2` (генерация Python)
5. Фазовый тест: `test-phase24-set-variable.ts`
6. Промт: `docs/bot-json-prompt.md`
