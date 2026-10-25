# Поля schedule_trigger

```json
{
  "type": "schedule_trigger",
  "data": {
    "rules": [
      { "mode": "interval", "intervalMinutes": 5 }
    ],
    "timezone": "Europe/Moscow",
    "autoTransitionTo": "nodeId",
    "runOnStart": false,
    "enabled": true,
    "maxConcurrent": 1
  }
}
```

Режимы расписания (`rules[].mode`):
- `"interval"` — каждые N минут (`intervalMinutes`)
- `"daily"` — ежедневно в указанное время (`hour`, `minute`)
- `"weekly"` — по дням недели (`weekdays: [0-6]`, `hour`, `minute`)
- `"cron"` — cron-выражение (`cronExpression`)
