# set_variable — установка переменных

Узел для задания, изменения и вычисления переменных без HTTP-запроса.

```json
{
  "type": "set_variable",
  "data": {
    "assignments": [
      { "id": "assign_1", "variable": "score", "value": "0", "mode": "text" }
    ],
    "autoTransitionTo": "next_node_id",
    "enableAutoTransition": true
  }
}
```

#### Режимы присваивания (`mode`)

| mode | Описание | Пример `value` |
|------|----------|----------------|
| `text` | Простая подстановка строки/переменных | `"Привет, {first_name}"` |
| `expression` | Арифметическое выражение (поддерживает +, -, *, /, //, %, **) | `"{balance} - 50"` |
| `random` | Случайное целое число в диапазоне | `value: "500"`, `maxValue: "900"` |
| `random_item` | Случайный элемент из списка (через запятую) | `"🔧,💥,💡,⚡,🔨"` |
| `array_item` | Элемент массива/объекта по индексу или ключу | `value: "{items}"`, `maxValue: "0"` или `"data.user.name"` |
| `timestamp` | Unix timestamp (текущее время + смещение в секундах) | `"90"` (= сейчас + 90 сек) |
| `format_duration` | Форматирование секунд в MM:SS или HH:MM:SS | `"{cd.expires_at} - {now_ts}"` |
| `format_number` | Форматирование числа с разделителями (пробелами) | `"{pilot.credits}"` → "5 000 000" |
| `lookup` | Поиск значения в таблице-переменной | — |
| `str_replace` | Замена подстроки | `"старый_текст"` + `replaceWith: "новый"` |
| `json_push` | Добавить объект в массив-переменную | `"{\"name\": \"{item.name}\"}"` |
| `json_format` | Форматировать массив в строку | шаблон строки |
| `regex_extract` | Извлечение по регулярному выражению | `value: "{source}"`, `pattern: "(\\d+)\\s*руб"`, `regexGroup: "1"` |
| `extract_number` | Извлечение первого числа из строки | `"{bot_response}"` → "7216970" |
| `split_get` | Разделить строку и взять N-й элемент | `value: "{email}"`, `separator: "@"`, `maxValue: "1"` |
| `json_get` | Значение из JSON по пути (dot notation) | `value: "{api_response}"`, `jsonPath: "data.user.name"` |
| `substring` | Подстрока (start, end) | `value: "{id}"`, `startIndex: "0"`, `endIndex: "8"` |
| `conditional` | Тернарный оператор (если/иначе) | `conditionVariable: "{balance}"`, `conditionOperator: "greater_than"`, `conditionValue: "1000"`, `trueValue: "💰"`, `falseValue: "💸"` |
| `lowercase` | В нижний регистр | `"{user_input}"` |
| `uppercase` | В верхний регистр | `"{user_input}"` |
| `trim` | Убрать пробелы по краям | `"{user_input}"` |
| `length` | Длина строки или массива | `"{inventory}"` → "3" |
| `array_concat` | Объединить два массива в один. Поля: `value` (первый массив), `concatWith` (второй массив). Результат: склеенный массив. | `value: "{arr1}"`, `concatWith: "{arr2}"` |

#### Сохранение в PostgreSQL (`persistToDb`)

Сохранение через `update_user_data_in_db` атомарно создаёт пользователя или обновляет один ключ JSONB, сохраняя остальные ключи. При временном обрыве соединения выполняется не более трёх попыток с повторным получением соединения из пула и задержками 0,5 и 1 секунду. Ошибки данных и SQL не повторяются. В логи попадают операция, тип ошибки и номер попытки без пользовательских значений; окончательный отказ возвращает `False`. Новых настроек нод для этого поведения нет. Эти повторы не распространяются на произвольные запросы `psql_query`.

В каждом элементе `assignments` можно указать `"persistToDb": true` — после присваивания значение дополнительно сохраняется в PostgreSQL через `set_user_var` (требуется включённая пользовательская БД бота):

```json
{
  "id": "a1",
  "variable": "reputation",
  "value": "{reputation} + 10",
  "mode": "expression",
  "persistToDb": true
}
```

#### Примеры

Случайная зарплата от 500 до 900:
```json
{ "id": "a0", "variable": "salary", "value": "500", "maxValue": "900", "mode": "random" }
```

Случайный эмодзи из списка:
```json
{ "id": "a0", "variable": "target_emoji", "value": "🔧,💥,💡,⚡,🔨,🌋", "mode": "random_item" }
```

Установить кулдаун на 90 секунд вперёд:
```json
{ "id": "a0", "variable": "cooldown_until", "value": "90", "mode": "timestamp" }
```

Текущий Unix timestamp (без смещения):
```json
{ "id": "a0", "variable": "now_ts", "value": "0", "mode": "timestamp" }
```

Форматирование оставшегося времени кулдауна в MM:SS:
```json
{ "id": "a0", "variable": "cd_text", "value": "{cd.expires_at} - {now_ts}", "mode": "format_duration" }
```
Результат: `"01:30"` (если осталось 90 секунд) или `"01:05:30"` (если больше часа).

Начислить 10 к репутации:
```json
{ "id": "a1", "variable": "reputation", "value": "{reputation} + 10", "mode": "expression" }
```

Извлечь число (курс) из текста ответа бота:
```json
{ "id": "a1", "variable": "rate", "value": "{bot_response}", "mode": "regex_extract", "pattern": "(\\d+)\\s*рублей", "regexGroup": "1" }
```

Извлечь ID заказа из строки:
```json
{ "id": "a1", "variable": "order_id", "value": "{text}", "mode": "regex_extract", "pattern": "#(\\d+)", "regexGroup": "1" }
```

> ⚠️ **ВАЖНО для regex_extract:** `value` — это ИСТОЧНИК текста (откуда извлекать), `pattern` — это REGEX паттерн. НЕ путать! Поле `regexSource` НЕ существует — используй только `value` + `pattern`.

Списать 50 🍪:
```json
{ "id": "a2", "variable": "balance", "value": "{balance} - 50", "mode": "expression" }
```

Установить текст:
```json
{ "id": "a3", "variable": "status", "value": "VIP", "mode": "text" }
```

Замена подстроки:
```json
{ "id": "a4", "variable": "bio", "value": "плохое_слово", "mode": "str_replace", "replaceWith": "***" }
```

Элемент массива по индексу:
```json
{ "id": "a0", "variable": "first_item", "value": "{items_list}", "maxValue": "0", "mode": "array_item" }
```

Вложенный доступ через dot-notation:
```json
{ "id": "a0", "variable": "user_name", "value": "{api_response}", "maxValue": "data.users.0.name", "mode": "array_item" }
```

Объединение двух массивов:
```json
{ "id": "a0", "variable": "all_items", "value": "{active_items}", "mode": "array_concat", "concatWith": "{archived_items}" }
```

#### Lookup (поиск в таблице)

```json
{
  "id": "a5",
  "variable": "user_rank",
  "value": "",
  "mode": "lookup",
  "lookupTable": "ranks",
  "lookupField": "title",
  "lookupWhere": [
    { "field": "user_id", "value": "{user_id}" }
  ]
}
```
