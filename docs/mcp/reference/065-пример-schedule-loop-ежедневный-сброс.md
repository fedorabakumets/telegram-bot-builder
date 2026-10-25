# Пример: schedule + loop (ежедневный сброс)

```json
{
  "id": "sched-reset",
  "type": "schedule_trigger",
  "position": { "x": 0, "y": 0 },
  "data": {
    "rules": [{ "mode": "daily", "hour": 0, "minute": 0 }],
    "timezone": "Europe/Moscow",
    "autoTransitionTo": "db-reset-rep",
    "enabled": true
  }
},
{
  "id": "db-reset-rep",
  "type": "psql_query",
  "position": { "x": 300, "y": 0 },
  "data": {
    "query": "UPDATE profiles SET reputation = 50 WHERE reputation < 50",
    "saveResultTo": "",
    "resultFormat": "scalar",
    "connectionSource": "env",
    "connectionEnvVar": "MY_DB_URL"
  }
}
```
