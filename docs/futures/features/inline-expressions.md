# 🧮 Формулы в тексте сообщения (Inline Expressions)

## Статус реализации

| Фаза | Статус | Описание |
|------|--------|----------|
| Фаза 1: MVP | ✅ **Реализовано** (30.05.2026) | Regex `{=...}` → `_eval_expr`, fallback, тесты, документация |
| Фаза 2: Форматтеры | ⏳ Ожидает | `{=fmt:var}`, `{=duration:var}`, `{=date:var}`, `{=upper/lower:var}` |
| Фаза 3: Продвинутые | ⏳ Ожидает | `{=plural:n:...}`, `{=ago:var}`, кастомный формат даты |

### Что реализовано (Фаза 1)

- ✅ Regex `\{=([^}]+)\}` в `replace_variables_in_text` (`lib/templates/utils/utils.py.jinja2`)
- ✅ Вызов `_eval_expr` для содержимого выражения
- ✅ Fallback: при ошибке `{=...}` остаётся как есть
- ✅ Порядок: после `#each`, до основной замены `{var}`
- ✅ Фазовый тест: `lib/tests/test-phase63-inline-expressions.ts` (6/6 ✅)
- ✅ Документация: `docs/bot-json-prompt.md`, `docs/features/NODE_TYPES.md`

### Что осталось (Фаза 2-3)

- ⏳ `{=fmt:var}` — сокращение для `{=thousands(var)}`
- ⏳ `{=duration:var}` — секунды → MM:SS
- ⏳ `{=date:var}` — timestamp → дата
- ⏳ `{=upper:var}` / `{=lower:var}` — регистр
- ⏳ `{=plural:n:один:два:много}` — склонение
- ⏳ `{=ago:var}` — "2 часа назад"

---

## Описание фичи

**Проблема:** Чтобы показать вычисленное значение в тексте сообщения, нужна отдельная нода `set_variable` перед `message`. Это добавляет лишние ноды и усложняет сценарий.

**Решение:** Поддержать синтаксис `{=выражение}` прямо в `messageText` (и других текстовых полях). Если содержимое фигурных скобок начинается с `=`, оно вычисляется через `_eval_expr` в момент подстановки.

**Результат:** Меньше нод, проще сценарии, быстрее разработка ботов.

---

## Синтаксис

### Обычная переменная vs формула

| Синтаксис | Тип | Описание |
|-----------|-----|----------|
| `{credits}` | Переменная | Подставляет значение переменной `credits` |
| `{pilot.name}` | Вложенная переменная | Подставляет значение из объекта |
| `{=credits - price}` | **Формула** | Вычисляет выражение и подставляет результат |
| `{=max(hp, 0)}` | **Формула с функцией** | Вызывает безопасную функцию |
| `{=fmt:credits}` | **Форматирование** | Форматирует число с разделителями (будущее) |

### Правило распознавания

```
{переменная}     → replace_variables_in_text (как сейчас)
{=выражение}     → _eval_expr (НОВОЕ)
{=формат:перем}  → специальный форматтер (БУДУЩЕЕ)
```

### Экранирование

Если нужно вывести литерал `{=`, используется `\{=`:
```
Синтаксис формул: \{=выражение\}
→ "Синтаксис формул: {=выражение}"
```

---

## Где поддерживается

| Поле | Нода | Пример |
|------|------|--------|
| `messageText` | message | `Баланс: {=credits - price} кр.` |
| `mediaCaption` | media (photo/video/audio) | `Фото #{=photo_count + 1}` |
| button text | message (inline/reply кнопки) | `Купить ({=price * quantity} кр.)` |
| `httpRequestUrl` | http_request | `https://api.example.com/user/{=user_id}` |
| `httpRequestBody` | http_request | `{"amount": {=credits * 100}}` |
| `query` | psql_query | `SELECT * WHERE balance > {=min_balance * 2}` |
| `value` (mode=text) | set_variable | `Итого: {=a + b + c}` |
| `conditionValue` | condition | `{=base_price * discount / 100}` |

---

## Поддерживаемые операции

### Арифметика

| Оператор | Описание | Пример |
|----------|----------|--------|
| `+` | Сложение | `{=credits + 100}` |
| `-` | Вычитание | `{=hp - damage}` |
| `*` | Умножение | `{=price * quantity}` |
| `/` | Деление | `{=total / count}` |
| `//` | Целочисленное деление | `{=seconds // 60}` |
| `%` | Остаток от деления | `{=seconds % 60}` |
| `**` | Возведение в степень | `{=level ** 2}` |

### Безопасные функции

| Функция | Описание | Пример |
|---------|----------|--------|
| `round(x)` | Округление | `{=round(price * 1.2)}` |
| `round(x, n)` | Округление до n знаков | `{=round(ratio, 2)}` |
| `abs(x)` | Модуль числа | `{=abs(balance_change)}` |
| `int(x)` | Приведение к целому | `{=int(raw_value)}` |
| `float(x)` | Приведение к дробному | `{=float(input)}` |
| `min(a, b)` | Минимум | `{=min(hp, max_hp)}` |
| `max(a, b)` | Максимум | `{=max(credits - cost, 0)}` |
| `str(x)` | Приведение к строке | `{=str(level)}` |
| `thousands(x)` | Число с разделителями | `{=thousands(credits)}` |

### Скобки и приоритет

Поддерживаются вложенные скобки для управления порядком вычислений:
```
{=(base_damage + bonus) * multiplier - armor}
{=max(0, (credits - price) * (1 - tax / 100))}
```

---

## Примеры

### Категория 1: Арифметика в тексте

| # | messageText | Переменные | Результат | Описание |
|---|-------------|-----------|-----------|----------|
| 1 | `Баланс после покупки: {=credits - price} кр.` | credits=5000, price=1200 | `Баланс после покупки: 3800 кр.` | Остаток после покупки |
| 2 | `Урон: {=base_damage + weapon_bonus} ед.` | base_damage=25, weapon_bonus=15 | `Урон: 40 ед.` | Суммарный урон |
| 3 | `Топливо после перелёта: {=fuel - distance * 2} ед.` | fuel=1000, distance=150 | `Топливо после перелёта: 700 ед.` | Расход топлива |
| 4 | `Опыт с бонусом: {=(base_xp + quest_xp) * multiplier}` | base_xp=50, quest_xp=30, multiplier=2 | `Опыт с бонусом: 160` | XP с множителем |
| 5 | `Цена со скидкой: {=price - price * discount // 100} руб.` | price=2000, discount=15 | `Цена со скидкой: 1700 руб.` | Скидка в процентах |
| 6 | `Всего предметов: {=swords + shields + potions}` | swords=3, shields=1, potions=7 | `Всего предметов: 11` | Сумма инвентаря |

### Категория 2: Форматирование чисел

| # | messageText | Переменные | Результат | Описание |
|---|-------------|-----------|-----------|----------|
| 7 | `Баланс: {=thousands(credits)} кр.` | credits=5000000 | `Баланс: 5 000 000 кр.` | Число с разделителями |
| 8 | `Цена: {=thousands(price * quantity)} ₽` | price=15000, quantity=3 | `Цена: 45 000 ₽` | Итого с форматированием |
| 9 | `Рейтинг: {=round(score / games, 2)}` | score=847, games=12 | `Рейтинг: 70.58` | Среднее с округлением |
| 10 | `Прогресс: {=round(done * 100 / total)}%` | done=7, total=12 | `Прогресс: 58%` | Процент выполнения |
| 11 | `Время: {=seconds // 60}:{=seconds % 60}` | seconds=185 | `Время: 3:5` | Минуты:секунды (простое) |
| 12 | `Награда: {=thousands(base_reward * level)} 💰` | base_reward=500, level=8 | `Награда: 4 000 💰` | Награда с уровнем |

### Категория 3: Процентные вычисления

| # | messageText | Переменные | Результат | Описание |
|---|-------------|-----------|-----------|----------|
| 13 | `Скидка: {=price * discount // 100} руб. (экономия!)` | price=3000, discount=20 | `Скидка: 600 руб. (экономия!)` | Сумма скидки |
| 14 | `Комиссия: {=amount * 5 // 100} кр.` | amount=10000 | `Комиссия: 500 кр.` | 5% комиссия |
| 15 | `Налог: {=income * tax // 100}, чистыми: {=income - income * tax // 100}` | income=50000, tax=13 | `Налог: 6500, чистыми: 43500` | Налог и чистый доход |
| 16 | `Заполнено: {=round(used * 100 / capacity)}% ({=used}/{=capacity})` | used=73, capacity=100 | `Заполнено: 73% (73/100)` | Прогресс-бар текстом |
| 17 | `Кэшбэк: +{=round(order_sum * cashback_pct / 100)} бонусов` | order_sum=4500, cashback_pct=7 | `Кэшбэк: +315 бонусов` | Кэшбэк с заказа |

### Категория 4: Комбинации с переменными из таблиц (psql/lookup)

| # | messageText | Переменные | Результат | Описание |
|---|-------------|-----------|-----------|----------|
| 18 | `{pilot.name}, ваш корабль стоит {=pilot.ship_price * 90 // 100} кр. (б/у)` | pilot.name=Иван, pilot.ship_price=50000 | `Иван, ваш корабль стоит 45000 кр. (б/у)` | Цена б/у корабля |
| 19 | `Планета {planet.name}: добыча {=planet.base_yield * planet.level} ед./ч` | planet.name=Марс, planet.base_yield=10, planet.level=5 | `Планета Марс: добыча 50 ед./ч` | Добыча с уровнем |
| 20 | `Товар: {product.name} × {quantity} = {=product.price * quantity} ₽` | product.name=Кофе, product.price=350, quantity=2 | `Товар: Кофе × 2 = 700 ₽` | Позиция в чеке |
| 21 | `До VIP осталось: {=vip_threshold - pilot.total_spent} ₽` | vip_threshold=100000, pilot.total_spent=73500 | `До VIP осталось: 26500 ₽` | Прогресс до VIP |

### Категория 5: Игровые примеры (урон, опыт, цены)

| # | messageText | Переменные | Результат | Описание |
|---|-------------|-----------|-----------|----------|
| 22 | `⚔️ Вы нанесли {=attack - enemy_armor} урона! У врага {=enemy_hp - (attack - enemy_armor)} HP` | attack=45, enemy_armor=12, enemy_hp=100 | `⚔️ Вы нанесли 33 урона! У врага 67 HP` | Боевой лог |
| 23 | `🎯 Крит! Урон: {=base_damage * 2 + crit_bonus}` | base_damage=30, crit_bonus=10 | `🎯 Крит! Урон: 70` | Критический удар |
| 24 | `📈 Уровень {level} → {=level + 1}! До следующего: {=(level + 1) ** 2 * 100} XP` | level=5 | `📈 Уровень 5 → 6! До следующего: 3600 XP` | Повышение уровня |
| 25 | `🛒 Цена: {=base_price * iron_mult // 100} кр. (рынок: {iron_mult}%)` | base_price=100, iron_mult=127 | `🛒 Цена: 127 кр. (рынок: 127%)` | Динамическая цена |
| 26 | `🛡️ Защита: {=armor + shield_bonus + buff}. Блок: {=min(armor + shield_bonus + buff, 50)}%` | armor=20, shield_bonus=15, buff=5 | `🛡️ Защита: 40. Блок: 40%` | Суммарная защита |
| 27 | `⛽ Заправка: +{refuel_amount} ед. Стоимость: {=refuel_amount * fuel_price} кр.` | refuel_amount=200, fuel_price=5 | `⛽ Заправка: +200 ед. Стоимость: 1000 кр.` | Заправка корабля |

### Категория 6: Бизнес-примеры (скидки, итого, комиссии)

| # | messageText | Переменные | Результат | Описание |
|---|-------------|-----------|-----------|----------|
| 28 | `📦 Заказ #{order_id}\nИтого: {=item_price * qty + delivery} ₽` | order_id=4521, item_price=1500, qty=2, delivery=300 | `📦 Заказ #4521\nИтого: 3300 ₽` | Сумма заказа |
| 29 | `💳 К оплате: {=total - bonus_used} ₽ (бонусами списано: {bonus_used} ₽)` | total=5000, bonus_used=800 | `💳 К оплате: 4200 ₽ (бонусами списано: 800 ₽)` | Оплата с бонусами |
| 30 | `📊 Средний чек: {=round(revenue / orders)} ₽ ({orders} заказов)` | revenue=450000, orders=127 | `📊 Средний чек: 3543 ₽ (127 заказов)` | Аналитика |
| 31 | `🏷️ Было: {price} ₽ → Стало: {=price * (100 - sale) // 100} ₽ (-{sale}%)` | price=2990, sale=30 | `🏷️ Было: 2990 ₽ → Стало: 2093 ₽ (-30%)` | Ценник со скидкой |
| 32 | `💰 Вывод: {=amount - amount * commission // 100} ₽ (комиссия {commission}%)` | amount=10000, commission=3 | `💰 Вывод: 9700 ₽ (комиссия 3%)` | Вывод средств |
| 33 | `📈 Прибыль: {=sell_price * sold - buy_price * bought} ₽` | sell_price=500, sold=20, buy_price=300, bought=20 | `📈 Прибыль: 4000 ₽` | Расчёт прибыли |

### Категория 7: Использование функций min/max/abs

| # | messageText | Переменные | Результат | Описание |
|---|-------------|-----------|-----------|----------|
| 34 | `HP: {=max(hp - damage, 0)}/{max_hp}` | hp=30, damage=50, max_hp=100 | `HP: 0/100` | HP не ниже нуля |
| 35 | `Можно купить: {=min(credits // price, stock)} шт.` | credits=5000, price=1200, stock=10 | `Можно купить: 4 шт.` | Ограничение покупки |
| 36 | `Изменение: {=abs(old_price - new_price)} ₽ ({="+" if new_price > old_price else "-"})` | old_price=1500, new_price=1200 | `Изменение: 300 ₽` | Разница цен (модуль) |

---

## Сравнение: до и после

### Пример 1: Показать баланс после покупки

**❌ До (2 ноды):**
```json
[
  {
    "type": "set_variable",
    "id": "calc-balance",
    "assignments": [
      {
        "variable": "new_balance",
        "value": "{credits} - {price}",
        "mode": "expression"
      }
    ]
  },
  {
    "type": "message",
    "id": "show-balance",
    "messageText": "✅ Покупка совершена!\nОсталось: {new_balance} кр."
  }
]
```

**✅ После (1 нода):**
```json
[
  {
    "type": "message",
    "id": "show-balance",
    "messageText": "✅ Покупка совершена!\nОсталось: {=credits - price} кр."
  }
]
```

**Экономия:** 1 нода, 1 промежуточная переменная `new_balance`.

### Пример 2: Боевой лог с вычислениями

**❌ До (3 ноды):**
```json
[
  {
    "type": "set_variable",
    "id": "calc-damage",
    "assignments": [
      { "variable": "real_damage", "value": "{attack} - {enemy_armor}", "mode": "expression" },
      { "variable": "enemy_hp_after", "value": "{enemy_hp} - {real_damage}", "mode": "expression" }
    ]
  },
  {
    "type": "set_variable",
    "id": "clamp-hp",
    "assignments": [
      { "variable": "enemy_hp_after", "value": "max({enemy_hp_after}, 0)", "mode": "expression" }
    ]
  },
  {
    "type": "message",
    "id": "battle-log",
    "messageText": "⚔️ Урон: {real_damage}\n❤️ HP врага: {enemy_hp_after}/{enemy_max_hp}"
  }
]
```

**✅ После (1 нода):**
```json
[
  {
    "type": "message",
    "id": "battle-log",
    "messageText": "⚔️ Урон: {=attack - enemy_armor}\n❤️ HP врага: {=max(enemy_hp - (attack - enemy_armor), 0)}/{enemy_max_hp}"
  }
]
```

**Экономия:** 2 ноды, 2 промежуточные переменные.

### Пример 3: Кнопка с динамической ценой

**❌ До (2 ноды):**
```json
[
  {
    "type": "set_variable",
    "id": "calc-total",
    "assignments": [
      { "variable": "total_price", "value": "{price} * {quantity}", "mode": "expression" }
    ]
  },
  {
    "type": "message",
    "id": "confirm-purchase",
    "messageText": "Подтвердите покупку:",
    "buttons": [
      { "text": "💳 Оплатить {total_price} ₽", "callbackData": "pay" }
    ]
  }
]
```

**✅ После (1 нода):**
```json
[
  {
    "type": "message",
    "id": "confirm-purchase",
    "messageText": "Подтвердите покупку:",
    "buttons": [
      { "text": "💳 Оплатить {=price * quantity} ₽", "callbackData": "pay" }
    ]
  }
]
```

### Пример 4: Форматированный баланс

**❌ До (2 ноды):**
```json
[
  {
    "type": "set_variable",
    "id": "format-balance",
    "assignments": [
      { "variable": "balance_display", "value": "{credits}", "mode": "format_number" }
    ]
  },
  {
    "type": "message",
    "id": "show-profile",
    "messageText": "👤 {pilot.name}\n💰 Баланс: {balance_display} кр."
  }
]
```

**✅ После (1 нода):**
```json
[
  {
    "type": "message",
    "id": "show-profile",
    "messageText": "👤 {pilot.name}\n💰 Баланс: {=thousands(credits)} кр."
  }
]
```

---

## Ограничения

### Что НЕЛЬЗЯ делать в `{=...}`

| Ограничение | Причина | Альтернатива |
|-------------|---------|--------------|
| Строковая конкатенация (`"a" + "b"`) | Не поддерживается в _eval_expr для безопасности | Используйте `{var1}{var2}` без `=` |
| Условные выражения (`if/else`) | Не поддерживается в inline (пока) | Используйте ноду `condition` или mode `conditional` |
| Присваивание (`x = 5`) | Формулы только читают, не пишут | Используйте ноду `set_variable` |
| Циклы (`for`, `while`) | Запрещено | Используйте `{#each}` в тексте |
| Импорты (`import os`) | Запрещено, небезопасно | Невозможно |
| Обращение к файлам/сети | Запрещено | Используйте ноду `http_request` |
| Работа с массивами (`arr[0]`) | Ограниченная поддержка | Используйте mode `array_item` |
| Вызов произвольных функций | Только whitelist | Только `round`, `abs`, `int`, `float`, `min`, `max`, `str`, `reversed`, `thousands` |
| Многострочные выражения | Одна строка | Разбейте на несколько `{=...}` |
| Тернарный оператор (`a if b else c`) | Пока не поддерживается в inline | Используйте mode `conditional` |

### Что МОЖНО

- Арифметика любой сложности со скобками
- Вложенные вызовы функций: `{=round(max(a, b) * 1.5)}`
- Несколько формул в одном тексте: `{=a + b} и {=c * d}`
- Комбинация формул и обычных переменных: `{name}: {=credits - price} кр.`
- Использование переменных с точкой: `{=pilot.credits - price}`

---

## Безопасность

### Почему это безопасно

Inline-выражения **НЕ используют** Python `eval()` напрямую. Вместо этого применяется `_eval_expr` — безопасный вычислитель на основе AST-анализа.

### Механизм защиты

```python
def _eval_expr(template: str, user_vars: dict):
    """
    1. Подставляет переменные: {credits} → "5000"
    2. Парсит результат через ast.parse(mode='eval')
    3. Проверяет КАЖДЫЙ узел AST на принадлежность к whitelist
    4. Если найден запрещённый узел → возвращает исходный шаблон
    5. Только если ВСЁ безопасно → выполняет через compile + eval
    """
```

### Whitelist узлов AST

```python
_allowed = (
    ast.Expression, ast.BinOp, ast.UnaryOp, ast.Constant,
    ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod, ast.Pow,
    ast.USub, ast.UAdd,
    ast.Call, ast.Name, ast.Load,
    ast.Attribute, ast.Subscript, ast.Index, ast.Slice,
    ast.IfExp, ast.Compare,
    ast.Gt, ast.GtE, ast.Lt, ast.LtE, ast.Eq, ast.NotEq,
)
```

### Whitelist функций

```python
_safe_funcs = {
    'round': round, 'abs': abs, 'int': int, 'float': float,
    'min': min, 'max': max, 'str': str,
    'thousands': lambda n: f"{int(float(n)):,}".replace(",", " ")
}
```

### Whitelist методов строк

```python
_safe_methods = {
    'replace', 'strip', 'lstrip', 'rstrip', 'lower', 'upper',
    'startswith', 'endswith', 'split', 'join', 'count', 'find', 'format'
}
```

### Что блокируется

| Попытка | Результат | Причина |
|---------|-----------|---------|
| `{=__import__('os').system('rm -rf /')}` | Возвращает исходный шаблон | `__import__` не в whitelist |
| `{=open('/etc/passwd').read()}` | Возвращает исходный шаблон | `open` не в whitelist |
| `{=eval("malicious")}` | Возвращает исходный шаблон | `eval` не в whitelist |
| `{=lambda: None}` | Возвращает исходный шаблон | `Lambda` не в _allowed |
| `{=[x for x in range(10)]}` | Возвращает исходный шаблон | `ListComp` не в _allowed |

### Поведение при ошибке

Если выражение невалидно или содержит запрещённые конструкции, `_eval_expr` возвращает **исходный шаблон без изменений**. Бот не падает, пользователь видит `{=выражение}` как текст.

---

## Реализация

### Где менять код

| Файл | Что менять | Описание |
|------|-----------|----------|
| `lib/templates/utils/utils.py.jinja2` | `replace_variables_in_text()` | Добавить обработку `{=...}` паттерна |
| `lib/templates/message/message.py.jinja2` | Ничего (уже вызывает replace_variables_in_text) | Автоматически подхватит |
| `lib/templates/media-node/media-node.py.jinja2` | Ничего | Автоматически подхватит |
| `lib/templates/psql-query/psql-query.py.jinja2` | Ничего | Автоматически подхватит |
| `lib/tests/` | Добавить тесты | Тесты на inline-выражения |
| `docs/bot-json-prompt.md` | Обновить промт | Описать синтаксис `{=...}` для ИИ |

### Изменение в `replace_variables_in_text`

```python
def replace_variables_in_text(text: str, variables: dict, filters: dict = None) -> str:
    """Заменяет переменные вида {var_name} и вычисляет формулы {=expr} в тексте."""
    if not text or not variables:
        return text or ''
    import re as _re

    # ... (существующий код: __now_plus, __now, встроенные переменные, #each) ...

    # ─── НОВОЕ: Обработка inline-выражений {=...} ───────────────────────────
    def _inline_expr_replacer(match):
        """Вычисляет inline-выражение {=expr} через _eval_expr."""
        expr_template = match.group(1)  # всё после "=" внутри скобок
        result = _eval_expr(expr_template, variables)
        # Если _eval_expr вернул исходный шаблон (ошибка) — показываем как есть
        if result == expr_template:
            return match.group(0)  # возвращаем {=expr} без изменений
        return str(result)

    # Ищем паттерн {=...} (не жадно, без вложенных {})
    text = _re.sub(r'\{=([^}]+)\}', _inline_expr_replacer, text)

    # ─── Существующая обработка обычных переменных {var} ─────────────────────
    # ... (существующий код подстановки переменных) ...

    return text
```

### Порядок обработки (важно!)

```
1. {__now_plus_N}     → timestamp + N
2. {__now}            → текущий timestamp
3. {#each arr}...{/each} → развёртка массива
4. {=выражение}       → вычисление через _eval_expr  ← НОВОЕ
5. {переменная}       → подстановка значения
6. {var|filter}       → подстановка с фильтром (если есть)
```

**Почему `{=...}` обрабатывается ДО обычных переменных:**
- Внутри `{=credits - price}` переменные `credits` и `price` подставляются самим `_eval_expr`
- Если бы сначала подставлялись переменные, `{=5000 - 1200}` уже не содержал бы `{...}` и не был бы распознан как формула

### Полный пример обработки

```
Вход: "Баланс: {=credits - price} кр. Имя: {pilot.name}"
Переменные: {credits: "5000", price: "1200", pilot.name: "Иван"}

Шаг 4: regex находит {=credits - price}
  → _eval_expr("credits - price", vars)
  → подставляет: "5000 - 1200"
  → AST: BinOp(Constant(5000), Sub, Constant(1200))
  → все узлы в whitelist ✓
  → eval → 3800
  → текст: "Баланс: 3800 кр. Имя: {pilot.name}"

Шаг 5: regex находит {pilot.name}
  → подставляет: "Иван"
  → текст: "Баланс: 3800 кр. Имя: Иван"

Результат: "Баланс: 3800 кр. Имя: Иван"
```

---

## Расширения (будущее)

### 1. `{=fmt:переменная}` — Форматирование числа с разделителями

Сокращённый синтаксис для `{=thousands(переменная)}`.

```
{=fmt:credits}     → "5 000 000"
{=fmt:price}       → "1 500"
```

**Реализация:**
```python
# В _inline_expr_replacer:
if expr_template.startswith('fmt:'):
    var_name = expr_template[4:]
    val = _get_variable(var_name, variables)
    try:
        num = int(float(val))
        return f"{num:,}".replace(",", " ")
    except (ValueError, TypeError):
        return str(val)
```

**Примеры:**
| # | messageText | Переменные | Результат |
|---|-------------|-----------|-----------|
| 1 | `Баланс: {=fmt:credits} кр.` | credits=5000000 | `Баланс: 5 000 000 кр.` |
| 2 | `Цена: {=fmt:total_price} ₽` | total_price=45000 | `Цена: 45 000 ₽` |
| 3 | `Опыт: {=fmt:xp}/{=fmt:xp_needed}` | xp=12500, xp_needed=50000 | `Опыт: 12 500/50 000` |

---

### 2. `{=duration:переменная}` — Секунды → MM:SS

```
{=duration:cooldown}     → "05:30"  (если cooldown=330)
{=duration:flight_time}  → "02:15"  (если flight_time=135)
```

**Реализация:**
```python
if expr_template.startswith('duration:'):
    var_name = expr_template[9:]
    val = int(float(_get_variable(var_name, variables)))
    m, s = divmod(abs(val), 60)
    return f"{m:02d}:{s:02d}"
```

**Примеры:**
| # | messageText | Переменные | Результат |
|---|-------------|-----------|-----------|
| 1 | `⏱ Кулдаун: {=duration:cooldown_sec}` | cooldown_sec=330 | `⏱ Кулдаун: 05:30` |
| 2 | `🚀 Время полёта: {=duration:flight_sec}` | flight_sec=7200 | `🚀 Время полёта: 120:00` |
| 3 | `⏳ Осталось: {=duration:remaining}` | remaining=45 | `⏳ Осталось: 00:45` |

---

### 3. `{=date:переменная}` — Timestamp → дата

```
{=date:registered_at}     → "20.05.2024 10:30"
{=date:last_login}        → "15.06.2024 18:45"
```

**Реализация:**
```python
if expr_template.startswith('date:'):
    var_name = expr_template[5:]
    ts = int(float(_get_variable(var_name, variables)))
    import time
    t = time.localtime(ts)
    return time.strftime("%d.%m.%Y %H:%M", t)
```

**Примеры:**
| # | messageText | Переменные | Результат |
|---|-------------|-----------|-----------|
| 1 | `📅 Регистрация: {=date:registered_at}` | registered_at=1716192600 | `📅 Регистрация: 20.05.2024 10:30` |
| 2 | `🕐 Последний вход: {=date:last_login}` | last_login=1718472300 | `🕐 Последний вход: 15.06.2024 18:45` |
| 3 | `🛒 Заказ от {=date:order_time}` | order_time=1716200000 | `🛒 Заказ от 20.05.2024 12:33` |

---

### 4. `{=upper:переменная}` — Верхний регистр

```
{=upper:name}     → "ИВАН"  (если name="Иван")
{=upper:rank}     → "VIP"   (если rank="vip")
```

**Реализация:**
```python
if expr_template.startswith('upper:'):
    var_name = expr_template[6:]
    val = str(_get_variable(var_name, variables))
    return val.upper()
```

**Примеры:**
| # | messageText | Переменные | Результат |
|---|-------------|-----------|-----------|
| 1 | `⚠️ {=upper:alert_text}` | alert_text=внимание | `⚠️ ВНИМАНИЕ` |
| 2 | `Ранг: {=upper:rank}` | rank=vip | `Ранг: VIP` |
| 3 | `[{=upper:status}] Система` | status=online | `[ONLINE] Система` |

---

### 5. `{=lower:переменная}` — Нижний регистр

```
{=lower:input}     → "привет"  (если input="ПРИВЕТ")
```

**Реализация:**
```python
if expr_template.startswith('lower:'):
    var_name = expr_template[6:]
    val = str(_get_variable(var_name, variables))
    return val.lower()
```

---

### 6. `{=plural:count:один:два:много}` — Склонение по числу

Русское склонение существительных по числу.

```
{=plural:credits:кредит:кредита:кредитов}
  credits=1   → "кредит"
  credits=3   → "кредита"
  credits=5   → "кредитов"
  credits=21  → "кредит"
  credits=112 → "кредитов"
```

**Реализация:**
```python
if expr_template.startswith('plural:'):
    parts = expr_template[7:].split(':')
    if len(parts) == 4:
        var_name, form1, form2, form5 = parts
        n = abs(int(float(_get_variable(var_name, variables))))
        n100 = n % 100
        n10 = n % 10
        if 11 <= n100 <= 19:
            return form5
        elif n10 == 1:
            return form1
        elif 2 <= n10 <= 4:
            return form2
        else:
            return form5
```

**Примеры:**
| # | messageText | Переменные | Результат |
|---|-------------|-----------|-----------|
| 1 | `У вас {credits} {=plural:credits:кредит:кредита:кредитов}` | credits=1 | `У вас 1 кредит` |
| 2 | `У вас {credits} {=plural:credits:кредит:кредита:кредитов}` | credits=3 | `У вас 3 кредита` |
| 3 | `У вас {credits} {=plural:credits:кредит:кредита:кредитов}` | credits=25 | `У вас 25 кредитов` |
| 4 | `Осталось {lives} {=plural:lives:жизнь:жизни:жизней}` | lives=1 | `Осталось 1 жизнь` |
| 5 | `{days} {=plural:days:день:дня:дней} до события` | days=5 | `5 дней до события` |
| 6 | `Куплено {qty} {=plural:qty:штука:штуки:штук}` | qty=21 | `Куплено 21 штука` |

---

### 7. `{=ago:переменная}` — Время назад (будущее расширение)

```
{=ago:last_login}     → "2 часа назад"
{=ago:registered_at}  → "3 дня назад"
```

**Реализация:**
```python
if expr_template.startswith('ago:'):
    var_name = expr_template[4:]
    ts = int(float(_get_variable(var_name, variables)))
    import time
    diff = int(time.time()) - ts
    if diff < 60:
        return "только что"
    elif diff < 3600:
        m = diff // 60
        return f"{m} {_plural(m, 'минуту', 'минуты', 'минут')} назад"
    elif diff < 86400:
        h = diff // 3600
        return f"{h} {_plural(h, 'час', 'часа', 'часов')} назад"
    else:
        d = diff // 86400
        return f"{d} {_plural(d, 'день', 'дня', 'дней')} назад"
```

---

## Приоритет и план реализации

### Фаза 1: MVP (высокий приоритет) ✅ РЕАЛИЗОВАНО

| # | Задача | Статус | Описание |
|---|--------|--------|----------|
| 1 | Добавить regex `{=...}` в `replace_variables_in_text` | ✅ | 10 строк кода |
| 2 | Вызывать `_eval_expr` для содержимого | ✅ | Функция уже существует |
| 3 | Обработка ошибок (fallback на исходный текст) | ✅ | Уже реализовано в _eval_expr |
| 4 | Тесты: `test-phase63-inline-expressions.ts` | ✅ | 6 тест-кейсов |
| 5 | Обновить `docs/bot-json-prompt.md` | ✅ | Описан синтаксис для ИИ |

**Реализовано 30.05.2026.** Тест: `npx tsx --test lib/tests/test-phase63-inline-expressions.ts`

### Фаза 2: Форматтеры (средний приоритет) 🟡

| # | Задача | Сложность | Описание |
|---|--------|-----------|----------|
| 6 | `{=fmt:var}` — число с разделителями | Низкая | 5 строк |
| 7 | `{=duration:var}` — секунды → MM:SS | Низкая | 5 строк |
| 8 | `{=date:var}` — timestamp → дата | Низкая | 5 строк |
| 9 | `{=upper:var}` / `{=lower:var}` | Низкая | 3 строки каждый |
| 10 | Тесты на форматтеры | Средняя | 10 тест-кейсов |

**Оценка:** 3-4 часа. Удобство без сложности.

### Фаза 3: Продвинутые форматтеры (низкий приоритет) 🟢

| # | Задача | Сложность | Описание |
|---|--------|-----------|----------|
| 11 | `{=plural:n:один:два:много}` — склонение | Средняя | 15 строк |
| 12 | `{=ago:var}` — время назад | Средняя | 20 строк |
| 13 | `{=date:var:format}` — кастомный формат даты | Средняя | 10 строк |
| 14 | Документация для пользователей | Низкая | Markdown |

**Оценка:** 4-5 часов.

### Зависимости

```
Фаза 1 ← ничего (можно начинать сразу)
Фаза 2 ← Фаза 1 (нужен regex-обработчик)
Фаза 3 ← Фаза 2 (расширение форматтеров)
```

### Обратная совместимость

- **Полная обратная совместимость.** Существующие `{переменная}` работают как раньше.
- Новый синтаксис `{=...}` не конфликтует — символ `=` невалиден в начале имени переменной.
- Если пользователь случайно напишет `{=что-то}` и это не вычислится — текст останется как есть.

---

## Влияние на горячую перезагрузку контента

### Текущая архитектура

Горячая перезагрузка (hot reload) обновляет `messageText` и другие текстовые поля без перезапуска бота. Переменные подставляются в момент отправки сообщения.

### Влияние inline-выражений

| Аспект | Влияние | Описание |
|--------|---------|----------|
| Hot reload текста | ✅ Без изменений | `{=expr}` вычисляется в момент отправки, как и `{var}` |
| Изменение формулы | ✅ Мгновенно | Новая формула подхватывается при следующей отправке |
| Производительность | ✅ Минимальное | `_eval_expr` работает <1мс на выражение |
| Кэширование | ❌ Не нужно | Выражения вычисляются каждый раз заново (значения переменных могут меняться) |
| Ошибки в формуле | ✅ Безопасно | Невалидная формула → текст `{=...}` остаётся как есть |

### Сценарий обновления

```
1. Пользователь меняет messageText в конструкторе:
   "Баланс: {credits} кр." → "Баланс: {=thousands(credits)} кр."

2. Hot reload обновляет текст в памяти бота

3. При следующей отправке:
   - regex находит {=thousands(credits)}
   - _eval_expr("thousands(credits)", vars) → "5 000"
   - Пользователь видит: "Баланс: 5 000 кр."
```

### Производительность

```python
# Бенчмарк (примерный):
# Простое выражение {=a + b}:           ~0.05 мс
# Сложное {=max(a * b - c, 0) // 100}:  ~0.15 мс
# Форматтер {=fmt:credits}:             ~0.03 мс
# 10 формул в одном сообщении:          ~0.5 мс

# Для сравнения:
# Отправка сообщения в Telegram API:    ~100-300 мс
# Запрос к PostgreSQL:                  ~5-50 мс
```

Вычисление формул занимает <1% от общего времени обработки сообщения. Оптимизация не требуется.

---

## Полный пример: игровой бот

### Сценарий: Магазин с динамическими ценами

**JSON (1 нода вместо 4):**
```json
{
  "type": "message",
  "id": "shop-item-info",
  "messageText": "🛒 {item.name}\n\n💰 Базовая цена: {item.base_price} кр.\n📈 Рыночный множитель: {market_mult}%\n\n🏷️ Итого: {=item.base_price * market_mult // 100} кр.\n💳 Ваш баланс: {=thousands(credits)} кр.\n📦 Можно купить: {=min(credits * 100 // (item.base_price * market_mult), stock)} шт.\n\n{=credits * 100 // (item.base_price * market_mult) > 0 ? '✅ Доступно к покупке' : '❌ Недостаточно средств'}",
  "buttons": [
    { "text": "🛒 Купить 1 шт. ({=item.base_price * market_mult // 100} кр.)", "callbackData": "buy_1" },
    { "text": "🛒 Купить 5 шт. ({=item.base_price * market_mult // 100 * 5} кр.)", "callbackData": "buy_5" },
    { "text": "◀️ Назад", "callbackData": "back_to_shop" }
  ]
}
```

**Без inline-выражений потребовалось бы:**
```
set_variable (calc-price):     item_price = {item.base_price} * {market_mult} // 100
set_variable (calc-afford):    can_buy = {credits} // {item_price}
set_variable (format-balance): balance_fmt = format_number({credits})
set_variable (calc-5x):        price_5x = {item_price} * 5
message (shop-item-info):      показать всё
```

**Итого:** 5 нод → 1 нода. Сценарий проще, переменных меньше, читаемость выше.

---

## FAQ

**Q: Можно ли использовать результат одного `{=...}` в другом?**
A: Нет. Каждое `{=...}` вычисляется независимо. Если нужен промежуточный результат — используйте `set_variable`.

**Q: Что если переменная не существует?**
A: `_eval_expr` подставляет `0` вместо несуществующей переменной. `{=missing_var + 10}` → `10`.

**Q: Можно ли использовать `{=...}` в callback_data кнопок?**
A: Нет, `callback_data` не проходит через `replace_variables_in_text`. Используйте обычные `{var}`.

**Q: Работает ли с переменными из psql_query?**
A: Да. После выполнения psql_query переменные доступны как обычно: `{=row.price * row.quantity}`.

**Q: Есть ли лимит на количество формул в одном сообщении?**
A: Технического лимита нет. Рекомендуется не более 10-15 формул для читаемости.

**Q: Поддерживаются ли дробные числа?**
A: Да. `{=3.14 * radius ** 2}` работает корректно. Результат может быть дробным.
