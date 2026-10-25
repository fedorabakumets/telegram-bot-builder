# Поля callback_trigger

```json
{
  "type": "callback_trigger",
  "data": {
    "callbackData": "approve_",
    "matchType": "startswith",
    "autoTransitionTo": "next_node_id",
    "callbackParseTemplate": "approve_{applicant_id}",
    "callbackSaveVariables": [
      { "templateVar": "applicant_id", "saveAs": "_cb_dynamic_id" }
    ]
  }
}
```

| Поле | Описание |
|------|----------|
| `callbackData` | Паттерн callback_data для перехвата |
| `matchType` | `"exact"` — точное совпадение, `"startswith"` — начинается с |
| `callbackParseTemplate` | Шаблон для извлечения переменных из callback_data |
| `callbackSaveVariables` | Массив `[{templateVar, saveAs}]` — какие переменные извлечь и куда сохранить |
| `autoTransitionTo` | ID следующего узла |
| `adminOnly` | Только для администраторов |

#### Паттерн: кросс-пользовательский сценарий

Когда один пользователь (админ) действует в контексте другого (заявитель), используй `callback_trigger` с `startsWith` + `callbackSaveVariables`:

1. Кнопка: `customCallbackData: "approve_{user_id}"` — вшивает ID заявителя в callback_data
2. `callback_trigger` с `matchType: "startswith"` — ловит callback, извлекает ID в переменную
3. Далее `bot_table` READ по извлечённому ID — загружает данные заявителя
4. Далее `edit_message` / `message` — использует загруженные данные

**Не нужно менять движок** — используй существующие ноды. `callback_trigger` — универсальный перехватчик динамических callback'ов.

Если кнопка с `customCallbackData: "profile:name:{user_id}"` ведёт на `input` / `bot_table` / другую ноду без собственного startswith — генератор сам создаёт виртуальный триггер `startswith("profile:name:")`. Для `message` и `edit_message` виртуальный триггер не дублируется.
