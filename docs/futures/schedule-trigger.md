# Нода `schedule_trigger` — запуск по расписанию

## Концепция

Фоновая задача, которая запускает цепочку нод по таймеру без участия пользователя. Работает пока бот запущен. Аналог cron-задач, APScheduler, или «Автозапуск» в Salebot.

Основной use-case: **фоновый сборщик данных** — опрашивает API, сохраняет результаты в таблицу, пользователь получает ответ мгновенно из кеша.

---

## Поля конфигурации

| Поле | Тип | По умолчанию | Описание |
|---|---|---|---|
| `intervalMinutes` | number | 5 | Интервал запуска (минуты) |
| `cronExpression` | string | — | Cron-выражение (альтернатива интервалу) |
| `autoTransitionTo` | string | — | ID первой ноды цепочки |
| `runOnStart` | boolean | true | Запустить сразу при старте бота |
| `enabled` | boolean | true | Включён/выключен |
| `maxConcurrent` | number | 1 | Макс. одновременных запусков (защита от наложения) |
| `targetUsers` | string | `_system` | Для какого user_id выполнять (`_system` = без привязки к пользователю) |

---

## Примеры использования

### Сборщик курсов обменников

```
schedule_trigger (каждые 5 мин)
  → code (asyncio.gather — параллельные запросы к 1000 обменникам)
    → code (сохранить результаты в таблицу rates)
```

Пользователь нажимает «Сравнить»:
```
callback_trigger
  → table_get (rates, ORDER BY rate DESC, LIMIT 10)
    → message (топ-10 обменников — мгновенно)
```

### Алерт при изменении курса

```
schedule_trigger (каждую минуту)
  → http_request (GET курс BTC)
    → condition (курс > порог?)
      → broadcast (уведомить подписчиков)
```

### Ежедневная рассылка

```
schedule_trigger (cron: "0 9 * * *" — каждый день в 9:00)
  → table_get (subscribers, active=true)
    → loop (по подписчикам)
        → message (доброе утро + курсы)
```

### Очистка устаревших данных

```
schedule_trigger (каждый час)
  → code (удалить записи старше 24ч из таблицы rates)
```

---

## Генерация Python-кода

### Шаблон `schedule-trigger.py.jinja2`

```python
# Фоновая задача: {{ nodeId }}
async def _schedule_task_{{ safeName }}():
    """Фоновая задача по расписанию: каждые {{ intervalMinutes }} мин."""
    {% if runOnStart %}
    # Первый запуск сразу при старте
    await asyncio.sleep(5)  # даём боту инициализироваться
    await _schedule_run_{{ safeName }}()
    {% endif %}

    while True:
        await asyncio.sleep({{ intervalMinutes }} * 60)
        await _schedule_run_{{ safeName }}()


async def _schedule_run_{{ safeName }}():
    """Одно выполнение фоновой задачи {{ nodeId }}."""
    _sched_user_id = {{ targetUserId }}  # _system = 0
    logging.info(f"⏰ schedule [{{ nodeId }}]: запуск (интервал: {{ intervalMinutes }} мин)")

    try:
        # Инициализируем контекст
        if _sched_user_id not in user_data:
            user_data[_sched_user_id] = {}

        # Создаём fake callback для совместимости с цепочкой нод
        class _SchedCallback:
            def __init__(self):
                self.data = "{{ autoTransitionTo }}"
                self.from_user = types.User(id=_sched_user_id, is_bot=False, first_name="_system")
                self.message = None
                self._is_fake = True
            async def answer(self, *args, **kwargs):
                pass

        _sched_cb = _SchedCallback()
        await handle_callback_{{ autoTransitionTo | safe_name }}(_sched_cb, state=None)

        logging.info(f"✅ schedule [{{ nodeId }}]: выполнено успешно")
    except Exception as _sched_err:
        logging.error(f"❌ schedule [{{ nodeId }}]: ошибка: {_sched_err}")


# Регистрация фоновой задачи (вызывается в main())
_schedule_tasks.append(_schedule_task_{{ safeName }}())
```

### Интеграция с main()

В `main.py.jinja2` добавляется запуск всех schedule-задач:

```python
async def main():
    # ... инициализация бота ...

    # Запуск фоновых задач
    for _task_coro in _schedule_tasks:
        asyncio.create_task(_task_coro)

    # Запуск polling
    await dp.start_polling(bot)
```

---

## Cron-выражения

Если задан `cronExpression` вместо `intervalMinutes`, используется библиотека `croniter`:

```python
from croniter import croniter
from datetime import datetime

async def _schedule_task_{{ safeName }}():
    """Фоновая задача по cron: {{ cronExpression }}"""
    _cron = croniter("{{ cronExpression }}", datetime.now())

    while True:
        _next_run = _cron.get_next(datetime)
        _delay = (_next_run - datetime.now()).total_seconds()
        if _delay > 0:
            await asyncio.sleep(_delay)
        await _schedule_run_{{ safeName }}()
```

**Зависимость:** `croniter` (pip install croniter, ~50KB).

**Альтернатива без зависимости:** только интервал в минутах (покрывает 90% кейсов).

---

## Защита от наложения

Если предыдущий запуск ещё не завершился (например, 1000 HTTP-запросов за 5 минут):

```python
_schedule_running_{{ safeName }} = False

async def _schedule_task_{{ safeName }}():
    global _schedule_running_{{ safeName }}

    while True:
        await asyncio.sleep({{ intervalMinutes }} * 60)

        if _schedule_running_{{ safeName }}:
            logging.warning(f"⏰ schedule [{{ nodeId }}]: пропуск — предыдущий запуск ещё выполняется")
            continue

        _schedule_running_{{ safeName }} = True
        try:
            await _schedule_run_{{ safeName }}()
        finally:
            _schedule_running_{{ safeName }} = False
```

---

## Контекст выполнения

Schedule-задача выполняется **без привязки к конкретному пользователю**. Это значит:

- `user_id = 0` (системный) — или можно задать конкретного пользователя
- `callback_query.message = None` — нельзя отправлять сообщения напрямую
- Для рассылки нужен loop по подписчикам + `bot.send_message(user_id, ...)`

### Системные переменные в schedule-контексте

| Переменная | Значение |
|---|---|
| `user_id` | 0 (или заданный) |
| `_is_schedule` | `True` |
| `_schedule_node_id` | ID schedule-ноды |
| `_schedule_run_count` | Номер запуска с момента старта бота |

---

## UI — конфигурация

```
┌─────────────────────────────────────────────────┐
│ ⏰ Расписание                                    │
├─────────────────────────────────────────────────┤
│ Режим:  ○ Интервал  ○ Cron                      │
│                                                 │
│ Каждые: [5] минут                               │
│                                                 │
│ ☑ Запустить сразу при старте бота               │
│ ☑ Пропускать если предыдущий ещё выполняется    │
│                                                 │
│ Следующий узел: [setv-fetch-rates ▾]            │
└─────────────────────────────────────────────────┘
```

---

## Связь с другими нодами

### Полный сценарий: фоновый сборщик + мгновенный ответ

**Лист «Фоновый сборщик»:**
```
schedule_trigger (5 мин)
  → code:
      import aiohttp, asyncio, json

      exchangers = bot_tables.get("table.exchangers", [])
      pairs = bot_tables.get("table.pairs", [])

      async def fetch_rate(exchanger, pair):
          url = exchanger["url"]
          # ... подставить переменные, сделать запрос ...
          return {"exchanger": exchanger["name"], "pair_id": pair["id"], "rate": rate}

      tasks = [fetch_rate(e, p) for e in exchangers for p in pairs]
      results = await asyncio.gather(*tasks, return_exceptions=True)

      # Сохранить в таблицу rates
      for r in results:
          if not isinstance(r, Exception):
              await table_set("rates", r, match_by=["exchanger", "pair_id"])
```

**Лист «Сравнение курсов» (пользовательский):**
```
callback_trigger (кнопка "Сравнить")
  → code:
      rates = await table_get("rates", filter={"pair_id": selected_pair}, order_by="rate DESC", limit=10)
      lines = []
      for i, r in enumerate(rates):
          emoji = "🏆" if i == 0 else "🔸"
          lines.append(f'{emoji} <a href="{r["ref_url"]}">{r["exchanger"]}</a>: <b>{r["rate"]}</b>')
      rates_text = "\n".join(lines)
  → message "{rates_text}"
```

**Результат:** пользователь получает ответ за <100мс вместо 10-30 сек.

---

## Мониторинг

В UI показывать статус schedule-задач:

```
⏰ Фоновые задачи:
  • fetch-rates: последний запуск 2 мин назад ✅ (1.2 сек)
  • cleanup: последний запуск 45 мин назад ✅ (0.1 сек)
```

Переменные для мониторинга (автоматически):
- `_schedule.{nodeId}.last_run` — timestamp последнего запуска
- `_schedule.{nodeId}.last_duration` — длительность в секундах
- `_schedule.{nodeId}.last_error` — текст ошибки (если была)
- `_schedule.{nodeId}.run_count` — количество запусков

---

## Зависимости

| Зависимость | Обязательна | Зачем |
|---|---|---|
| `asyncio` | ✅ (встроен) | Фоновые задачи |
| `croniter` | ❌ (опционально) | Cron-выражения |
| `APScheduler` | ❌ (не нужен) | Слишком тяжёлый для нашего кейса |

---

## Этапы реализации

### Этап 1 — MVP (1 день)

- [ ] Шаблон `schedule-trigger.py.jinja2`
- [ ] Schema + params (`intervalMinutes`, `autoTransitionTo`, `runOnStart`)
- [ ] Renderer — генерация Python-кода
- [ ] Интеграция с `main.py.jinja2` (запуск задач)
- [ ] UI — базовая конфигурация (интервал + чекбоксы)

### Этап 2 — Защита и мониторинг (1 день)

- [ ] Защита от наложения (`maxConcurrent`)
- [ ] Логирование длительности и ошибок
- [ ] Переменные мониторинга (`_schedule.*.last_run`)
- [ ] UI статус-бар фоновых задач

### Этап 3 — Cron (опционально)

- [ ] Поддержка `cronExpression`
- [ ] `croniter` в requirements
- [ ] UI: переключатель Интервал/Cron + валидация выражения

### Этап 4 — Интеграция с code-нодой

- [ ] `table_set` / `table_get` хелперы доступные в code-ноде
- [ ] `asyncio.gather` для параллельных запросов в code-ноде
- [ ] Полный сценарий: schedule → code (fetch all) → table_set

---

## Ограничения

- Schedule-задача не может отправлять сообщения пользователю напрямую (нет `message` объекта)
- Для рассылки нужен явный `bot.send_message(user_id, text)` через code-ноду
- При остановке бота все schedule-задачи прекращаются
- При перезапуске — стартуют заново (нет персистентного состояния между рестартами)
