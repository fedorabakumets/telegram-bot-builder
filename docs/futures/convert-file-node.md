<!-- @fileoverview Концепция узла `convert_file` для BotCraft Studio.
     Конвертер данных в файл и обратно — аналог Spreadsheet File Node из n8n. -->

# Узел `convert_file` — конвертер данных в файл и обратно

## Статус

🔲 Не реализовано — концепция, ожидает реализации

---

## 1. Проблема

Сейчас получить CSV-файл из данных можно только через:

- Внешний бэкенд-эндпоинт (HTTP-нода → апишник → файл)
- `resultFormat: csv_file` в `psql_query` (не реализовано)

Оба варианта либо требуют бэкенда, либо привязывают логику конвертации к конкретному источнику данных.

Нет универсального способа взять **любую переменную с json-массивом** и превратить её в файл для отправки пользователю.

---

## 2. Концепция

Узел `convert_file` — универсальный конвертер между json-массивом и файлом.

Работает в двух режимах:

| Режим | Что делает |
|-------|-----------|
| `toFile` | Берёт json-массив из переменной → конвертирует в CSV/XLSX → кладёт переменную типа `file` |
| `fromFile` | Берёт переменную типа `file` (загруженный пользователем документ) → парсит → кладёт json-массив |

### Аналог в n8n

В n8n эту роль выполняет **Spreadsheet File Node**:
- `toFile` — items → binary CSV/Excel
- `fromFile` — binary CSV/Excel → items

У нас то же самое, но через систему переменных (`user_vars`) вместо потока items.

---

## 3. Режим `toFile`

### Как выглядит в UI

```
┌─────────────────────────────────────────────┐
│  📄 Конвертер файлов                        │
├─────────────────────────────────────────────┤
│  Режим: [● В файл  ○ Из файла]              │
│                                             │
│  Входная переменная: [users_data        ]   │
│  Формат: [● CSV  ○ XLSX]                    │
│  Имя файла: [users_{date}.csv           ]   │
│  Разделитель: [,]  Кодировка: [UTF-8]       │
│                                             │
│  Сохранить в: [export_file              ]   │
│  Следующий узел: [msg-export ▼]             │
└─────────────────────────────────────────────┘
```

### Пример flow — экспорт базы пользователей

```
/export (adminOnly)
  → psql_query (SELECT * FROM bot_users → users_data, resultFormat: json)
  → convert_file (toFile, csv, users_data → export_file)
  → message (documentInputVariable: export_file)
```

### Структура узла в project.json

```json
{
  "id": "convert-to-csv",
  "type": "convert_file",
  "position": { "x": 800, "y": 200 },
  "data": {
    "mode": "toFile",
    "inputVariable": "users_data",
    "format": "csv",
    "fileName": "users_{date}.csv",
    "csvDelimiter": ",",
    "csvEncoding": "utf-8",
    "outputVariable": "export_file",
    "autoTransitionTo": "msg-export",
    "enableAutoTransition": true
  }
}
```

### Генерируемый Python-код

```python
import csv
import io
import base64

_rows = user_data[user_id].get("users_data", [])
_buf = io.StringIO()
if _rows:
    _writer = csv.DictWriter(_buf, fieldnames=_rows[0].keys(), delimiter=",")
    _writer.writeheader()
    _writer.writerows(_rows)
_csv_bytes = _buf.getvalue().encode("utf-8")
user_data[user_id]["export_file"] = {
    "type": "file",
    "data": base64.b64encode(_csv_bytes).decode("utf-8"),
    "mimeType": "text/csv",
    "fileName": f"users_{datetime.now().strftime('%Y%m%d')}.csv",
}
await set_user_var(user_id, "export_file", user_data[user_id]["export_file"])
```

Результат — переменная типа `file` (см. `docs/futures/file-variable-type.md`), которую медиа-нода отправляет через `BufferedInputFile`.

---

## 4. Режим `fromFile`

### Пример flow — импорт пользователей из CSV

```
message (enableDocumentInput, documentInputVariable: uploaded_csv)
  → convert_file (fromFile, csv, uploaded_csv → parsed_rows)
  → psql_query (INSERT INTO ... FROM {parsed_rows})
  → message ("✅ Импортировано {parsed_rows_count} строк")
```

### Структура узла в project.json

```json
{
  "id": "parse-csv",
  "type": "convert_file",
  "data": {
    "mode": "fromFile",
    "inputVariable": "uploaded_csv",
    "format": "auto",
    "outputVariable": "parsed_rows",
    "autoTransitionTo": "sql-import",
    "enableAutoTransition": true
  }
}
```

---

## 5. Поддерживаемые форматы

n8n поддерживает 10 форматов в **Convert to File** + парный **Extract From File**.
Для нас приоритет — форматы с реальными сценариями в Telegram-боте:

| Формат | toFile | fromFile | Зависимость Python | Приоритет |
|--------|:------:|:--------:|-------------------|-----------|
| CSV | ✅ | ✅ | stdlib `csv` | 🔴 первая итерация |
| JSON | ✅ | ✅ | stdlib `json` | 🔴 первая итерация |
| XLSX | ✅ | ✅ | `openpyxl` | 🟡 вторая итерация |
| TSV | ✅ | ✅ | stdlib `csv` | 🟡 вторая итерация |
| TXT | ✅ | ✅ | stdlib | 🟢 по запросу |
| ODS | ✅ | ✅ | `odfpy` | 🟢 по запросу |
| Base64→File | ✅ | — | stdlib `base64` | 🟡 нужен для file-variable-type |

### Особенности форматов (из опыта n8n)

**CSV:**
- Разделитель настраивается (`,` / `;` / `\t`)
- `includeHeaderRow` — включать ли заголовки (по умолчанию `true`)
- Вложенные объекты нужно flatten перед конвертацией — иначе `[object Object]`
- Кодировка: UTF-8 с BOM для корректного открытия в Excel на Windows

**XLSX:**
- Поддержка `sheetName` — имя вкладки внутри файла
- `compression` — уменьшает размер файла
- Сохраняет типы данных (числа остаются числами, даты — датами)
- Несколько листов — будущая фича

**JSON:**
- Два режима: `allToOne` (массив) / `eachToSeparate` (по файлу на item)
- `formatJson` — отступы для читаемости vs компактный вывод

**Base64→File:**
- Частая проблема в n8n: строка с префиксом `data:image/png;base64,...` — нужно стрипать префикс
- У нас аналог: переменная типа `file` уже хранит чистый base64 без префикса (см. `file-variable-type.md`)

Первая итерация — только CSV и JSON (без внешних зависимостей).

---

## 6. Сценарии использования

| Сценарий | Режим | Формат |
|----------|-------|--------|
| Выгрузка базы пользователей | toFile | CSV |
| Выгрузка статистики по рефералам | toFile | CSV / XLSX |
| Импорт прайс-листа | fromFile | CSV / XLSX |
| Импорт списка пользователей | fromFile | CSV |
| Конвертация CSV → XLSX | fromFile + toFile | CSV → XLSX |

### 6.1 Экспорт базы пользователей в CSV

```
/export (adminOnly)
  → psql_query (SELECT user_id, username, referrer_id, registered_at FROM bot_users → users_data, json)
  → convert_file (toFile, csv, users_data → export_file, "users_{date}.csv")
  → message (documentInputVariable: export_file, "📥 База пользователей")
```

### 6.2 Отчёт по рефералам в XLSX

```
/report (adminOnly)
  → psql_query (SELECT referrer_id, COUNT(*) as cnt ... GROUP BY → stats_data, json)
  → convert_file (toFile, xlsx, stats_data → report_file, sheetName: "Рефералы", "report_{date}.xlsx")
  → message (documentInputVariable: report_file, "📊 Отчёт по рефералам")
```

### 6.3 Импорт прайс-листа из Excel

Пользователь загружает XLSX с товарами — бот парсит и сохраняет в БД:

```
message (enableDocumentInput, documentInputVariable: price_file)
  → convert_file (fromFile, auto, price_file → price_rows)
  → psql_query (INSERT INTO products (name, price) VALUES ... FROM {price_rows})
  → message ("✅ Загружено {price_rows_count} товаров")
```

### 6.4 ИИ-агент → CSV-отчёт

ИИ анализирует данные и возвращает структурированный JSON — бот отправляет его как файл:

```
message (пользователь пишет "сделай отчёт")
  → http_request (POST /api/ai/analyze, body: {user_id} → ai_result)
  → convert_file (toFile, csv, ai_result → ai_report, "ai_report.csv")
  → message (documentInputVariable: ai_report, "🤖 Отчёт готов")
```

### 6.5 Конвертация CSV → XLSX по запросу

Пользователь присылает CSV — бот возвращает XLSX:

```
message (enableDocumentInput, documentInputVariable: csv_file)
  → convert_file (fromFile, csv, csv_file → parsed_rows)
  → convert_file (toFile, xlsx, parsed_rows → xlsx_file, "converted.xlsx")
  → message (documentInputVariable: xlsx_file, "✅ Конвертировано в Excel")
```

### 6.6 Еженедельный автоотчёт (scheduled trigger)

Бот сам формирует и рассылает отчёт по расписанию (когда появится scheduled trigger):

```
scheduled_trigger (каждый понедельник 09:00)
  → psql_query (SELECT ... за прошлую неделю → weekly_data, json)
  → convert_file (toFile, xlsx, weekly_data → weekly_report)
  → message (adminIds, documentInputVariable: weekly_report, "📅 Отчёт за неделю")
```

### 6.7 Бэкап данных пользователя

Пользователь запрашивает свои данные (GDPR-сценарий):

```
/mydata
  → psql_query (SELECT * FROM bot_users WHERE user_id = {user_id} → my_data, json)
  → convert_file (toFile, json, my_data → my_data_file, "my_data.json")
  → message (documentInputVariable: my_data_file, "📦 Ваши данные")
```

---

## 7. Связь с другими фичами

- **`file-variable-type.md`** — `convert_file` производит и потребляет переменные типа `file`
- **`psql_query`** — источник данных для `toFile`, приёмник для `fromFile`
- **Медиа-нода** — отправляет результат `toFile` пользователю через `documentInputVariable`

---

## 9. Отличия от n8n Convert to File / Extract From File

В n8n это **две отдельные ноды** (Convert to File + Extract From File). У нас — одна нода с двумя режимами (`toFile` / `fromFile`). Это осознанное упрощение.

### Что есть в n8n, чего нет в нашем доке

| Фича n8n | Статус у нас | Примечание |
|----------|-------------|------------|
| 10 форматов (CSV, XLSX, XLS, JSON, TXT, HTML, ICS, ODS, RTF, Base64) | Частично | Первая итерация: CSV + JSON |
| `includeHeaderRow` для CSV | ✅ нужно добавить | По умолчанию `true` |
| `delimiter` для CSV | ✅ есть в доке | `,` / `;` / `\t` |
| `sheetName` для XLSX | ✅ нужно добавить | Имя вкладки в Excel |
| `compression` для XLSX | 🟡 опционально | Уменьшает размер |
| `formatJson` для JSON | 🟡 опционально | Отступы vs компакт |
| `allToOne` / `eachToSeparate` для JSON | 🟡 опционально | Один файл vs по файлу на строку |
| Стрип base64-префикса | ✅ не нужен | У нас `file`-переменная уже чистая |
| Flatten вложенных объектов | ❌ не описано | Нужно предупреждение в UI |
| UTF-8 BOM для Excel-совместимости | ❌ не описано | Важно для Windows-пользователей |

### Flatten — важный граничный случай

В n8n если JSON содержит вложенные объекты, CSV-конвертер пишет `[object Object]`. Нужно либо:
- Автоматически flatten на один уровень
- Показывать предупреждение в UI если входные данные содержат вложенность

Источник: [ryanandmattdatascience.com/n8n-convert-to-file-node/](https://ryanandmattdatascience.com/n8n-convert-to-file-node/)

---

## 10. Что нужно реализовать

| Файл | Что изменить |
|------|-------------|
| `shared/schema/tables/node-schema.ts` | Добавить `convert_file` в enum типов, поля `mode`, `inputVariable`, `format`, `fileName`, `outputVariable` |
| `lib/templates/convert-file/` | Создать шаблон: schema, params, jinja2, renderer, fixture, test |
| `lib/templates/node-handlers/node-handlers.dispatcher.ts` | Добавить `case 'convert_file'` |
| `client/components/editor/properties/` | Создать `convert-file-configuration.tsx` |
| `client/components/editor/sidebar/` | Добавить узел в палитру |
| `docs/bot-json-prompt.md` | Добавить описание узла |
