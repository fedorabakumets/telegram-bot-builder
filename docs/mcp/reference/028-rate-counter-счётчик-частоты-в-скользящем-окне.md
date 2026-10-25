# rate_counter — счётчик частоты в скользящем окне

```json
{
  "type": "rate_counter",
  "data": {
    "counterKey": "spam_{user_id}",
    "windowSeconds": "60",
    "saveResultTo": "rate_count",
    "autoTransitionTo": "check_limit_node",
    "enableAutoTransition": true
  }
}
```

| Поле | Описание |
|------|----------|
| `counterKey` | Ключ счётчика (поддерживает `{переменные}`) |
| `windowSeconds` | Размер окна в секундах |
| `saveResultTo` | Переменная для количества событий в окне |
| `autoTransitionTo` | Следующий узел (`enableAutoTransition: true`) |

Данные in-memory — сбрасываются при перезапуске бота.
