# Кнопки (Button)

Кнопки задаются в `data.buttons[]` узла. Тип клавиатуры задаётся в `data.keyboardType`:
- `"none"` — без клавиатуры
- `"reply"` — reply-клавиатура (под полем ввода)
- `"inline"` — inline-кнопки (под сообщением)

Дополнительное поле `"shuffleButtons": true` — перемешивает порядок inline-кнопок при каждом показе (для мини-игр, капч, квизов).

```json
{
  "id": "btn_1",
  "text": "Нажми меня",
  "action": "goto",
  "target": "node_id",
  "buttonType": "normal",
  "style": "primary",
  "hideAfterClick": false,
  "skipDataCollection": false
}
```
