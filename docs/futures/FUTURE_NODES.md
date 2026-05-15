# Будущие ноды конструктора

Документ описывает планируемые ноды и расширения для добавления в конструктор.
Приоритет: 🔴 высокий → 🟡 средний → 🟢 низкий

---

## 🔴 Высокий приоритет

### `schedule_trigger`
**Запуск цепочки по расписанию без участия пользователя.**

Поля:
- `intervalMinutes` / `intervalHours` — интервал запуска
- `cronExpression` — cron-выражение для продвинутых (например `0 9 * * *`)
- `autoTransitionTo` — ID следующей ноды

Пример использования:
```
schedule_trigger (каждые 5 минут)
  → http_request (получить курсы)
    → condition (курс изменился?)
      → broadcast (уведомить подписчиков)
```

Реализация: `APScheduler` + `asyncio.gather` в `main()`.
Сложность: средняя (~150 строк в генераторе).

---

### `webhook_trigger`
**Запуск цепочки при входящем HTTP запросе от внешней системы.**

Поля:
- `method` — GET / POST
- `path` — путь эндпоинта, например `/notify`
- `saveBodyTo` — переменная для тела запроса
- `saveHeadersTo` — переменная для заголовков (опционально)
- `secretToken` — токен для верификации запроса
- `autoTransitionTo` — ID следующей ноды

Пример использования:
```
webhook_trigger (POST /payment)
  → set_variable (извлечь user_id, amount из {webhook_data})
    → psql_query (обновить баланс)
      → message (уведомить пользователя)
```

Реализация: `aiohttp.web` сервер на отдельном порту внутри `bot.py`.
Сложность: средняя (~100 строк).

---

### `api_response`
**Ответить на входящий webhook запрос. Пара к `webhook_trigger`.**

Поля:
- `statusCode` — HTTP статус ответа (200, 400, 500)
- `body` — тело ответа, поддерживает `{переменные}`
- `contentType` — `application/json` / `text/plain`

Сложность: низкая (~30 строк).

---

### ~~`loop`~~ ✅ РЕАЛИЗОВАНО
**Цикл по массиву — выполнить цепочку для каждого элемента.**

> Нода реализована и доступна в конструкторе.

Поля:
- `sourceVariable` — переменная с массивом
- `itemVariable` — имя переменной для текущего элемента
- `indexVariable` — имя переменной для индекса (опционально)
- `autoTransitionTo` — ID ноды-тела цикла
- `afterLoopTo` — ID ноды после завершения цикла

---

## 🟡 Средний приоритет

### `json_extract`
**Извлечение вложенного поля из JSON по динамическому пути.**

Поля:
- `sourceVariable` — переменная с JSON объектом
- `path` — путь с поддержкой переменных, например `exchange.{from_id}.to.{to_id}`
- `targetVariable` — куда сохранить результат
- `defaultValue` — значение если путь не найден

Пример использования:
```
json_extract
  source: rates_response
  path:   exchange.{from_id}.to.{to_id}
  target: current_rate
```

Решает проблему матричных API (обменники) без костылей с dot-notation.
Сложность: низкая (~50 строк).

---

### `http_request_multi`
**Параллельные запросы к нескольким источникам за один шаг.**

Поля:
- `sources` — массив источников:
  - `name` — ключ для результата
  - `url` — URL с поддержкой `{переменных}`
  - `path` — json_path для извлечения нужного поля
- `responseVariable` — переменная для агрегированного результата
- `includeBest` — автоматически найти максимальное значение (`best_name`, `best_rate`)
- `timeout` — таймаут на каждый запрос

Пример использования:
```
http_request_multi
  sources:
    - name: swop,   url: https://swop.is/valuta.json,   path: exchange.2.to.55
    - name: sova,   url: https://sova.is/valuta.json,   path: exchange.2.to.55
    - name: ferma,  url: https://ferma.cc/valuta.json,  path: exchange.2.to.55
  responseVariable: rates
  includeBest: true

→ message "swop: {rates.swop} | лучший: {rates.best_name} = {rates.best_rate}"
```

Реализация: `asyncio.gather` + json_path извлечение.
Сложность: средняя.

---

### `delay`
**Пауза перед следующей нодой.**

Поля:
- `seconds` — количество секунд (поддерживает `{переменные}`)
- `autoTransitionTo` — ID следующей ноды

Пример использования: anti-flood между сообщениями, задержка перед ответом.
Сложность: низкая (~10 строк: `await asyncio.sleep(N)`).

---

### `convert_file` — расширение режима `xml_to_json`
**Добавить новый формат в существующую ноду `convert_file`.**

Новый режим `xml_to_json`:
- Принимает XML строку из переменной
- Конвертирует в JSON объект
- Сохраняет в переменную (не файл)

Пример использования:
```
http_request (GET cryptobar.cc/...xml, responseFormat=text)
  → convert_file (mode=xml_to_json, input=raw_xml, output=rates)
    → set_variable ({rates.rates.item.0.in})
```

Решает подключение XML обменников (cryptobar, metka) без внешнего парсера.
Сложность: низкая (добавить ветку в существующий шаблон).

---

## 🟢 Низкий приоритет

### `try_catch`
**Обработка ошибок в цепочке.**

Поля:
- `tryTransitionTo` — нода для выполнения
- `catchTransitionTo` — нода при ошибке
- `errorVariable` — переменная с текстом ошибки

Сейчас при ошибке цепочка просто обрывается без уведомления пользователя.
Сложность: средняя.

---

### `random`
**Случайный выбор из нескольких вариантов.**

Поля:
- `branches` — массив вариантов с весами и target ID

Пример использования: A/B тесты, случайные ответы бота, случайный выбор обменника.
Сложность: низкая.

---

### `template` (переиспользуемый блок)
**Вынести повторяющуюся цепочку нод в отдельный шаблон.**

Позволяет не дублировать одинаковые цепочки (например fetch → check → show для каждого обменника).
Сложность: высокая (архитектурное изменение редактора и генератора).

---

### `aggregate`
**Собрать результаты нескольких параллельных цепочек в одну точку.**

Аналог `Merge` ноды в n8n. Ждёт завершения N цепочек, затем продолжает.
Сложность: высокая.

---

## Порядок реализации (рекомендуемый)

```
1. convert_file xml_to_json  — быстро, подключает XML обменники
2. json_extract              — быстро, решает матричные API
3. delay                     — быстро, часто нужен
4. schedule_trigger          — разблокирует алерты и автоматизацию
5. webhook_trigger           — разблокирует интеграции с внешними системами
6. api_response              — пара к webhook_trigger
7. http_request_multi        — агрегация источников за один шаг
8. ~~loop~~                  — ✅ РЕАЛИЗОВАНО
9. try_catch                 — улучшает надёжность
10. random                   — nice to have
11. template                 — архитектурное изменение
12. aggregate                — архитектурное изменение
```


---

## ~~🗄️ Встроенное хранилище данных (Bot Tables)~~ ✅ РЕАЛИЗОВАНО

> Аналог "Таблицы Salebot" — встроенная БД прямо в платформе, без внешних сервисов.
> **Статус: реализовано и доступно в конструкторе.**

### Концепция

Пользователь создаёт таблицы прямо в редакторе конструктора. Данные хранятся внутри проекта — не нужен Google Sheets, Airtable или отдельный PostgreSQL.

Бот читает и пишет в эти таблицы через специальные ноды. Добавить новый обменник, товар или настройку = одна строка в таблице через UI, без перегенерации кода.

---

### UI — вкладка "Таблицы" в редакторе

```
┌─────────────────────────────────────┐
│ 📊 Таблицы бота          + Создать  │
├─────────────────────────────────────┤
│ 📋 exchangers                       │
│  id │ name     │ url        │ on    │
│  ───┼──────────┼────────────┼───    │
│  1  │ swop.is  │ https://.. │ ✅    │
│  2  │ sova.is  │ https://.. │ ✅    │
│  3  │ ferma.cc │ https://.. │ ✅    │
│                        + Добавить   │
│                                     │
│ 📋 config                           │
│  key               │ value          │
│  ──────────────────┼──────────      │
│  alert_threshold   │ 85             │
│  admin_id          │ 123456789      │
│  support_username  │ @support       │
│                        + Добавить   │
└─────────────────────────────────────┘
```

---

### Новые ноды для работы с таблицами

#### `table_get` — получить данные из таблицы
Поля:
- `table` — выбор таблицы из дропдауна
- `filter` — условие фильтрации (визуальный построитель, не SQL)
- `orderBy` — сортировка
- `limit` — максимум строк
- `saveResultTo` — переменная для результата

Пример:
```
table_get
  table:      exchangers
  filter:     enabled = true
  orderBy:    name ASC
  saveResultTo: exchangers_list
```

Генерируемый код:
```python
# Читает из bot_data.json или SQLite
exchangers_list = [e for e in bot_tables["exchangers"] if e["enabled"]]
```

---

#### `table_set` — добавить или обновить строку
Поля:
- `table` — таблица
- `action` — insert / update / upsert
- `matchBy` — поле для поиска при update/upsert
- `data` — пары ключ-значение с поддержкой `{переменных}`

Пример:
```
table_set
  table:   rates
  action:  upsert
  matchBy: exchanger_id + pair
  data:
    exchanger_id: {exchanger.id}
    pair:         SBERRUB_USDT
    rate:         {current_rate}
    updated_at:   {now}
```

---

#### `table_delete` — удалить строки
Поля:
- `table` — таблица
- `filter` — условие удаления

---

#### `table_count` — посчитать строки
Поля:
- `table` — таблица
- `filter` — условие
- `saveResultTo` — переменная для числа

---

### Хранение данных

**Вариант A — JSON файл** (простой старт):
```
bot_data.json  ← рядом с bot.py
{
  "exchangers": [...],
  "config": {...},
  "rates": [...]
}
```
Плюсы: не нужна БД, работает везде.
Минусы: медленно при большом объёме, нет конкурентного доступа.

**Вариант B — SQLite** (рекомендуется):
Таблицы создаются автоматически при старте бота на основе схемы из `project.json`.
Плюсы: быстро, надёжно, поддерживает сортировку и фильтрацию.

**Вариант C — PostgreSQL** (для продвинутых):
Используется существующая нода `psql_query` — для тех кто хочет полный контроль.

---

### Связь с другими нодами

```
schedule_trigger (каждые 5 мин)
  → table_get (exchangers, enabled=true) → exchangers_list
    → loop (по exchangers_list, item=exchanger)
        → http_request (GET {exchanger.url})
          → json_extract (path=exchange.{exchanger.from_id}.to.{exchanger.to_id})
            → table_set (rates, upsert, exchanger_id={exchanger.id})
```

Это полный сценарий мониторинга 1000 обменников в **9 нодах**.

---

### Конкурентный анализ

| Платформа | Встроенное хранилище |
|---|---|
| Salebot.pro | ✅ "Таблицы Salebot" |
| n8n | ❌ только внешние (Postgres, Airtable, Sheets) |
| ManyChat | ✅ Custom Fields (только для пользователей) |
| Botpress | ✅ встроенная БД |
| **Наш конструктор** | 🔜 Bot Tables |

---

### Приоритет реализации

1. **UI вкладка "Таблицы"** — создание/редактирование таблиц в редакторе
2. **Хранение в project.json** — схема таблиц как часть проекта
3. **Генерация SQLite кода** — создание таблиц при старте бота
4. **Ноды table_get / table_set** — чтение и запись из сценария
5. **table_delete / table_count** — дополнительные операции
6. **Синхронизация** — изменения в UI применяются без перезапуска бота


---

## 📐 Архитектурные сценарии — мониторинг обменников

### Сценарий A — текущий (жёсткие ноды)

Каждый обменник и каждая пара прописаны вручную в нодах.

```
fetch-swop → fetch-sova → fetch-ferma → set_variable → message
```

| Метрика | Значение |
|---|---|
| Нод на пару | 6 |
| Нод при 8 парах × 4 обменниках | 53 |
| Добавить обменник | перегенерация всего проекта |
| Скорость ответа | ~2 сек (4 последовательных запроса) |

---

### Сценарий B — loop + таблицы (масштабируемый)

Обменники и пары хранятся в таблицах. Loop проходит по ним динамически.

```
table_get (exchangers) → loop → http_request → json_extract → set_variable (накопить) → message
```

Таблица обменников:
```
📋 exchangers
id │ name     │ url                    │ ton_id │ usdt_id │ enabled
───┼──────────┼────────────────────────┼────────┼─────────┼────────
1  │ swop.is  │ https://swop.is/...    │ 107    │ 55      │ true
2  │ sova.is  │ https://sova.is/...    │ 136    │ 55      │ true
3  │ ferma.cc │ https://ferma.cc/...   │ 107    │ 55      │ true
```

Таблица пар:
```
📋 pairs
id │ from_name │ from_id │ to_name    │ to_id │ emoji_from │ emoji_to
───┼───────────┼─────────┼────────────┼───────┼────────────┼─────────
1  │ Сбербанк  │ 2       │ USDT TRC20 │ 55    │ 🏦         │ ₮
2  │ Сбербанк  │ 2       │ Bitcoin    │ 5     │ 🏦         │ ₿
3  │ Тинькофф  │ 18      │ USDT TRC20 │ 55    │ 💳         │ ₮
4  │ ЮMoney    │ 48      │ TON        │ 107   │ 🟡         │ 💎
```

Схема нод (8 нод на весь бот):
```
command_trigger (/rate)
  → message (выбери пару — кнопки из таблицы pairs через enableDynamicButtons)
    → set_variable (selected_pair_id = {callback_data})
      → table_get (exchangers, enabled=true) → exchangers_list
        → loop (по exchangers_list, item=exchanger)
            → http_request (GET {exchanger.url})
              → json_extract (exchange.{pair.from_id}.to.{exchanger.to_id})
                → set_variable (rates_text += "🔸 {exchanger.name}: {current_rate}\n")
          (после loop)
        → message "💱 {pair.from_name} → {pair.to_name}\n\n{rates_text}"
```

| Метрика | Значение |
|---|---|
| Нод на весь бот | 8 |
| Добавить обменник | 1 строка в таблице |
| Добавить пару | 1 строка в таблице |
| Скорость ответа | N сек (N = кол-во обменников, последовательно) |

---

### Сценарий C — schedule + кеш (production, рекомендуется)

Фоновый сборщик обновляет курсы каждые 5 минут. Пользователь получает ответ мгновенно из кеша.

Таблица кеша:
```
📋 rates
exchanger_id │ pair_id │ rate    │ updated_at
─────────────┼─────────┼─────────┼───────────────────
1            │ 1       │ 82.70   │ 2026-05-13 09:15:00
2            │ 1       │ 82.21   │ 2026-05-13 09:15:00
3            │ 1       │ 82.69   │ 2026-05-13 09:15:00
1            │ 2       │ 6527090 │ 2026-05-13 09:15:00
```

Фоновый сборщик (5 нод, работает сам):
```
schedule_trigger (каждые 5 мин)
  → table_get (pairs, enabled=true) → pairs_list
    → loop (по pairs_list, item=pair)
        → loop (по exchangers_list, item=exchanger)  ← вложенный loop
            → http_request (GET {exchanger.url})
              → json_extract (exchange.{pair.from_id}.to.{exchanger.to_id})
                → table_set (rates, upsert, exchanger_id+pair_id)
```

Запрос пользователя (4 ноды, мгновенно):
```
command_trigger (/rate)
  → message (выбери пару)
    → table_get (rates JOIN exchangers, filter: pair_id={selected}, ORDER BY rate DESC)
      → message "{rates_text}"
```

| Метрика | Значение |
|---|---|
| Нод фонового сборщика | 5 |
| Нод интерфейса пользователя | 4 |
| Итого | 9 нод |
| Добавить обменник | 1 строка в таблице |
| Добавить пару | 1 строка в таблице |
| Скорость ответа пользователю | мгновенно (чтение из кеша) |
| Масштаб | 1 — 10 000 обменников без изменений |

---

### Сравнение сценариев

| | A (сейчас) | B (loop) | C (schedule+кеш) |
|---|---|---|---|
| Нод | 53 | 8 | 9 |
| Добавить обменник | перегенерация | 1 строка | 1 строка |
| 1000 обменников | невозможно | медленно | ✅ мгновенно |
| Нужные ноды | — | loop, json_extract, table_get/set | + schedule_trigger |
| Сложность реализации | — | средняя | высокая |

---

### Что нужно реализовать для сценария C

В порядке зависимостей:
1. `table_get` / `table_set` — чтение и запись таблиц
2. `json_extract` — извлечение вложенного поля по пути
3. `loop` — цикл по массиву (с поддержкой вложенности)
4. `schedule_trigger` — фоновый запуск по расписанию
5. UI вкладка "Таблицы" — управление данными без кода
