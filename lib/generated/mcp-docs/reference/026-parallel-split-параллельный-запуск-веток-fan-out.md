# parallel_split — параллельный запуск веток (fan-out)

Запускает каждую ветку как отдельную asyncio-задачу — все ветки выполняются одновременно.
Точки сбора (join) нет: сбор результатов собирается из `set_variable` (счётчик) + `condition`.

```json
{
  "type": "parallel_split",
  "data": {
    "parallelBranches": [
      { "id": "br_1", "label": "Погода", "target": "http-weather" },
      { "id": "br_2", "label": "Курсы", "target": "http-rates", "onErrorTarget": "setv-rates-failed" }
    ],
    "maxConcurrent": 5,
    "awaitAll": false,
    "skipIfRunning": true
  }
}
```

| Поле | Описание |
|------|----------|
| `parallelBranches` | Ветки запуска: `id`, `label` (для логов), `target` (стартовая нода ветки) |
| `parallelBranches[].onErrorTarget` | Нода при ошибке ветки (обычно setv-инкремент, чтобы сбор не завис) |
| `maxConcurrent` | Лимит одновременных веток через Semaphore (0 = без лимита, по умолчанию 5) |
| `awaitAll` | `true` — обработчик ждёт все ветки; `false` (по умолчанию) — fire-and-forget |
| `skipIfRunning` | `true` (по умолчанию) — повторный запуск блокируется, пока прогон пользователя не завершён |

Паттерн сбора результатов (join без join-ноды):

```
parallel_split → ветка N: … → set_variable (done = int({done}) + 1, mode=expression) → condition (done equals "3") → итог
```

Инкремент в `set_variable` mode=expression атомарный (Lock на пользователя) — безопасен из параллельных веток.

**Внутри веток НЕ использовать** `input` (FSM один на пользователя) и триггеры (это точки входа).
Перед сбросом счётчика (`set_variable` done=0) ставить **до** parallel_split, не внутри веток.
