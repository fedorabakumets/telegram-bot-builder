# delay — задержка

```json
{
  "type": "delay",
  "data": {
    "seconds": "90",
    "unit": "seconds",
    "mode": "blocking",
    "autoTransitionTo": "next_node_id",
    "enableAutoTransition": true
  }
}
```

| Поле | Описание |
|------|----------|
| `seconds` | Значение задержки (поддерживает {переменные}; дробные секунды, напр. `"0.1"`) |
| `unit` | Единица: `"seconds"`, `"minutes"`, `"hours"`, `"days"`, `"weeks"` |
| `mode` | `"blocking"` — пауза (ждёт), `"background"` — фоновый таймер (цепочка завершается) |

Режим `blocking`: `await asyncio.sleep(N)` → переход к следующему узлу.
Режим `background`: `asyncio.create_task()` → переход через N времени, текущая цепочка завершается сразу.

Пример: уведомление после кулдауна:
```json
{
  "type": "delay",
  "data": {
    "seconds": "90",
    "unit": "seconds",
    "mode": "background",
    "autoTransitionTo": "msg-cd-notify"
  }
}
```
