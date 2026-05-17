# Шаблон `schedule-trigger`

## Описание

Генерирует Python asyncio фоновые задачи, запускающие цепочку узлов по расписанию.
Поддерживает 4 режима: interval, weekday, monthday, cron.

## Параметры

| Параметр | Тип | Описание |
|---|---|---|
| `entries` | `ScheduleTriggerEntry[]` | Массив schedule-триггеров |

### ScheduleTriggerEntry

| Поле | Тип | Описание |
|---|---|---|
| `nodeId` | string | ID узла schedule_trigger |
| `safeName` | string | Безопасное имя для Python-идентификаторов |
| `targetNodeId` | string | ID целевого узла |
| `targetNodeType` | string | Тип целевого узла |
| `rules` | ScheduleRule[] | Массив правил расписания |
| `timezone` | string | Часовой пояс (default: Europe/Moscow) |
| `runOnStart` | boolean | Запустить при старте бота |
| `enabled` | boolean | Включён |
| `maxConcurrent` | number | Макс. одновременных запусков |

### ScheduleRule

| Поле | Тип | Описание |
|---|---|---|
| `mode` | 'interval' \| 'weekday' \| 'monthday' \| 'cron' | Режим |
| `intervalMinutes` | number? | Интервал в минутах |
| `days` | string[]? | Дни недели |
| `hour` | number? | Час запуска |
| `minute` | number? | Минута запуска |
| `monthDays` | number[]? | Дни месяца |
| `cronExpression` | string? | Cron-выражение |

## Пример входных данных

```json
{
  "entries": [
    {
      "nodeId": "schedule-fetch-rates",
      "safeName": "schedule_fetch_rates",
      "targetNodeId": "code-fetch",
      "targetNodeType": "message",
      "rules": [{ "mode": "interval", "intervalMinutes": 5 }],
      "timezone": "Europe/Moscow",
      "runOnStart": false,
      "enabled": true,
      "maxConcurrent": 1
    }
  ]
}
```

## Пример выходного кода

```python
# ═══ Schedule Trigger: schedule-fetch-rates ═══

_sched_running_schedule_fetch_rates = False
_sched_count_schedule_fetch_rates = 0

async def _schedule_task_schedule_fetch_rates():
    ...

def _calc_delay_schedule_fetch_rates(_now, _last_run):
    ...

async def _schedule_execute_schedule_fetch_rates():
    ...

_schedule_tasks.append(asyncio.ensure_future(_schedule_task_schedule_fetch_rates()))
```

## API

- `collectScheduleTriggerEntries(nodes)` — собирает entries из массива узлов
- `generateScheduleTrigger(params)` — рендерит шаблон из параметров
- `generateScheduleTriggerHandlers(nodes)` — высокоуровневый API (collect + generate)
