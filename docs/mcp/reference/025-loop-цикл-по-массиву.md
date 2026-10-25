# loop — цикл по массиву

```json
{
  "type": "loop",
  "data": {
    "sourceVariable": "users_list",
    "itemVariable": "item",
    "indexVariable": "index",
    "parallel": false,
    "delaySeconds": 0,
    "maxIterations": 0,
    "autoTransitionTo": "body_first_node",
    "afterLoopTo": "after_loop_node",
    "enableAutoTransition": true
  }
}
```

| Поле | Описание |
|------|----------|
| `sourceVariable` | Переменная с массивом для итерации |
| `itemVariable` | Имя переменной текущего элемента (доступ: `{item.field}`) |
| `indexVariable` | Имя переменной индекса (0, 1, 2...) |
| `parallel` | `true` — параллельное выполнение через asyncio.gather |
| `delaySeconds` | Пауза между итерациями |
| `maxIterations` | Лимит итераций (0 = без лимита) |
| `autoTransitionTo` | Первый узел тела цикла |
| `afterLoopTo` | Узел после завершения цикла |
