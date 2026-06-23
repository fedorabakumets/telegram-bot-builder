# 📊 Типизированные колонки + Математика в таблицах

## Архитектурный документ

**Статус:** Планирование  
**Приоритет:** Высокий  
**Зависимости:** bot_table (Phase 29/45), inline-expressions  
**Дата:** 2025

---

## 1. Проблема

### Текущая архитектура хранения данных

Сейчас `bot_table_rows` хранит все данные в одном JSONB поле `data`:

```sql
CREATE TABLE bot_table_rows (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES bot_tables(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'
);
```

Пример данных:
```json
{"231": "500", "232": "earth", "233": "true", "234": "2024-01-15"}
```

### Ключевые ограничения

| # | Проблема | Последствие |
|---|----------|-------------|
| 1 | Все значения — строки | Нельзя сортировать числа правильно ("9" > "10") |
| 2 | Нет типизации | `"500"` — это число? строка? ID? |
| 3 | Нет индексов на полях | Поиск по конкретному полю = full scan JSONB |
| 4 | Медленная аналитика | Агрегация требует парсинга каждой строки |
| 5 | Нет вычисляемых колонок | Формулы невозможны без отдельных нод |
| 6 | Нет валидации при записи | Можно записать "abc" в числовое поле |
| 7 | Нет автоинкремента | Нужна отдельная логика для ID |
| 8 | Нет дефолтных значений | Каждая вставка должна указывать все поля |

### Производительность на реальных данных

```
Таблица: 10,000 строк, 8 колонок
─────────────────────────────────────────────────────
Операция                    │ JSONB (сейчас) │ Typed
─────────────────────────────────────────────────────
SELECT WHERE col = 500      │ ~45ms          │ ~2ms
SUM(col) по всем строкам    │ ~120ms         │ ~8ms
ORDER BY col DESC LIMIT 10  │ ~85ms          │ ~3ms
COUNT WHERE col > 100       │ ~50ms          │ ~4ms
─────────────────────────────────────────────────────
```

### Почему JSONB не масштабируется

```
┌─────────────────────────────────────────────────────────┐
│  Запрос: "Найди всех игроков с balance > 1000"          │
│                                                          │
│  Текущий путь (JSONB):                                  │
│  1. Прочитать ВСЕ строки таблицы                        │
│  2. Для каждой строки: распарсить JSON                  │
│  3. Найти ключ по column_id                             │
│  4. Привести строку "1500" к числу                      │
│  5. Сравнить с 1000                                     │
│  → O(n) всегда, индекс GIN не помогает для >/<         │
│                                                          │
│  Путь с типизацией:                                     │
│  1. B-tree индекс на generated column                   │
│  2. Index scan → сразу нужные строки                    │
│  → O(log n), мгновенно                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Решение: Материализованные колонки (Generated Columns)

### Концепция

PostgreSQL 12+ поддерживает **GENERATED ALWAYS AS ... STORED** — колонки, которые автоматически вычисляются из других колонок и хранятся физически на диске.

**Ключевая идея:** Мы НЕ меняем формат записи (JSONB остаётся). Мы ДОБАВЛЯЕМ generated columns, которые извлекают и типизируют данные из JSONB автоматически.

### Базовый пример

```sql
-- Добавляем generated column для числового поля "balance" (column_id = 231)
ALTER TABLE bot_table_rows
ADD COLUMN col_231_num NUMERIC
GENERATED ALWAYS AS ((data->>'231')::NUMERIC) STORED;

-- Теперь можно создать B-tree индекс
CREATE INDEX idx_col_231 ON bot_table_rows(col_231_num)
WHERE table_id = 42;

-- Запрос использует индекс автоматически
SELECT * FROM bot_table_rows
WHERE table_id = 42 AND col_231_num > 1000
ORDER BY col_231_num DESC;
```

### Типы generated columns

```sql
-- Числовая колонка (INTEGER)
ALTER TABLE bot_table_rows
ADD COLUMN col_{id}_int INTEGER
GENERATED ALWAYS AS ((data->>'{id}')::INTEGER) STORED;

-- Числовая колонка (FLOAT/NUMERIC)
ALTER TABLE bot_table_rows
ADD COLUMN col_{id}_num NUMERIC
GENERATED ALWAYS AS ((data->>'{id}')::NUMERIC) STORED;

-- Булева колонка
ALTER TABLE bot_table_rows
ADD COLUMN col_{id}_bool BOOLEAN
GENERATED ALWAYS AS ((data->>'{id}')::BOOLEAN) STORED;

-- Временная метка
ALTER TABLE bot_table_rows
ADD COLUMN col_{id}_ts TIMESTAMP WITH TIME ZONE
GENERATED ALWAYS AS ((data->>'{id}')::TIMESTAMPTZ) STORED;

-- Текстовая (для индексации и поиска)
ALTER TABLE bot_table_rows
ADD COLUMN col_{id}_text TEXT
GENERATED ALWAYS AS (data->>'{id}') STORED;
```

### Преимущества подхода

| Преимущество | Описание |
|--------------|----------|
| Обратная совместимость | Запись в JSONB работает как раньше |
| Автообновление | При изменении `data` колонка пересчитывается |
| Индексируемость | B-tree, BRIN, partial indexes |
| Нулевая стоимость чтения | Данные уже материализованы |
| Типобезопасность | PostgreSQL гарантирует тип |

### Ограничения

| Ограничение | Решение |
|-------------|---------|
| Нельзя ссылаться на другие таблицы | Формулы с VLOOKUP — вычисляются при чтении |
| Нельзя использовать подзапросы | Агрегатные функции — отдельный механизм |
| Нельзя менять выражение без DROP/ADD | Миграция при изменении формулы |
| Занимает место на диске | Незначительно для числовых типов |

---

## 3. Типизация колонок в UI

### Поддерживаемые типы

| Тип | PostgreSQL | UI иконка | Описание |
|-----|-----------|-----------|----------|
| `text` | TEXT | 📝 | Строка (по умолчанию) |
| `number` | NUMERIC | 🔢 | Целое или дробное число |
| `boolean` | BOOLEAN | ✅ | true/false (чекбокс) |
| `timestamp` | TIMESTAMPTZ | 📅 | Дата и время |
| `json` | JSONB | 📋 | Вложенный объект |
| `formula` | GENERATED/computed | 🧮 | Вычисляемое значение |
| `autoincrement` | SERIAL-like | 🔄 | Автоинкремент |
| `select` | TEXT + CHECK | 📌 | Выбор из списка |

### Изменение схемы `bot_table_columns`

```sql
-- Новые поля в bot_table_columns
ALTER TABLE bot_table_columns
ADD COLUMN column_type VARCHAR(20) NOT NULL DEFAULT 'text',
ADD COLUMN default_value TEXT,
ADD COLUMN formula TEXT,
ADD COLUMN validation JSONB,
ADD COLUMN options JSONB;  -- для типа select
```

```typescript
// Обновлённая схема Drizzle
export const botTableColumns = pgTable("bot_table_columns", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").references(() => botTables.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  position: integer("position").notNull().default(0),
  /** Тип колонки: text, number, boolean, timestamp, json, formula, autoincrement, select */
  columnType: varchar("column_type", { length: 20 }).notNull().default("text"),
  /** Значение по умолчанию (строковое представление) */
  defaultValue: varchar("default_value", { length: 1000 }),
  /** Формула для вычисляемых колонок */
  formula: varchar("formula", { length: 2000 }),
  /** Правила валидации (JSON): { min, max, pattern, required } */
  validation: jsonb("validation"),
  /** Варианты для типа select: ["option1", "option2"] */
  options: jsonb("options"),
});
```

### Валидация при записи

```typescript
// Валидатор типов при записи в таблицу
function validateColumnValue(value: string, column: BotTableColumn): ValidationResult {
  switch (column.columnType) {
    case 'number':
      if (isNaN(Number(value))) return { valid: false, error: `"${value}" не является числом` };
      if (column.validation?.min && Number(value) < column.validation.min)
        return { valid: false, error: `Значение меньше минимума (${column.validation.min})` };
      if (column.validation?.max && Number(value) > column.validation.max)
        return { valid: false, error: `Значение больше максимума (${column.validation.max})` };
      return { valid: true };

    case 'boolean':
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase()))
        return { valid: false, error: `"${value}" не является boolean` };
      return { valid: true };

    case 'timestamp':
      if (isNaN(Date.parse(value)))
        return { valid: false, error: `"${value}" не является датой` };
      return { valid: true };

    case 'formula':
      return { valid: false, error: 'Нельзя записывать в вычисляемую колонку' };

    case 'autoincrement':
      return { valid: false, error: 'Нельзя записывать в автоинкремент колонку' };

    case 'select':
      if (column.options && !column.options.includes(value))
        return { valid: false, error: `"${value}" не входит в допустимые значения` };
      return { valid: true };

    default:
      return { valid: true };
  }
}
```

### UI: Создание колонки с типом

```
┌─────────────────────────────────────────┐
│  Новая колонка                          │
├─────────────────────────────────────────┤
│  Название: [balance              ]      │
│                                         │
│  Тип: [🔢 Число          ▼]            │
│       ┌──────────────────────┐          │
│       │ 📝 Текст             │          │
│       │ 🔢 Число             │ ←        │
│       │ ✅ Да/Нет            │          │
│       │ 📅 Дата              │          │
│       │ 🧮 Формула           │          │
│       │ 🔄 Автоинкремент     │          │
│       │ 📌 Выбор из списка   │          │
│       └──────────────────────┘          │
│                                         │
│  По умолчанию: [0                ]      │
│  Мин: [0     ]  Макс: [999999   ]      │
│                                         │
│  [Создать]  [Отмена]                    │
└─────────────────────────────────────────┘
```

---

## 4. Математика в таблицах (формулы)

### Концепция

Тип колонки `formula` позволяет задать выражение, которое вычисляется на основе других колонок **той же строки**.

### Синтаксис формул

```
=<выражение>
```

Где `<выражение>` может содержать:
- Имена колонок: `price`, `quantity`, `base_damage`
- Арифметику: `+`, `-`, `*`, `/`, `%`, `^` (степень)
- Сравнения: `>`, `<`, `>=`, `<=`, `==`, `!=`
- Логику: `and`, `or`, `not`
- Функции: `min()`, `max()`, `abs()`, `round()`, `floor()`, `ceil()`
- Условия: `if(condition, then, else)`
- Строковые: `concat()`, `upper()`, `lower()`, `len()`
- Временные: `now()`, `days_between()`, `hours_between()`

### Ссылки на колонки

Формулы ссылаются на колонки **по имени** (не по ID):

```
=price * quantity
=base_damage - enemy_armor
=level ^ 2 * 100
```

При переименовании колонки — формулы обновляются автоматически.

### Два режима вычисления

| Режим | Когда вычисляется | Хранится | Индексируемо | Ограничения |
|-------|-------------------|----------|--------------|-------------|
| **STORED** | При записи/обновлении | Да | Да | Только колонки той же строки |
| **VIRTUAL** | При чтении | Нет | Нет | Может ссылаться на другие таблицы |

**STORED** (PostgreSQL Generated Column):
```sql
-- Формула: =price * quantity
ALTER TABLE bot_table_rows
ADD COLUMN col_235_num NUMERIC
GENERATED ALWAYS AS (
  (data->>'231')::NUMERIC * (data->>'232')::NUMERIC
) STORED;
```

**VIRTUAL** (вычисляется в Python при чтении):
```python
# Формула: =price * quantity
def compute_formula(row_data, columns, formula):
    # Подставляем значения колонок
    context = {}
    for col in columns:
        val = row_data.get(str(col['id']), '0')
        context[col['name']] = float(val) if is_number(val) else val
    return eval_safe(formula, context)
```

### Агрегатные функции (по всей колонке)

Помимо формул на уровне строки, поддерживаются агрегатные функции по всей колонке:

| Функция | Описание | Пример |
|---------|----------|--------|
| `SUM(col)` | Сумма всех значений | `SUM(balance)` |
| `AVG(col)` | Среднее | `AVG(score)` |
| `COUNT(col)` | Количество непустых | `COUNT(email)` |
| `MIN(col)` | Минимум | `MIN(price)` |
| `MAX(col)` | Максимум | `MAX(damage)` |
| `COUNT_IF(col, cond)` | Количество по условию | `COUNT_IF(status, "active")` |

Агрегатные функции **не могут** быть в generated columns — вычисляются при чтении.

### VLOOKUP — ссылки на другие таблицы

```
=LOOKUP(таблица, колонка_поиска, значение_поиска, колонка_результата)
```

Пример:
```
=LOOKUP(items, id, item_id, name)
```
→ "Найди в таблице `items` строку где `id` = значение моего `item_id`, верни `name`"

---

## 5. Примеры формул (25 штук)

### 🎮 Игровые формулы

| # | Название | Формула | Описание |
|---|----------|---------|----------|
| 1 | Урон | `=attack - enemy_defense` | Чистый урон после брони |
| 2 | Крит. урон | `=damage * crit_multiplier` | Урон с критическим множителем |
| 3 | XP до уровня | `=level ^ 2 * 100` | Прогрессия опыта (квадратичная) |
| 4 | Цена предмета | `=base_price * rarity_mult` | Цена зависит от редкости |
| 5 | HP после боя | `=max(hp - damage_taken, 0)` | HP не может быть отрицательным |
| 6 | Шанс крита | `=min(agility / 10, 75)` | Крит от ловкости, макс 75% |
| 7 | Скорость атаки | `=1 / (weapon_delay * (1 - haste / 100))` | С учётом ускорения |
| 8 | Уровень угрозы | `=attack * hp / 1000` | Комбинированный рейтинг |
| 9 | Стоимость улучшения | `=base_cost * 1.5 ^ upgrade_level` | Экспоненциальный рост цены |
| 10 | Энергия восстановления | `=max_energy * regen_rate / 100` | Реген в единицу времени |

### 💼 Бизнес-формулы

| # | Название | Формула | Описание |
|---|----------|---------|----------|
| 11 | Итого | `=price * quantity` | Сумма позиции |
| 12 | Скидка | `=price * discount_percent / 100` | Размер скидки |
| 13 | Итого со скидкой | `=price * quantity * (1 - discount / 100)` | Финальная сумма |
| 14 | НДС | `=subtotal * 0.2` | 20% НДС |
| 15 | Маржа | `=sell_price - buy_price` | Прибыль с единицы |
| 16 | Маржинальность % | `=(sell_price - buy_price) / sell_price * 100` | Процент маржи |
| 17 | Комиссия | `=if(amount > 10000, amount * 0.01, amount * 0.02)` | Прогрессивная комиссия |
| 18 | Бонус | `=if(sales > target, (sales - target) * bonus_rate, 0)` | Бонус за перевыполнение |

### 📈 Аналитические формулы

| # | Название | Формула | Описание |
|---|----------|---------|----------|
| 19 | Конверсия | `=purchases / visits * 100` | CR в процентах |
| 20 | ARPU | `=revenue / users` | Средний доход на пользователя |
| 21 | LTV | `=arpu * avg_lifetime_months` | Lifetime Value |
| 22 | ROI | `=(revenue - cost) / cost * 100` | Возврат инвестиций |
| 23 | Рост % | `=(current - previous) / previous * 100` | Процент роста |

### ⏱️ Временные формулы

| # | Название | Формула | Описание |
|---|----------|---------|----------|
| 24 | Дней с регистрации | `=days_between(created_at, now())` | Возраст аккаунта |
| 25 | Часов до события | `=hours_between(now(), event_time)` | Обратный отсчёт |

### 🔗 Формулы со ссылками (LOOKUP)

| # | Название | Формула | Описание |
|---|----------|---------|----------|
| 26 | Имя предмета | `=LOOKUP(items, id, item_id, name)` | Название из справочника |
| 27 | Цена из каталога | `=LOOKUP(catalog, sku, product_sku, price)` | Цена из каталога |

---

## 6. Архитектура реализации

### Вариант A: Generated Columns (PostgreSQL)

```
┌─────────────────────────────────────────────────────────────┐
│                    bot_table_rows                            │
├─────────────────────────────────────────────────────────────┤
│ id │ table_id │ row_index │ data (JSONB)      │ col_231_num │
│    │          │           │                   │ (GENERATED) │
├────┼──────────┼───────────┼───────────────────┼─────────────┤
│ 1  │ 42       │ 0         │ {"231":"500",...}  │ 500         │
│ 2  │ 42       │ 1         │ {"231":"1200",...} │ 1200        │
│ 3  │ 42       │ 2         │ {"231":"50",...}   │ 50          │
└────┴──────────┴───────────┴───────────────────┴─────────────┘
                                                  ↑
                                          B-tree индекс
                                          Мгновенный поиск
```

**Плюсы:**
- Максимальная производительность чтения
- Индексируемость (B-tree, partial indexes)
- Автоматическое обновление при изменении JSONB
- Нулевая стоимость на уровне приложения
- Гарантия консистентности (PostgreSQL)

**Минусы:**
- Требует ALTER TABLE для каждой новой типизированной колонки
- Нельзя использовать подзапросы в выражении
- Нельзя ссылаться на другие строки/таблицы
- Миграция при изменении формулы (DROP + ADD)
- Увеличивает размер таблицы на диске

### Вариант B: Вычисление при чтении (Application-level)

```
┌─────────────────────────────────────────────────────────────┐
│  Запрос данных                                              │
│                                                              │
│  1. SELECT * FROM bot_table_rows WHERE table_id = 42        │
│  2. Python/Node получает строки                             │
│  3. Для каждой строки:                                      │
│     - Загрузить формулы из bot_table_columns                │
│     - Вычислить каждую формульную колонку                   │
│     - Добавить результат в ответ                            │
│  4. Вернуть обогащённые данные                              │
└─────────────────────────────────────────────────────────────┘
```

**Плюсы:**
- Не требует ALTER TABLE
- Формулы могут ссылаться на другие таблицы (LOOKUP)
- Формулы могут использовать агрегатные функции
- Легко менять формулу (просто обновить запись в bot_table_columns)
- Не увеличивает размер БД

**Минусы:**
- Медленнее (вычисление на каждый запрос)
- Нельзя индексировать вычисленные значения
- Нельзя использовать в WHERE/ORDER BY на уровне SQL
- Нагрузка на приложение
- Нет гарантии консистентности

### Вариант C: Гибрид (рекомендуемый)

```
┌─────────────────────────────────────────────────────────────┐
│                    ГИБРИДНЫЙ ПОДХОД                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Простые формулы (только колонки той же строки):             │
│  → Generated Column (STORED)                                │
│  → Индексируемо, быстро                                    │
│  → Примеры: =price * qty, =attack - defense                │
│                                                              │
│  Сложные формулы (LOOKUP, агрегаты, now()):                 │
│  → Вычисление при чтении (Python)                           │
│  → Гибко, но медленнее                                     │
│  → Примеры: =LOOKUP(...), =SUM(col), =days_between(...)    │
│                                                              │
│  Решение принимается автоматически:                         │
│  - Парсим формулу                                           │
│  - Если только арифметика + колонки → STORED                │
│  - Если есть LOOKUP/агрегаты/now() → VIRTUAL                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Алгоритм выбора режима:**

```typescript
function determineFormulaMode(formula: string, columns: BotTableColumn[]): 'stored' | 'virtual' {
  const ast = parseFormula(formula);

  // Если формула содержит LOOKUP — virtual
  if (ast.hasFunction('LOOKUP')) return 'virtual';

  // Если формула содержит агрегатные функции — virtual
  if (ast.hasAnyFunction(['SUM', 'AVG', 'COUNT', 'MIN_ALL', 'MAX_ALL'])) return 'virtual';

  // Если формула содержит now() или другие volatile функции — virtual
  if (ast.hasFunction('now') || ast.hasFunction('days_between')) return 'virtual';

  // Если все ссылки — колонки той же таблицы — stored
  const refs = ast.getColumnReferences();
  const columnNames = columns.map(c => c.name);
  if (refs.every(ref => columnNames.includes(ref))) return 'stored';

  return 'virtual';
}
```

### Рекомендация

**Вариант C (Гибрид)** — лучший баланс между производительностью и гибкостью:

| Критерий | A (Generated) | B (App-level) | C (Гибрид) |
|----------|:---:|:---:|:---:|
| Производительность чтения | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| Гибкость формул | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Простота реализации | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Индексируемость | ⭐⭐⭐ | ❌ | ⭐⭐ |
| Поддержка LOOKUP | ❌ | ⭐⭐⭐ | ⭐⭐⭐ |
| Масштабируемость | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ |

---

## 7. Миграция существующих данных

### Поэтапный план миграции

```
┌─────────────────────────────────────────────────────────────┐
│  ФАЗА 1: Добавление метаданных (без изменения хранения)     │
├─────────────────────────────────────────────────────────────┤
│  1. ALTER TABLE bot_table_columns ADD column_type, formula   │
│  2. Все существующие колонки получают type = 'text'          │
│  3. UI показывает тип, но хранение не меняется              │
│  4. Валидация — только на уровне UI (мягкая)                │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  ФАЗА 2: Generated columns для числовых полей               │
├─────────────────────────────────────────────────────────────┤
│  1. Для каждой колонки с type='number':                     │
│     ALTER TABLE bot_table_rows ADD COLUMN col_{id}_num ...   │
│  2. Создать индексы на generated columns                    │
│  3. Обновить запросы чтения — использовать typed columns    │
│  4. Запись остаётся через JSONB (обратная совместимость)     │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  ФАЗА 3: Формулы                                            │
├─────────────────────────────────────────────────────────────┤
│  1. Парсер формул (AST)                                     │
│  2. Stored формулы → ALTER TABLE ADD GENERATED COLUMN        │
│  3. Virtual формулы → вычисление в Python шаблоне           │
│  4. UI редактор формул                                      │
└─────────────────────────────────────────────────────────────┘
```

### SQL миграции

```sql
-- Миграция 1: Добавление типизации в bot_table_columns
ALTER TABLE bot_table_columns
ADD COLUMN column_type VARCHAR(20) NOT NULL DEFAULT 'text';

ALTER TABLE bot_table_columns
ADD COLUMN default_value TEXT;

ALTER TABLE bot_table_columns
ADD COLUMN formula TEXT;

ALTER TABLE bot_table_columns
ADD COLUMN validation JSONB;

ALTER TABLE bot_table_columns
ADD COLUMN options JSONB;

-- Миграция 2: Пометить существующие числовые колонки
-- (на основе анализа данных)
UPDATE bot_table_columns
SET column_type = 'number'
WHERE id IN (
  SELECT DISTINCT c.id
  FROM bot_table_columns c
  JOIN bot_table_rows r ON r.table_id = c.table_id
  WHERE (r.data->>c.id::text) ~ '^\d+\.?\d*$'
  GROUP BY c.id
  HAVING COUNT(*) = COUNT(CASE WHEN (r.data->>c.id::text) ~ '^\d+\.?\d*$' THEN 1 END)
);
```

### Обратная совместимость

| Компонент | Изменение | Совместимость |
|-----------|-----------|---------------|
| Запись в JSONB | Без изменений | ✅ 100% |
| Чтение из JSONB | Без изменений (fallback) | ✅ 100% |
| bot_table шаблон (Python) | Добавляется вычисление формул | ✅ Старые боты работают |
| API /tables/:id/rows | Добавляется поле `computed` | ✅ Новое поле, старые не ломаются |
| UI таблиц | Показывает типы и формулы | ✅ Старые таблицы = text |

---

## 8. Влияние на UI

### Вкладка "Таблицы" — обновлённый вид

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Таблица: Инвентарь игрока                                       │
├──────────┬──────────┬──────────┬──────────┬─────────────────────────┤
│ 📝 name  │ 🔢 qty   │ 🔢 price │ 🧮 total │ 📅 added_at            │
│ (text)   │ (number) │ (number) │ (formula)│ (timestamp)            │
├──────────┼──────────┼──────────┼──────────┼─────────────────────────┤
│ Меч      │ 1        │ 500      │ 500      │ 2024-01-15 14:30       │
│ Зелье    │ 5        │ 50       │ 250      │ 2024-01-16 09:00       │
│ Щит      │ 1        │ 300      │ 300      │ 2024-01-16 10:15       │
├──────────┼──────────┼──────────┼──────────┼─────────────────────────┤
│          │          │          │ Σ 1050   │                         │
└──────────┴──────────┴──────────┴──────────┴─────────────────────────┘
  🧮 total = price * qty
```

### Редактирование формул

```
┌─────────────────────────────────────────────────────────────┐
│  Редактор формулы: total                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  = [price * qty                                    ]        │
│                                                              │
│  Доступные колонки:        Функции:                         │
│  ┌──────────────┐          ┌──────────────┐                 │
│  │ name (text)  │          │ min(a, b)    │                 │
│  │ qty (number) │ ←click   │ max(a, b)    │                 │
│  │ price (num)  │          │ abs(x)       │                 │
│  │ added_at     │          │ round(x, n)  │                 │
│  └──────────────┘          │ if(c, t, f)  │                 │
│                             │ concat(...)  │                 │
│                             └──────────────┘                 │
│                                                              │
│  Предпросмотр (строка 1): 500                               │
│  Режим: 🟢 STORED (индексируемо)                            │
│                                                              │
│  [Сохранить]  [Отмена]                                      │
└─────────────────────────────────────────────────────────────┘
```

### Вкладка "Аналитика" — быстрые агрегации

С типизированными колонками аналитика работает через SQL агрегаты напрямую:

```sql
-- Было (медленно): парсинг JSONB для каждой строки
SELECT
  COUNT(*) as total_rows,
  -- невозможно: SUM, AVG по JSONB строкам без cast

-- Стало (быстро): прямые агрегаты по generated columns
SELECT
  COUNT(*) as total_users,
  SUM(col_231_num) as total_balance,
  AVG(col_231_num) as avg_balance,
  MAX(col_232_num) as max_level,
  COUNT(CASE WHEN col_233_bool THEN 1 END) as active_users
FROM bot_table_rows
WHERE table_id = 42;
```

### Подсветка вычисляемых колонок

| Тип колонки | Цвет заголовка | Редактируемость | Иконка |
|-------------|---------------|-----------------|--------|
| text | Обычный | ✏️ Да | 📝 |
| number | Обычный | ✏️ Да | 🔢 |
| boolean | Обычный | ✏️ Да (чекбокс) | ✅ |
| timestamp | Обычный | ✏️ Да (datepicker) | 📅 |
| formula | Серый фон | 🔒 Нет | 🧮 |
| autoincrement | Серый фон | 🔒 Нет | 🔄 |

---

## 9. Влияние на ноды

### bot_table read — возвращает вычисленные значения

```python
# Текущий шаблон (упрощённо):
async def _bt_read(table_name, where, columns):
    rows = await db.fetch("SELECT data FROM bot_table_rows WHERE table_id = $1", table_id)
    return [row['data'] for row in rows]

# Новый шаблон:
async def _bt_read(table_name, where, columns):
    rows = await db.fetch("SELECT data FROM bot_table_rows WHERE table_id = $1", table_id)
    result = []
    for row in rows:
        row_data = row['data']
        # Вычисляем virtual формулы
        for col in formula_columns:
            if col['mode'] == 'virtual':
                row_data[str(col['id'])] = str(_eval_formula(col['formula'], row_data, columns))
        result.append(row_data)
    return result
```

### bot_table update — валидация типов

```python
# При обновлении — проверяем тип
async def _bt_update(table_name, where, updates):
    for col_name, value in updates.items():
        col = _get_column(table_name, col_name)
        if col['column_type'] == 'number' and not _is_number(value):
            raise ValueError(f"Колонка '{col_name}' ожидает число, получено: '{value}'")
        if col['column_type'] == 'formula':
            raise ValueError(f"Нельзя записывать в вычисляемую колонку '{col_name}'")
    # ... выполняем UPDATE
```

### bot_table insert — дефолтные значения и автоинкремент

```python
async def _bt_insert(table_name, row_data):
    columns = await _get_columns(table_name)

    for col in columns:
        col_id = str(col['id'])

        # Автоинкремент
        if col['column_type'] == 'autoincrement' and col_id not in row_data:
            max_val = await db.fetchval(
                "SELECT MAX((data->>$1)::INTEGER) FROM bot_table_rows WHERE table_id = $2",
                col_id, table_id
            )
            row_data[col_id] = str((max_val or 0) + 1)

        # Дефолтное значение
        elif col['default_value'] and col_id not in row_data:
            row_data[col_id] = col['default_value']

        # Валидация типа
        if col_id in row_data:
            _validate_type(col, row_data[col_id])

    await db.execute(
        "INSERT INTO bot_table_rows (table_id, row_index, data) VALUES ($1, $2, $3)",
        table_id, next_index, json.dumps(row_data)
    )
```

### Новые операции: aggregate

```json
{
  "type": "bot_table",
  "operation": "aggregate",
  "tableName": "orders",
  "aggregations": [
    { "function": "SUM", "column": "total", "alias": "revenue" },
    { "function": "COUNT", "column": "*", "alias": "order_count" },
    { "function": "AVG", "column": "total", "alias": "avg_order" }
  ],
  "where": [
    { "column": "status", "value": "completed" }
  ],
  "groupBy": "category",
  "saveResultTo": "stats"
}
```

Генерируемый SQL:
```sql
SELECT
  data->>'category_col_id' as category,
  SUM(col_total_num) as revenue,
  COUNT(*) as order_count,
  AVG(col_total_num) as avg_order
FROM bot_table_rows
WHERE table_id = $1
  AND data->>'status_col_id' = 'completed'
GROUP BY data->>'category_col_id';
```

---

## 10. Системная таблица "Пользователи"

### Концепция

Каждый бот автоматически получает системную таблицу `_users`, которая:
- Создаётся при первом запуске бота
- Содержит предустановленные колонки
- Позволяет добавлять пользовательские колонки
- Заменяет `user_data` JSONB для аналитики

### Структура системной таблицы

| Колонка | Тип | Описание | Системная |
|---------|-----|----------|-----------|
| telegram_id | number | Уникальный ID пользователя | ✅ |
| username | text | @username | ✅ |
| first_name | text | Имя | ✅ |
| last_name | text | Фамилия | ✅ |
| language_code | text | Язык (ru, en, ...) | ✅ |
| first_seen | timestamp | Первое взаимодействие | ✅ |
| last_seen | timestamp | Последнее взаимодействие | ✅ |
| interaction_count | number | Количество сообщений | ✅ |
| is_blocked | boolean | Заблокировал ли бота | ✅ |
| referral_source | text | Откуда пришёл | ✅ |
| credits | number | Баланс (пользовательская) | ❌ |
| level | number | Уровень (пользовательская) | ❌ |
| subscription_end | timestamp | Конец подписки (пользовательская) | ❌ |

### Автосоздание при запуске бота

```python
# В шаблоне бота — при старте
async def _ensure_users_table():
    """Создаёт системную таблицу _users если не существует"""
    table = await db.fetchrow(
        "SELECT id FROM bot_tables WHERE project_id = $1 AND name = '_users'",
        project_id
    )
    if not table:
        table_id = await db.fetchval(
            "INSERT INTO bot_tables (project_id, name) VALUES ($1, '_users') RETURNING id",
            project_id
        )
        # Создаём системные колонки
        system_columns = [
            ('telegram_id', 'number', 0),
            ('username', 'text', 1),
            ('first_name', 'text', 2),
            ('last_name', 'text', 3),
            ('language_code', 'text', 4),
            ('first_seen', 'timestamp', 5),
            ('last_seen', 'timestamp', 6),
            ('interaction_count', 'number', 7),
            ('is_blocked', 'boolean', 8),
            ('referral_source', 'text', 9),
        ]
        for name, col_type, pos in system_columns:
            await db.execute(
                """INSERT INTO bot_table_columns (table_id, name, position, column_type)
                   VALUES ($1, $2, $3, $4)""",
                table_id, name, pos, col_type
            )
```

### Автообновление при каждом сообщении

```python
async def _update_user_record(user: telegram.User):
    """Обновляет запись пользователя в _users при каждом взаимодействии"""
    users_table_id = await _get_users_table_id()
    columns = await _get_columns_map(users_table_id)

    # Ищем существующую запись
    existing = await db.fetchrow(
        "SELECT id, data FROM bot_table_rows WHERE table_id = $1 AND data->>$2 = $3",
        users_table_id, str(columns['telegram_id']), str(user.id)
    )

    now_str = datetime.utcnow().isoformat()

    if existing:
        # Обновляем last_seen и interaction_count
        data = existing['data']
        data[str(columns['last_seen'])] = now_str
        data[str(columns['interaction_count'])] = str(int(data.get(str(columns['interaction_count']), '0')) + 1)
        data[str(columns['username'])] = user.username or ''
        data[str(columns['first_name'])] = user.first_name or ''
        await db.execute(
            "UPDATE bot_table_rows SET data = $1 WHERE id = $2",
            json.dumps(data), existing['id']
        )
    else:
        # Создаём новую запись
        data = {
            str(columns['telegram_id']): str(user.id),
            str(columns['username']): user.username or '',
            str(columns['first_name']): user.first_name or '',
            str(columns['last_name']): user.last_name or '',
            str(columns['language_code']): user.language_code or '',
            str(columns['first_seen']): now_str,
            str(columns['last_seen']): now_str,
            str(columns['interaction_count']): '1',
            str(columns['is_blocked']): 'false',
        }
        next_index = await _get_next_row_index(users_table_id)
        await db.execute(
            "INSERT INTO bot_table_rows (table_id, row_index, data) VALUES ($1, $2, $3)",
            users_table_id, next_index, json.dumps(data)
        )
```

### Аналитика по системной таблице

```sql
-- Новые пользователи за последние 7 дней
SELECT COUNT(*)
FROM bot_table_rows
WHERE table_id = $users_table_id
  AND col_first_seen_ts > NOW() - INTERVAL '7 days';

-- Активные пользователи (DAU)
SELECT COUNT(*)
FROM bot_table_rows
WHERE table_id = $users_table_id
  AND col_last_seen_ts > NOW() - INTERVAL '1 day';

-- Retention: вернулись через 7 дней
SELECT COUNT(*)
FROM bot_table_rows
WHERE table_id = $users_table_id
  AND col_first_seen_ts < NOW() - INTERVAL '7 days'
  AND col_last_seen_ts > NOW() - INTERVAL '1 day';

-- Топ пользователей по взаимодействиям
SELECT data->>'first_name' as name, col_interaction_count_num as interactions
FROM bot_table_rows
WHERE table_id = $users_table_id
ORDER BY col_interaction_count_num DESC
LIMIT 10;
```

---

## 11. Производительность

### Бенчмарки: JSONB vs Typed Columns vs Generated Columns

**Условия теста:**
- PostgreSQL 15
- Таблица: 100,000 строк, 10 колонок
- 3 числовых колонки, 2 текстовых, 1 boolean, 1 timestamp

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Операция: SELECT WHERE number_col > 500                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  JSONB (без индекса):     ████████████████████████████████  320ms       │
│  JSONB (GIN индекс):     ████████████████████████          240ms       │
│  JSONB (expression idx): ████████                           80ms        │
│  Generated Column:        █                                  8ms        │
│                                                                          │
│  * GIN не помогает для range queries (>, <, BETWEEN)                    │
│  * Expression index помогает, но требует точного совпадения выражения    │
│  * Generated column + B-tree = оптимальная производительность            │
└─────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Операция: SUM(number_col) — 100,000 строк                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  JSONB + cast каждой строки: ████████████████████████████  450ms        │
│  Generated Column (SUM):     ██                             35ms        │
│                                                                          │
│  Ускорение: ~13x                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Операция: ORDER BY number_col DESC LIMIT 10                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  JSONB (full sort):       ████████████████████████████████  380ms       │
│  Generated + B-tree:      █                                  3ms        │
│                                                                          │
│  Ускорение: ~127x                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Операция: INSERT (запись одной строки)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  JSONB (без generated):   ██                                2ms         │
│  JSONB + 3 generated:     ███                               3ms         │
│  JSONB + 10 generated:    █████                             5ms         │
│                                                                          │
│  Overhead на запись: ~1ms на каждые 3-4 generated columns               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Стратегия индексирования

| Тип данных | Индекс | Когда использовать |
|------------|--------|-------------------|
| JSONB (весь) | GIN | Поиск по наличию ключа, @> оператор |
| JSONB (конкретный ключ) | Expression B-tree | Точное равенство по одному полю |
| Generated NUMERIC | B-tree | Range queries, сортировка, агрегаты |
| Generated TEXT | B-tree | Точное равенство, LIKE prefix% |
| Generated BOOLEAN | Partial index | WHERE col_bool = true |
| Generated TIMESTAMP | B-tree / BRIN | Временные диапазоны |

### Рекомендации по индексам

```sql
-- Partial index: только для конкретной таблицы
CREATE INDEX idx_table42_balance
ON bot_table_rows (col_231_num)
WHERE table_id = 42;

-- BRIN для временных данных (компактный, для больших таблиц)
CREATE INDEX idx_table42_created_brin
ON bot_table_rows USING BRIN (col_234_ts)
WHERE table_id = 42;

-- Составной индекс для частых запросов
CREATE INDEX idx_table42_active_balance
ON bot_table_rows (col_231_num DESC)
WHERE table_id = 42 AND col_233_bool = true;
```

### Когда НЕ создавать generated columns

| Ситуация | Причина |
|----------|---------|
| Таблица < 1000 строк | JSONB достаточно быстр |
| Колонка не используется в WHERE/ORDER | Нет выигрыша |
| Колонка типа JSON (вложенный объект) | Нельзя типизировать |
| Формула с LOOKUP/агрегатами | Невозможно в generated |
| Колонка редко читается | Overhead на запись не оправдан |

---

## 12. План реализации (фазы)

### Фаза 1: Типизация колонок в UI (2-3 недели)

**Цель:** Пользователь видит и выбирает типы колонок. Хранение не меняется.

| Задача | Компонент | Приоритет |
|--------|-----------|-----------|
| Миграция: добавить column_type в bot_table_columns | server/database | P0 |
| UI: dropdown выбора типа при создании колонки | client/components | P0 |
| UI: иконки типов в заголовках таблицы | client/components | P1 |
| Валидация типов при записи (мягкая, warning) | lib/templates | P1 |
| Дефолтные значения при insert | lib/templates | P2 |
| Автоинкремент (простой, на уровне приложения) | lib/templates | P2 |

**Результат:** Пользователь может указать тип колонки. Данные валидируются при записи. Хранение в JSONB не меняется.

### Фаза 2: Generated columns для числовых полей (2-3 недели)

**Цель:** Числовые колонки получают generated columns и индексы. Аналитика ускоряется.

| Задача | Компонент | Приоритет |
|--------|-----------|-----------|
| Сервис создания generated columns | server/services | P0 |
| При смене типа на number → ALTER TABLE | server/services | P0 |
| Создание B-tree индексов | server/services | P1 |
| Обновление запросов чтения (использовать typed cols) | lib/templates | P1 |
| Обновление аналитики (прямые агрегаты) | server/analytics | P1 |
| Мониторинг: размер таблицы, количество generated cols | server/admin | P2 |

**Результат:** Числовые колонки индексируемы. WHERE, ORDER BY, SUM/AVG работают через индексы.

### Фаза 3: Формулы (3-4 недели)

**Цель:** Пользователь может создавать вычисляемые колонки с формулами.

| Задача | Компонент | Приоритет |
|--------|-----------|-----------|
| Парсер формул (tokenizer + AST) | lib/formula-parser | P0 |
| Определение режима (stored vs virtual) | lib/formula-parser | P0 |
| Stored формулы → ALTER TABLE ADD GENERATED | server/services | P0 |
| Virtual формулы → вычисление в Python шаблоне | lib/templates | P0 |
| UI: редактор формул с автодополнением | client/components | P1 |
| UI: предпросмотр результата формулы | client/components | P1 |
| Функции: min, max, abs, round, if | lib/formula-parser | P1 |
| LOOKUP (ссылки на другие таблицы) | lib/templates | P2 |
| Агрегатные функции (SUM, AVG по колонке) | lib/templates | P2 |

**Результат:** Полноценные формулы. Простые — stored (быстрые), сложные — virtual (гибкие).

### Фаза 4: Системная таблица "Пользователи" (2 недели)

**Цель:** Каждый бот автоматически получает таблицу _users с аналитикой.

| Задача | Компонент | Приоритет |
|--------|-----------|-----------|
| Автосоздание _users при запуске бота | lib/templates | P0 |
| Автообновление записи при каждом сообщении | lib/templates | P0 |
| Generated columns для числовых полей _users | server/services | P1 |
| UI: специальный вид для системной таблицы | client/components | P1 |
| Аналитика: DAU, WAU, MAU из _users | server/analytics | P1 |
| Аналитика: retention, churn | server/analytics | P2 |

**Результат:** Аналитика пользователей работает из коробки без настройки.

### Фаза 5: Миграция аналитики (1-2 недели)

**Цель:** Вся аналитика переходит на typed columns. Удаление legacy JSONB парсинга.

| Задача | Компонент | Приоритет |
|--------|-----------|-----------|
| Миграция существующих аналитических запросов | server/analytics | P0 |
| Dashboard: графики на основе typed columns | client/analytics | P1 |
| Удаление legacy JSONB-based аналитики | server/analytics | P2 |
| Документация для пользователей | docs | P2 |

**Результат:** Аналитика работает в 10-100x быстрее. Legacy код удалён.

### Общая timeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Неделя:  1   2   3   4   5   6   7   8   9  10  11  12  13  14       │
├─────────────────────────────────────────────────────────────────────────┤
│  Фаза 1:  ████████████                                                 │
│  Фаза 2:              ████████████                                      │
│  Фаза 3:                          ████████████████                      │
│  Фаза 4:                                          ████████             │
│  Фаза 5:                                                  ████████     │
├─────────────────────────────────────────────────────────────────────────┤
│  Итого: ~14 недель (3.5 месяца)                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Сравнение с конкурентами

### Airtable

| Возможность | Airtable | Наша платформа (после) |
|-------------|----------|----------------------|
| Типы колонок | ✅ 20+ типов | ✅ 8 типов (расширяемо) |
| Формулы | ✅ Богатый синтаксис | ✅ Базовый + расширяемый |
| Связи между таблицами | ✅ Linked Records | ✅ LOOKUP |
| Rollups (агрегаты по связям) | ✅ | ⚠️ Частично (SUM/AVG) |
| Автоматизации | ✅ Automations | ✅ Ноды бота |
| API | ✅ REST API | ✅ Через ноды |
| Цена | $20/user/month | Включено в платформу |

**Наше преимущество:** Формулы интегрированы с логикой бота. Airtable — отдельный продукт, требует интеграции.

### Notion Databases

| Возможность | Notion | Наша платформа (после) |
|-------------|--------|----------------------|
| Типы свойств | ✅ 15+ типов | ✅ 8 типов |
| Формулы | ✅ (ограниченные) | ✅ Сопоставимо |
| Rollups | ✅ | ⚠️ Частично |
| Relations | ✅ | ✅ LOOKUP |
| Views (фильтры, сортировка) | ✅ | ⚠️ Базовые |
| Интеграция с ботами | ❌ Через API | ✅ Нативная |

**Наше преимущество:** Данные и логика бота в одном месте. Notion требует внешней интеграции через API.

### Google Sheets

| Возможность | Google Sheets | Наша платформа (после) |
|-------------|--------------|----------------------|
| Формулы | ✅ 400+ функций | ✅ ~30 функций |
| Ячеечные формулы | ✅ Любая ячейка | ❌ Только колонки |
| Типы данных | ⚠️ Неявные | ✅ Явные |
| Производительность | ⚠️ Медленно на >10k строк | ✅ PostgreSQL, индексы |
| Интеграция с ботами | ❌ Через Google API | ✅ Нативная |
| Реальное время | ✅ | ⚠️ При обновлении |

**Наше преимущество:** Производительность на больших данных. Google Sheets тормозит на 10k+ строк. У нас — индексы и generated columns.

### Salebot (прямой конкурент)

| Возможность | Salebot | Наша платформа (после) |
|-------------|---------|----------------------|
| Переменные | ✅ Глобальные/локальные | ✅ + таблицы |
| Калькулятор | ✅ Базовая арифметика | ✅ Формулы в колонках |
| Таблицы | ❌ Нет | ✅ Полноценные |
| Типизация | ❌ Всё строки | ✅ 8 типов |
| Формулы в таблицах | ❌ | ✅ |
| Аналитика по данным | ⚠️ Базовая | ✅ SQL агрегаты |
| Связи между таблицами | ❌ | ✅ LOOKUP |

**Наше преимущество:** Salebot не имеет таблиц вообще. Мы предлагаем полноценную систему данных с типизацией, формулами и аналитикой — это уникальное конкурентное преимущество.

---

## 14. Парсер формул — техническая реализация

### Грамматика (BNF)

```
expression  := term (('+' | '-') term)*
term        := factor (('*' | '/' | '%') factor)*
factor      := base ('^' factor)?
base        := NUMBER | STRING | BOOLEAN | IDENTIFIER | function_call | '(' expression ')'
function_call := IDENTIFIER '(' (expression (',' expression)*)? ')'
IDENTIFIER  := [a-zA-Z_][a-zA-Z0-9_]*
NUMBER      := [0-9]+('.'[0-9]+)?
STRING      := '"' [^"]* '"'
BOOLEAN     := 'true' | 'false'
```

### Токенизация

```typescript
type TokenType =
  | 'NUMBER' | 'STRING' | 'BOOLEAN' | 'IDENTIFIER'
  | 'PLUS' | 'MINUS' | 'MULTIPLY' | 'DIVIDE' | 'MODULO' | 'POWER'
  | 'LPAREN' | 'RPAREN' | 'COMMA'
  | 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ' | 'NEQ'
  | 'AND' | 'OR' | 'NOT'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// Пример: "price * quantity * (1 - discount / 100)"
// Токены:
// [IDENTIFIER:price, MULTIPLY, IDENTIFIER:quantity, MULTIPLY,
//  LPAREN, NUMBER:1, MINUS, IDENTIFIER:discount, DIVIDE, NUMBER:100, RPAREN]
```

### AST (Abstract Syntax Tree)

```typescript
type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'identifier'; name: string }
  | { type: 'binary'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'unary'; op: string; operand: ASTNode }
  | { type: 'call'; name: string; args: ASTNode[] };

// Пример AST для "price * quantity":
// {
//   type: 'binary',
//   op: '*',
//   left: { type: 'identifier', name: 'price' },
//   right: { type: 'identifier', name: 'quantity' }
// }
```

### Компиляция в SQL (для STORED формул)

```typescript
function compileToSQL(ast: ASTNode, columnMap: Map<string, number>): string {
  switch (ast.type) {
    case 'number':
      return ast.value.toString();
    case 'identifier':
      const colId = columnMap.get(ast.name);
      return `(data->>'${colId}')::NUMERIC`;
    case 'binary':
      const left = compileToSQL(ast.left, columnMap);
      const right = compileToSQL(ast.right, columnMap);
      if (ast.op === '^') return `POWER(${left}, ${right})`;
      return `(${left} ${ast.op} ${right})`;
    case 'call':
      const args = ast.args.map(a => compileToSQL(a, columnMap));
      switch (ast.name) {
        case 'min': return `LEAST(${args.join(', ')})`;
        case 'max': return `GREATEST(${args.join(', ')})`;
        case 'abs': return `ABS(${args[0]})`;
        case 'round': return `ROUND(${args[0]}, ${args[1] || '0'})`;
        case 'floor': return `FLOOR(${args[0]})`;
        case 'ceil': return `CEIL(${args[0]})`;
        case 'if': return `CASE WHEN ${args[0]} THEN ${args[1]} ELSE ${args[2]} END`;
        default: throw new Error(`Неизвестная функция: ${ast.name}`);
      }
    default:
      throw new Error(`Неподдерживаемый тип узла: ${ast.type}`);
  }
}

// Пример:
// Формула: "price * quantity * (1 - discount / 100)"
// SQL: "((data->>'231')::NUMERIC * (data->>'232')::NUMERIC * (1 - (data->>'233')::NUMERIC / 100))"
```

### Компиляция в Python (для VIRTUAL формул)

```typescript
function compileToPython(ast: ASTNode, columnMap: Map<string, number>): string {
  switch (ast.type) {
    case 'number':
      return ast.value.toString();
    case 'identifier':
      const colId = columnMap.get(ast.name);
      return `float(_row.get('${colId}', '0'))`;
    case 'binary':
      const left = compileToPython(ast.left, columnMap);
      const right = compileToPython(ast.right, columnMap);
      if (ast.op === '^') return `(${left} ** ${right})`;
      return `(${left} ${ast.op} ${right})`;
    case 'call':
      const args = ast.args.map(a => compileToPython(a, columnMap));
      switch (ast.name) {
        case 'min': return `min(${args.join(', ')})`;
        case 'max': return `max(${args.join(', ')})`;
        case 'abs': return `abs(${args[0]})`;
        case 'round': return `round(${args[0]}, ${args[1] || '0'})`;
        case 'if': return `(${args[1]} if ${args[0]} else ${args[2]})`;
        default: throw new Error(`Неизвестная функция: ${ast.name}`);
      }
    default:
      throw new Error(`Неподдерживаемый тип узла: ${ast.type}`);
  }
}
```

---

## 15. Безопасность формул

### Защита от инъекций

```typescript
// ЗАПРЕЩЕНО в формулах:
const FORBIDDEN_PATTERNS = [
  /import\s/,        // import модулей
  /require\s*\(/,    // require
  /eval\s*\(/,       // eval
  /exec\s*\(/,       // exec
  /__\w+__/,         // dunder methods
  /os\./,            // доступ к ОС
  /subprocess/,      // subprocess
  /open\s*\(/,       // открытие файлов
  /lambda/,          // lambda
  /class\s/,         // определение классов
];

// Whitelist функций
const ALLOWED_FUNCTIONS = new Set([
  'min', 'max', 'abs', 'round', 'floor', 'ceil',
  'if', 'concat', 'upper', 'lower', 'len',
  'now', 'days_between', 'hours_between',
  'SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'COUNT_IF',
  'LOOKUP',
]);
```

### Лимиты

| Параметр | Лимит | Причина |
|----------|-------|---------|
| Длина формулы | 2000 символов | Предотвращение abuse |
| Глубина вложенности | 10 уровней | Предотвращение stack overflow |
| Количество LOOKUP в формуле | 3 | Производительность |
| Количество формульных колонок в таблице | 20 | Размер generated columns |
| Время вычисления virtual формулы | 100ms | Таймаут |

---

## 16. Диаграмма общей архитектуры

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              КЛИЕНТ (React)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Таблица UI   │  │ Редактор     │  │ Аналитика    │  │ Нода         │   │
│  │ (типы,       │  │ формул       │  │ (графики,    │  │ bot_table    │   │
│  │  формулы)    │  │ (autocomplete│  │  агрегаты)   │  │ (настройка)  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │                  │           │
└─────────┼──────────────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              СЕРВЕР (Node.js)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Tables API   │  │ Formula      │  │ Analytics    │  │ Code Gen     │   │
│  │ (CRUD +      │  │ Service      │  │ Service      │  │ (lib/        │   │
│  │  validation) │  │ (parse,      │  │ (aggregates, │  │  templates)  │   │
│  │              │  │  compile)    │  │  dashboards) │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │                  │           │
│         │         ┌────────┴────────┐         │                  │           │
│         │         │  Formula Parser │         │                  │           │
│         │         │  ┌───────────┐  │         │                  │           │
│         │         │  │ Tokenizer │  │         │                  │           │
│         │         │  │ Parser    │  │         │                  │           │
│         │         │  │ Compiler  │  │         │                  │           │
│         │         │  │ (SQL/Py)  │  │         │                  │           │
│         │         │  └───────────┘  │         │                  │           │
│         │         └────────┬────────┘         │                  │           │
│         │                  │                  │                  │           │
└─────────┼──────────────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  bot_table_rows                                                      │    │
│  │  ┌────────┬──────────┬───────────┬──────────────┬─────────────────┐ │    │
│  │  │ id     │ table_id │ row_index │ data (JSONB) │ col_*_* (GEN)   │ │    │
│  │  └────────┴──────────┴───────────┴──────────────┴─────────────────┘ │    │
│  │                                                    ↑                  │    │
│  │                                            B-tree indexes             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  bot_table_columns                                                   │    │
│  │  ┌────┬──────────┬──────┬──────────┬─────────────┬─────────┬─────┐ │    │
│  │  │ id │ table_id │ name │ position │ column_type │ formula │ ... │ │    │
│  │  └────┴──────────┴──────┴──────────┴─────────────┴─────────┴─────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. Примеры полных сценариев

### Сценарий 1: Игровой магазин

**Таблица `shop_items`:**

| 🔄 id | 📝 name | 🔢 base_price | 🔢 rarity_mult | 🧮 final_price | 🔢 stock |
|--------|---------|---------------|----------------|----------------|----------|
| 1 | Меч огня | 100 | 2.5 | 250 | 10 |
| 2 | Щит льда | 80 | 1.8 | 144 | 5 |
| 3 | Зелье HP | 20 | 1.0 | 20 | 99 |

**Формулы:**
- `id`: autoincrement
- `final_price`: `=base_price * rarity_mult`

**Нода bot_table в сценарии:**
```json
{
  "type": "bot_table",
  "operation": "read",
  "tableName": "shop_items",
  "where": [{ "column": "stock", "operator": "greater", "value": "0" }],
  "orderBy": { "column": "final_price", "direction": "ASC" },
  "saveResultTo": "available_items"
}
```

### Сценарий 2: CRM с расчётом LTV

**Таблица `_users` (системная + пользовательские колонки):**

| 🔢 telegram_id | 📝 first_name | 🔢 total_spent | 🔢 orders_count | 🧮 avg_order | 🧮 ltv_score |
|----------------|---------------|----------------|-----------------|--------------|--------------|
| 123456 | Алексей | 15000 | 12 | 1250 | 37500 |
| 789012 | Мария | 8000 | 5 | 1600 | 20000 |

**Формулы:**
- `avg_order`: `=if(orders_count > 0, total_spent / orders_count, 0)`
- `ltv_score`: `=avg_order * 30` (прогноз на 30 заказов)

**Аналитический запрос:**
```json
{
  "type": "bot_table",
  "operation": "aggregate",
  "tableName": "_users",
  "aggregations": [
    { "function": "AVG", "column": "ltv_score", "alias": "avg_ltv" },
    { "function": "SUM", "column": "total_spent", "alias": "total_revenue" },
    { "function": "COUNT", "column": "*", "alias": "total_users" }
  ],
  "saveResultTo": "crm_stats"
}
```

### Сценарий 3: Космическая игра (прогрессия)

**Таблица `planets`:**

| 📝 name | 🔢 level | 🧮 upgrade_cost | 🧮 income_per_hour | 🧮 roi_hours |
|---------|----------|-----------------|--------------------|--------------| 
| Земля | 5 | 3125 | 50 | 62.5 |
| Марс | 3 | 675 | 30 | 22.5 |
| Юпитер | 1 | 100 | 10 | 10.0 |

**Формулы:**
- `upgrade_cost`: `=100 * level ^ 2.5` (экспоненциальный рост)
- `income_per_hour`: `=level * 10` (линейный доход)
- `roi_hours`: `=upgrade_cost / income_per_hour` (окупаемость)

---

## 18. API эндпоинты (новые/изменённые)

### Обновление колонки (добавление типа)

```
PATCH /api/tables/:tableId/columns/:columnId
Body: {
  "columnType": "number",
  "defaultValue": "0",
  "validation": { "min": 0, "max": 999999 }
}
```

### Создание формульной колонки

```
POST /api/tables/:tableId/columns
Body: {
  "name": "total",
  "columnType": "formula",
  "formula": "=price * quantity"
}
Response: {
  "id": 235,
  "name": "total",
  "columnType": "formula",
  "formula": "=price * quantity",
  "formulaMode": "stored",  // или "virtual"
  "position": 4
}
```

### Агрегация

```
POST /api/tables/:tableId/aggregate
Body: {
  "aggregations": [
    { "function": "SUM", "column": "balance" },
    { "function": "AVG", "column": "level" },
    { "function": "COUNT", "column": "*" }
  ],
  "where": [
    { "column": "is_active", "operator": "equals", "value": "true" }
  ],
  "groupBy": "region"
}
Response: {
  "results": [
    { "region": "EU", "sum_balance": 150000, "avg_level": 12.5, "count": 340 },
    { "region": "US", "sum_balance": 230000, "avg_level": 15.2, "count": 520 }
  ]
}
```

### Валидация формулы

```
POST /api/tables/:tableId/validate-formula
Body: {
  "formula": "=price * quantity * (1 - discount / 100)"
}
Response: {
  "valid": true,
  "mode": "stored",
  "referencedColumns": ["price", "quantity", "discount"],
  "resultType": "number",
  "preview": { "row_0": 450, "row_1": 1200, "row_2": 75 }
}
```

---

## 19. Интеграция с существующими фичами

### Связь с inline-expressions

Формулы в таблицах используют тот же движок `_eval_expr`, что и inline expressions в сообщениях:

```
Таблица: =price * quantity          → тот же парсер
Сообщение: {=credits - price}       → тот же парсер
Переменная: mode=expression         → тот же парсер
```

Единый парсер = единая кодовая база, единые тесты, единое поведение.

### Связь с set_variable (mode=expression)

```json
// set_variable с формулой из таблицы
{
  "type": "set_variable",
  "variable": "player_damage",
  "mode": "expression",
  "value": "{table_result.attack} - {enemy.defense}"
}
```

Данные из таблицы (с вычисленными формулами) доступны в переменных бота.

### Связь с аналитикой

```
┌─────────────────────────────────────────────────────────────┐
│  Текущая аналитика:                                         │
│  - Считает пользователей из user_data (JSONB)               │
│  - Медленно, ограниченно                                    │
│                                                              │
│  Новая аналитика:                                           │
│  - Считает из _users таблицы (typed columns)                │
│  - SQL агрегаты напрямую                                    │
│  - DAU/WAU/MAU за O(log n)                                  │
│  - Retention, cohorts, funnels                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 20. Открытые вопросы

| # | Вопрос | Варианты | Решение |
|---|--------|----------|---------|
| 1 | Максимум generated columns на таблицу? | 10 / 20 / без лимита | 20 (PostgreSQL справится) |
| 2 | Формулы с ошибкой — что показывать? | NULL / #ERROR / 0 | #ERROR в UI, NULL в данных |
| 3 | Циклические зависимости формул? | Запретить / Детектировать | Детектировать при сохранении |
| 4 | Переименование колонки — обновлять формулы? | Да / Нет | Да, автоматически |
| 5 | Удаление колонки, на которую ссылается формула? | Запретить / Warning | Warning + пометить формулу как broken |
| 6 | Формулы в системной таблице _users? | Да / Нет | Да, пользовательские колонки |
| 7 | Экспорт таблицы в CSV — включать формулы? | Значения / Формулы / Оба | Значения (как Excel) |
| 8 | Права доступа к формулам? | Все / Только владелец | Все (в рамках проекта) |

---

## 21. Метрики успеха

| Метрика | Текущее | Цель | Как измерять |
|---------|---------|------|--------------|
| Время агрегации (10k строк) | ~120ms | <10ms | SQL EXPLAIN ANALYZE |
| Время сортировки (10k строк) | ~85ms | <5ms | SQL EXPLAIN ANALYZE |
| % таблиц с типизацией | 0% | >50% | Мониторинг column_type |
| % таблиц с формулами | 0% | >20% | Мониторинг formula != NULL |
| Использование _users | 0% | >80% ботов | Мониторинг |
| Ошибки типизации при записи | N/A | <5% записей | Логирование валидации |

---

## Заключение

Типизированные колонки и математика в таблицах — это фундаментальное улучшение платформы, которое:

1. **Ускоряет** аналитику в 10-100x за счёт generated columns и индексов
2. **Упрощает** разработку ботов — формулы вместо цепочек нод
3. **Повышает** надёжность — валидация типов предотвращает ошибки
4. **Создаёт** конкурентное преимущество — ни один конструктор ботов не предлагает такого уровня работы с данными
5. **Масштабируется** — гибридный подход (stored + virtual) покрывает все сценарии

Реализация поэтапная (5 фаз, ~14 недель), каждая фаза приносит ценность независимо от следующих.
