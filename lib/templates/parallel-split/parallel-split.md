# Шаблон parallel_split — параллельный запуск веток (fan-out)

Генерирует Python-обработчик, который запускает каждую ветку узла как отдельную
`asyncio`-задачу. Ветки выполняются одновременно; точки сбора (join) нет —
сбор результатов собирается из существующих нод (`set_variable` + `condition`).

Полная концепция: `docs/futures/nodes/parallel-split-node.md`.

## Параметры (ParallelSplitEntry)

| Параметр | Тип | Описание |
|----------|-----|----------|
| `nodeId` | `string` | ID узла |
| `safeName` | `string` | Безопасное имя для Python функции |
| `branches` | `array` | Ветки с существующими целевыми нодами |
| `branches[].label` | `string` | Подпись ветки для логов |
| `branches[].targetSafe` | `string` | Безопасное имя целевой ноды |
| `branches[].onErrorTargetExists` | `boolean` | Есть ли фоллбек при ошибке |
| `branches[].onErrorTargetSafe` | `string` | Безопасное имя ноды-фоллбека |
| `maxConcurrent` | `number` | Лимит одновременных веток (0 = без лимита) |
| `awaitAll` | `boolean` | Ждать завершения всех веток |
| `skipIfRunning` | `boolean` | Защита от двойного запуска |

## Пример входных данных (project.json)

```json
{
  "id": "split-dashboard",
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

## Пример выходного Python кода

```python
# Реестр активных запусков parallel_split: (user_id, node_id)
_active_splits: set = set()

@dp.callback_query(lambda c: c.data == "split-dashboard")
async def handle_callback_split_dashboard(callback_query, state=None):
    # skipIfRunning: защита от двойного запуска
    _split_key = (user_id, "split-dashboard")
    if _split_key in _active_splits:
        await callback_query.answer("⏳ Уже выполняется")
        return
    _active_splits.add(_split_key)

    _semaphore = asyncio.Semaphore(5)

    async def _run_branch(_handler, _label, _on_error=None):
        async with _semaphore:
            try:
                await _handler(callback_query, state=state)
            except Exception as _br_err:
                if _on_error is not None:
                    await _on_error(callback_query, state=state)

    async def _run_all():
        try:
            await asyncio.gather(
                _run_branch(handle_callback_http_weather, "Погода"),
                _run_branch(handle_callback_http_rates, "Курсы", handle_callback_setv_rates_failed),
                return_exceptions=True,
            )
        finally:
            _active_splits.discard(_split_key)

    asyncio.create_task(_run_all())
```

## Использование API

```ts
import { generateParallelSplitHandlers, collectParallelSplitEntries } from './templates/parallel-split';

// Высокоуровневый API — реестр + все обработчики
const code = generateParallelSplitHandlers(nodes);

// Низкоуровневый API — один узел
const entries = collectParallelSplitEntries(nodes);
const single = generateParallelSplit(entries[0]);
```

## Особенности

- Ветки с несуществующими целевыми нодами отбрасываются при сборке
- Реестр `_active_splits` генерируется один раз перед всеми обработчиками
- Супервизор `_run_all` снимает ключ `skipIfRunning` в `finally` — даже при ошибках
- Паттерн сбора (join) требует атомарного инкремента в `set_variable` (Lock per-user)
