# worker_processes

## worker_processes

Таблица процессов воркеров — мониторинг Python worker pool

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор записи |
| project_id | integer | - | NO | - | - | Идентификатор проекта |
| pid | integer | - | YES | - | - | PID процесса воркера |
| status | text | `'running'` | NO | - | - | Статус воркера: running, stopped, error |
| bots_count | integer | `0` | NO | - | - | Количество активных ботов в воркере |
| memory_mb | integer | - | YES | - | - | Потребление памяти в МБ |
| started_at | timestamp | `now()` | YES | - | - | Время запуска воркера |
| stopped_at | timestamp | - | YES | - | - | Время остановки воркера |
