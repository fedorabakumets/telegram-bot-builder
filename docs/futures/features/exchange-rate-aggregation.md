# Агрегация курсов обменников — план доработок

## Проблема

Бот сравнивает курсы обменников, но:
- Сейчас подключены только 6 из 9 сайтов (у остальных другой формат API)
- Запросы идут последовательно (6 × ~3 сек = ~18 сек ожидания)
- У каждого обменника свои ID валют — нет единого маппинга
- cryptobar отдаёт XML вместо JSON

---

## Что есть сейчас

```
Пользователь выбирает пару → Вводит сумму
  → loop (последовательно по table.exchangers)
      → http_request (GET {exchanger.url})
        → set_variable (извлечь курс по пути exchange.{from_id}.to.{to_id})
  → message (результат)
```

**Работает для:** swop.is, sova.is, pocket-exchange.com, ferma.cc, onemoment.cc, metka.cc
**Не работает для:** epichange.online, exbitbot.net (другие ID), cryptobar.cc (XML)

---

## Корень проблемы

### 1. Разные ID валют

| Валюта | swop/sova/pocket/ferma/onemoment/metka | epichange | exbitbot |
|--------|----------------------------------------|-----------|----------|
| Сбербанк | 2 | 580 | 577 |
| Тинькофф | 18 | 588 | 582 |
| USDT TRC20 | 55 | 589 | 585 |
| Bitcoin | 5 | 579 | 578 |
| Ethereum | 4 (или 139) | 582 | 580 |
| TON | 107 | ? | ? |

### 2. Разный формат ответа

**swop.is и подобные:**
```json
{ "exchange": { "2": { "to": { "55": 82.70 } } } }
```
Путь: `exchange.2.to.55` → число

**epichange/exbitbot:**
```json
{ "exchange": { "580": { "to": { "589": { "xr": "-5677372", "amount": "264201893", "min": "0.000884" } } } } }
```
Путь: `exchange.580.to.589.xr` → строка (нужно взять абсолютное значение и инвертировать)

**cryptobar.cc:**
```xml
<rates>
  <item><from>CARDRUB</from><to>USDTTRC20</to><in>92.50</in><out>1</out></item>
</rates>
```
Формат: XML, поиск по тегам `<from>` и `<to>`

### 3. Последовательные запросы

Loop выполняет итерации одну за другой. 9 обменников × 3 сек = 27 сек ожидания.

---

## Решение — 3 доработки существующих нод

### Доработка 1: `loop.parallel = true`

**Что:** Включить параллельное выполнение итераций цикла.

**Поле уже есть** в схеме loop ноды (`parallel: false`), но не реализовано в генераторе.

**Генерируемый код (до):**
```python
for exchanger in table_exchangers:
    response = await fetch(exchanger["url"])
    # обработка...
```

**Генерируемый код (после, parallel=true):**
```python
import asyncio

async def _loop_body(exchanger):
    response = await fetch(exchanger["url"])
    # обработка...
    return result

results = await asyncio.gather(*[_loop_body(e) for e in table_exchangers])
```

**Результат:** 9 запросов за ~3 сек вместо ~27 сек.

**Сложность:** средняя (~50 строк в jinja2 шаблоне loop ноды)

---

### Доработка 2: `http_request.responseJsonPath`

**Что:** Новое опциональное поле — путь для извлечения значения из JSON-ответа.

**Новые поля в схеме:**
```typescript
/** JSON-путь для извлечения значения из ответа (поддерживает {переменные}) */
responseJsonPath?: string;
/** Переменная куда сохранить извлечённое значение */
responseExtractTo?: string;
```

**Пример использования:**
```
http_request
  url: {exchanger.url}
  responseVariable: r_exch
  responseJsonPath: {exchanger.json_path}    ← "exchange.580.to.589.xr"
  responseExtractTo: current_rate
```

**Генерируемый код:**
```python
response = await fetch(url)
r_exch = response.json()
# Извлечение по пути
path = replace_variables_in_text("{exchanger.json_path}", vars)
current_rate = get_by_path(r_exch, path)
user_data[user_id]["current_rate"] = current_rate
```

**Функция `get_by_path`:**
```python
def get_by_path(obj, path):
    """Извлекает значение из вложенного объекта по dot-notation пути"""
    for key in path.split('.'):
        if isinstance(obj, dict):
            obj = obj.get(key)
        elif isinstance(obj, list) and key.isdigit():
            obj = obj[int(key)]
        else:
            return None
    return obj
```

**Результат:** Можно извлекать данные из любой глубины JSON без костылей.

**Сложность:** низкая (~30 строк)

---

### Доработка 3: Маппинг ID в таблице `exchangers`

**Что:** Добавить колонки `local_from` и `local_to` (или `json_path`) в таблицу обменников.

**Таблица exchangers (обновлённая):**

| name | url | ref_url | json_path |
|------|-----|---------|-----------|
| swop.is | https://swop.is/valuta.json | ...ref... | exchange.{from_id}.to.{to_id} |
| sova.is | https://sova.is/valuta.json | ...ref... | exchange.{from_id}.to.{to_id} |
| epichange | https://epichange.online/request-exportjson.json?lang=ru | ...ref... | exchange.{epi_from}.to.{epi_to}.xr |
| exbitbot | https://exbitbot.net/request-exportjson.json?lang=ru | ...ref... | exchange.{exb_from}.to.{exb_to}.xr |
| cryptobar | (отдельная обработка) | ...ref... | xml |

**Таблица маппинга `pair_map`:**

| pair_id | exchanger_name | local_from | local_to |
|---------|---------------|------------|----------|
| sber_usdt | swop.is | 2 | 55 |
| sber_usdt | epichange | 580 | 589 |
| sber_usdt | exbitbot | 577 | 585 |
| sber_btc | swop.is | 2 | 5 |
| sber_btc | epichange | 580 | 579 |
| sber_btc | exbitbot | 577 | 578 |

**Проблема:** Текущий движок не поддерживает lookup с двумя условиями (exchanger + pair). Нужна либо:
- Денормализация (колонки `local_from_sber_usdt`, `local_from_sber_btc`... в exchangers) — некрасиво
- Серверный endpoint для маппинга — чище

---

## Альтернатива: серверный endpoint (самый быстрый путь)

Вместо доработки движка — один endpoint на сервере:

```
GET /api/compare-rates?from=2&to=55&amount=10000
```

**Что делает сервер:**
1. Знает маппинг ID для каждого обменника (хардкод или из БД)
2. Запрашивает все 9 обменников параллельно (`Promise.all`)
3. Парсит JSON и XML
4. Извлекает курс по правильному пути для каждого
5. Считает `amount × rate`
6. Возвращает готовый массив

**Ответ:**
```json
{
  "results": [
    { "name": "swop.is", "rate": 0.01085, "result": 108.5, "ref_url": "https://swop.is/?ref=..." },
    { "name": "epichange", "rate": 0.01078, "result": 107.8, "ref_url": "https://epichange.online/?rid=..." },
    { "name": "cryptobar", "rate": 0.01092, "result": 109.2, "ref_url": "https://cryptobar.cc/?rid=..." }
  ],
  "best": { "name": "cryptobar", "rate": 0.01092, "result": 109.2 }
}
```

**В боте:** одна `http_request` нода → показ результата. Без цикла, без маппинга.

**Сложность:** ~80 строк TypeScript на сервере.

---

## Сравнение подходов

| | Доработка нод | Серверный endpoint |
|---|---|---|
| Параллельность | ✅ (loop.parallel) | ✅ (Promise.all) |
| Разные форматы JSON | ✅ (responseJsonPath) | ✅ (в коде сервера) |
| XML (cryptobar) | ❌ нужна ещё convert_file нода | ✅ (xml2js на сервере) |
| Маппинг ID | ⚠️ сложно через таблицы | ✅ (в коде или БД) |
| Время реализации | ~2-3 дня | ~2-3 часа |
| Переиспользуемость | Любой бот в конструкторе | Только этот сервер |
| Добавить обменник | Строка в таблице + маппинг | Строка в коде сервера |

---

## Рекомендация

**Сейчас:** серверный endpoint (быстро, работает, подключает все 9 обменников + XML).

**Потом:** реализовать `loop.parallel` и `responseJsonPath` как фичи конструктора — они пригодятся не только для обменников.

---

## План действий

### Фаза 1 — Серверный endpoint (сегодня)
- [ ] Создать `server/routes/compareRates.ts`
- [ ] Маппинг ID всех обменников
- [ ] Параллельные запросы к 9 сайтам
- [ ] Парсинг JSON + XML
- [ ] Расчёт и сортировка по лучшему курсу
- [ ] Обновить бота: убрать loop, поставить один http_request к `/api/compare-rates`

### Фаза 2 — Доработка loop ноды (позже)
- [ ] Реализовать `parallel: true` в генераторе
- [ ] Тесты параллельного выполнения
- [ ] Обработка ошибок отдельных итераций

### Фаза 3 — responseJsonPath (позже)
- [ ] Добавить поля в схему http_request
- [ ] Генерация кода извлечения по пути
- [ ] UI поля в панели свойств

### Фаза 4 — XML поддержка (позже)
- [ ] Режим `xml_to_json` в convert_file ноде
- [ ] Или встроенный парсинг XML в http_request при `responseFormat: xml`
