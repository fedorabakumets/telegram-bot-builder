# Нода `schedule_trigger` — запуск по расписанию

## Концепция

Фоновая задача, которая запускает цепочку нод по таймеру без участия пользователя. Аналог Schedule Trigger в n8n — визуальный конструктор расписания с множественными правилами, timezone, персистентностью состояния в БД.

---

## Режимы расписания (как в n8n)

### 4 режима в одной ноде

| Режим | Пример | Описание |
|---|---|---|
| **Интервал** | Каждые 5 минут | Простой повтор |
| **День недели** | Пн, Ср, Пт в 09:00 | Конкретные дни + время |
| **День месяца** | 1-е и 15-е числа в 10:00 | Конкретные даты |
| **Cron** | `*/5 9-18 * * 1-5` | Полный cron для продвинутых |

### Множественные правила

Одна нода может содержать **несколько правил** (как в n8n). Workflow запускается при срабатывании любого из них:

```json
{
  "rules": [
    { "mode": "interval", "intervalMinutes": 5 },
    { "mode": "weekday", "days": ["mon", "wed", "fri"], "hour": 9, "minute": 0 }
  ]
}
```

---

## Поля конфигурации

| Поле | Тип | По умолчанию | Описание |
|---|---|---|---|
| `rules` | array | `[{mode: "interval", intervalMinutes: 5}]` | Массив правил расписания |
| `timezone` | string | `Europe/Moscow` | Часовой пояс для расчёта времени |
| `autoTransitionTo` | string | — | ID первой ноды цепочки |
| `runOnStart` | boolean | false | Запустить сразу при старте бота |
| `enabled` | boolean | true | Включён/выключен |
| `maxConcurrent` | number | 1 | Макс. одновременных запусков |

### Схема правила

```typescript
interface ScheduleRule {
  /** Режим: interval, weekday, monthday, cron */
  mode: 'interval' | 'weekday' | 'monthday' | 'cron';

  // --- interval ---
  /** Интервал в минутах (mode=interval) */
  intervalMinutes?: number;

  // --- weekday ---
  /** Дни недели: mon, tue, wed, thu, fri, sat, sun */
  days?: string[];
  /** Час запуска (0-23) */
  hour?: number;
  /** Минута запуска (0-59) */
  minute?: number;

  // --- monthday ---
  /** Дни месяца (1-31) */
  monthDays?: number[];

  // --- cron ---
  /** Cron-выражение */
  cronExpression?: string;
}
```

---

## Выходные данные (как в n8n)

При срабатывании schedule передаёт в следующую ноду metadata:

```python
user_data[_sched_user_id]["_schedule"] = {
    "lastExecution": "2026-05-17T09:00:00+03:00",
    "timestamp": "2026-05-17T09:05:00+03:00",
    "nodeId": "schedule-fetch-rates",
    "runCount": 42,
    "rule": {"mode": "interval", "intervalMinutes": 5}
}
```

Доступно в следующих нодах через `{_schedule.timestamp}`, `{_schedule.runCount}`.

---

## Персистентность в БД

### Таблица `schedule_state`

```sql
CREATE TABLE schedule_state (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    token_id INTEGER NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    last_duration_ms INTEGER,
    last_error TEXT,
    last_status VARCHAR(20) DEFAULT 'idle',  -- idle, running, success, error
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, token_id, node_id)
);
```

### Что даёт персистентность

1. **Восстановление после рестарта** — бот знает когда был последний запуск и не пропускает интервал
2. **Мониторинг в UI** — показывает статус, последний запуск, ошибки
3. **Пропуск пропущенных** — если бот был выключен 2 часа, при старте не запускает 24 пропущенных 5-минутных задачи (настраиваемо)
4. **История выполнений** — для дебага и аналитики

### Логика восстановления при старте

```python
async def _schedule_restore():
    """Восстанавливает состояние schedule-задач из БД при старте бота."""
    state = await db_get_schedule_state(PROJECT_ID, TOKEN_ID, node_id)

    if state is None:
        # Первый запуск — создаём запись
        await db_create_schedule_state(PROJECT_ID, TOKEN_ID, node_id)
        if run_on_start:
            await _schedule_run()
        return

    # Вычисляем сколько времени прошло с последнего запуска
    elapsed = datetime.now(tz) - state["last_run_at"]

    if elapsed >= interval:
        # Пора запускать
        await _schedule_run()
    else:
        # Ждём оставшееся время
        remaining = interval - elapsed
        await asyncio.sleep(remaining.total_seconds())
        await _schedule_run()
```

---

## Генерация Python-кода

### Шаблон `schedule-trigger.py.jinja2`

```python
# ═══ Schedule Trigger: {{ nodeId }} ═══

_schedule_running_{{ safeName }} = False
_schedule_run_count_{{ safeName }} = 0

async def _schedule_task_{{ safeName }}():
    """Фоновая задача: {{ nodeId }} ({{ rules | length }} правил)."""
    global _schedule_running_{{ safeName }}, _schedule_run_count_{{ safeName }}
    from datetime import datetime, timedelta
    import pytz

    _tz = pytz.timezone("{{ timezone }}")

    # Восстанавливаем состояние из БД
    _last_run = None
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                _state = await conn.fetchrow(
                    "SELECT last_run_at, run_count FROM schedule_state WHERE project_id=$1 AND token_id=$2 AND node_id=$3",
                    PROJECT_ID, TOKEN_ID, "{{ nodeId }}"
                )
                if _state:
                    _last_run = _state["last_run_at"]
                    _schedule_run_count_{{ safeName }} = _state["run_count"] or 0
                else:
                    await conn.execute(
                        "INSERT INTO schedule_state (project_id, token_id, node_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                        PROJECT_ID, TOKEN_ID, "{{ nodeId }}"
                    )
        except Exception as _e:
            logging.warning(f"⏰ schedule [{{ nodeId }}]: ошибка чтения состояния: {_e}")

    {% if runOnStart %}
    # Запуск при старте бота
    await asyncio.sleep(3)
    await _schedule_execute_{{ safeName }}()
    {% endif %}

    # Основной цикл
    while True:
        _now = datetime.now(_tz)
        _next_delay = _calculate_next_delay_{{ safeName }}(_now, _last_run)
        await asyncio.sleep(_next_delay)
        await _schedule_execute_{{ safeName }}()
        _last_run = datetime.now(_tz)


def _calculate_next_delay_{{ safeName }}(_now, _last_run):
    """Вычисляет задержку до следующего запуска на основе правил."""
    {% for rule in rules %}
    {% if rule.mode == 'interval' %}
    # Правило: каждые {{ rule.intervalMinutes }} мин
    if _last_run:
        _elapsed = (_now - _last_run).total_seconds()
        _remaining = {{ rule.intervalMinutes }} * 60 - _elapsed
        if _remaining > 0:
            return _remaining
    return {{ rule.intervalMinutes }} * 60
    {% elif rule.mode == 'cron' %}
    # Правило: cron {{ rule.cronExpression }}
    try:
        from croniter import croniter
        _cron = croniter("{{ rule.cronExpression }}", _now)
        _next = _cron.get_next(type(datetime.now()))
        return (_next - _now).total_seconds()
    except ImportError:
        return 300  # fallback 5 мин
    {% endif %}
    {% endfor %}
    return 300  # fallback


async def _schedule_execute_{{ safeName }}():
    """Одно выполнение schedule-задачи {{ nodeId }}."""
    global _schedule_running_{{ safeName }}, _schedule_run_count_{{ safeName }}

    if _schedule_running_{{ safeName }}:
        logging.warning(f"⏰ schedule [{{ nodeId }}]: пропуск — предыдущий запуск ещё выполняется")
        return

    _schedule_running_{{ safeName }} = True
    _start_time = __import__('time').monotonic()
    _error_text = None

    try:
        _schedule_run_count_{{ safeName }} += 1
        _sched_user_id = 0  # системный пользователь

        if _sched_user_id not in user_data:
            user_data[_sched_user_id] = {}

        # Metadata для следующих нод
        from datetime import datetime
        user_data[_sched_user_id]["_schedule"] = {
            "timestamp": datetime.now().isoformat(),
            "nodeId": "{{ nodeId }}",
            "runCount": _schedule_run_count_{{ safeName }},
        }

        logging.info(f"⏰ schedule [{{ nodeId }}]: запуск #{_schedule_run_count_{{ safeName }}}")

        # Запускаем цепочку
        class _SchedCallback:
            def __init__(self):
                self.data = "{{ autoTransitionTo }}"
                self.from_user = types.User(id=_sched_user_id, is_bot=False, first_name="_system")
                self.message = None
                self._is_fake = True
            async def answer(self, *args, **kwargs):
                pass

        await handle_callback_{{ autoTransitionTo | safe_name }}(_SchedCallback(), state=None)
        logging.info(f"✅ schedule [{{ nodeId }}]: выполнено за {__import__('time').monotonic() - _start_time:.1f}с")

    except Exception as _sched_err:
        _error_text = str(_sched_err)
        logging.error(f"❌ schedule [{{ nodeId }}]: {_sched_err}")

    finally:
        _schedule_running_{{ safeName }} = False
        _duration_ms = int((__import__('time').monotonic() - _start_time) * 1000)

        # Сохраняем состояние в БД
        if db_pool:
            try:
                async with db_pool.acquire() as conn:
                    await conn.execute("""
                        UPDATE schedule_state
                        SET last_run_at = NOW(), run_count = $4, last_duration_ms = $5,
                            last_error = $6, last_status = $7, updated_at = NOW()
                        WHERE project_id = $1 AND token_id = $2 AND node_id = $3
                    """, PROJECT_ID, TOKEN_ID, "{{ nodeId }}",
                        _schedule_run_count_{{ safeName }}, _duration_ms,
                        _error_text, 'error' if _error_text else 'success')
            except Exception:
                pass


# Регистрация задачи
_schedule_tasks.append(asyncio.ensure_future(_schedule_task_{{ safeName }}()))
```

### Интеграция с main.py.jinja2

```python
# Глобальный список schedule-задач
_schedule_tasks = []

async def main():
    # ... инициализация ...

    # Запуск фоновых задач (schedule_trigger ноды)
    # Задачи регистрируются автоматически при загрузке модуля

    await dp.start_polling(bot)
```

---

## UI — визуальный конструктор расписания

### Как в n8n — дропдауны вместо cron

```
┌─────────────────────────────────────────────────────┐
│ ⏰ Расписание                              + Правило │
├─────────────────────────────────────────────────────┤
│ Правило 1:                                     [🗑] │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Режим: [Интервал ▾]                             │ │
│ │ Каждые: [5 ▾] минут                            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Правило 2:                                     [🗑] │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Режим: [День недели ▾]                          │ │
│ │ Дни: [☑Пн ☑Ср ☑Пт ☐Вт ☐Чт ☐Сб ☐Вс]          │ │
│ │ Время: [09]:[00]                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Часовой пояс: [Europe/Moscow ▾]                     │
│ ☐ Запустить сразу при старте бота                   │
│ ☑ Пропускать если предыдущий ещё выполняется        │
│                                                     │
│ Следующий узел: [code-fetch-rates ▾]                │
└─────────────────────────────────────────────────────┘
```

### Превью следующих запусков

Под конфигурацией показываем:
```
Следующие запуски:
  • 17.05.2026 15:30 (через 2 мин)
  • 17.05.2026 15:35 (через 7 мин)
  • 17.05.2026 15:40 (через 12 мин)
```

---

## Мониторинг в UI

### Статус-бар (в панели бота)

```
⏰ Фоновые задачи:
  • fetch-rates: ✅ последний запуск 2 мин назад (1.2с) | #42
  • daily-report: 🕐 следующий запуск через 4ч 15мин
  • cleanup: ❌ ошибка 10 мин назад: "connection timeout"
```

### API endpoint

```
GET /api/projects/:projectId/schedules
```

Ответ:
```json
[
  {
    "nodeId": "schedule-fetch-rates",
    "status": "success",
    "lastRunAt": "2026-05-17T15:25:00Z",
    "nextRunAt": "2026-05-17T15:30:00Z",
    "runCount": 42,
    "lastDurationMs": 1200,
    "lastError": null,
    "enabled": true
  }
]
```

---

## Timezone

- По умолчанию: `Europe/Moscow`
- Настраивается в UI (дропдаун с популярными зонами)
- Используется `pytz` для корректного расчёта
- Важно для режимов weekday/monthday (запуск в 9:00 по Москве, не по UTC)

---

## Обработка пропущенных запусков

При рестарте бота — если прошло больше одного интервала:

| Стратегия | Описание |
|---|---|
| `skip` (по умолчанию) | Запустить один раз сейчас, не компенсировать пропущенные |
| `catchUp` | Запустить все пропущенные (опасно при длинных интервалах) |
| `none` | Просто ждать следующего интервала |

n8n использует `skip` — и мы тоже.

---

## Примеры сценариев

### Сборщик курсов (каждые 5 мин)

```
schedule_trigger (interval: 5 мин)
  → code:
      import aiohttp, asyncio
      exchangers = bot_tables["table.exchangers"]
      results = await asyncio.gather(*[fetch(e["url"]) for e in exchangers])
      # ... сохранить в rates ...
```

### Ежедневный отчёт (Пн-Пт в 9:00)

```
schedule_trigger (weekday: mon-fri, 09:00, tz: Europe/Moscow)
  → code:
      # Получаем подписчиков из таблицы проекта
      subscribers = bot_tables.get("table.subscribers", [])
      for sub in subscribers:
          if sub.get("active") == "true":
              await bot.send_message(int(sub["user_id"]), report_text)
```

### Очистка старых данных (каждый час)

```
schedule_trigger (interval: 60 мин)
  → code:
      # Удаляем устаревшие курсы через asyncpg
      async with db_pool.acquire() as conn:
          await conn.execute("DELETE FROM bot_table_rows WHERE table_id=$1 AND data->>'updated_at' < $2", rates_table_id, cutoff)
```

---

## Зависимости

| Зависимость | Обязательна | Зачем |
|---|---|---|
| `asyncio` | ✅ (встроен) | Фоновые задачи |
| `pytz` | ✅ | Timezone |
| `croniter` | ❌ (только для cron-режима) | Парсинг cron-выражений |
| `asyncpg` | ✅ (уже есть) | Персистентность в БД |

---

## Этапы реализации

### Этап 1 — MVP с интервалом (1-2 дня)

- [ ] SQL миграция: таблица `schedule_state`
- [ ] Шаблон `schedule-trigger.py.jinja2` (mode=interval)
- [ ] Schema + params + renderer
- [ ] Интеграция с `main.py.jinja2`
- [ ] Восстановление состояния из БД при старте
- [ ] Сохранение last_run/run_count/error в БД
- [ ] UI: базовая конфигурация (интервал + timezone)

### Этап 2 — Weekday/Monthday (1 день)

- [ ] Расчёт next_run для weekday/monthday режимов
- [ ] UI: чекбоксы дней + time picker
- [ ] Превью следующих запусков

### Этап 3 — Cron + мониторинг (1 день)

- [ ] `croniter` интеграция
- [ ] UI: поле cron с валидацией
- [ ] API endpoint `/api/projects/:id/schedules`
- [ ] UI: статус-бар фоновых задач
- [ ] Множественные правила в одной ноде

### Этап 4 — Продвинутые фичи

- [ ] Стратегия пропущенных запусков (skip/catchUp/none)
- [ ] Ручной запуск из UI (кнопка «Запустить сейчас»)
- [ ] История выполнений (таблица `schedule_history`)
- [ ] Алерты при N ошибках подряд
