# Поля incoming_callback_trigger

```json
{
  "type": "incoming_callback_trigger",
  "data": {
    "callbackData": "work_",
    "matchType": "startsWith",
    "callbackDataStripPrefix": "work_",
    "callbackDataSaveAs": "callback_data",
    "autoTransitionTo": "nodeId",
    "enableAutoTransition": true
  }
}
```

| Поле | Описание |
|------|----------|
| `callbackData` | Паттерн для фильтрации callback_data |
| `matchType` | **ВАЖНО: camelCase!** `"startsWith"` / `"equals"` / `"contains"` |
| `callbackDataStripPrefix` | Префикс для удаления из callback_data перед сохранением (опционально) |
| `callbackDataSaveAs` | Имя переменной куда сохранять callback_data (по умолчанию `"callback_data"`) |

⚠️ **Критично**: `matchType` должен быть в camelCase: `"startsWith"`, НЕ `"startswith"`. При неправильном регистре фильтрация не применяется и middleware перехватывает ВСЕ callback_query.
