# input — ожидать ввод пользователя

**Единственный способ сбора ввода.** Message-нода отправляет вопрос, input-нода ожидает и сохраняет ответ.

Типичная цепочка: `message` (вопрос) → `input` (сохранение ответа) → следующий узел.

Для кнопочного ввода: `message` (вопрос) → `keyboard` (кнопки) → `input` (сохранение нажатия).

```json
{
  "type": "input",
  "data": {
    "inputVariable": "user_answer",
    "inputPrompt": "Введите ваш ответ:",
    "inputType": "text",
    "inputTargetNodeId": "next_node_id"
  }
}
```

#### Поля input-ноды

| Поле | Тип | Описание |
|------|-----|----------|
| `inputVariable` | string | Имя переменной для сохранения ответа |
| `inputType` | string | Тип ввода: `text`, `photo`, `video`, `audio`, `document`, `location`, `contact`, `any`, `callback` |
| `inputTargetNodeId` | string | ID следующего узла после получения ответа |
| `inputPrompt` | string | Подсказка (не отправляется пользователю, для UI) |
| `appendVariable` | boolean | `true` — добавить к существующему значению, `false` — заменить |
| `saveToDatabase` | boolean | Сохранять в БД |
| `inputRequired` | boolean | Ввод обязателен |
| `maxLength` | number | Максимальная длина текста (0 = без ограничений) |
| `minLength` | number | Минимальная длина текста (0 = без ограничений) |
| `validationType` | string | Валидация: `none`, `email`, `phone`, `number` |
| `retryMessage` | string | Сообщение при ошибке валидации |
| `inputTimeout` | number | Таймаут ожидания в секундах (> 0). По истечении FSM сбрасывается |
| `inputTimeoutMessage` | string | Сообщение при таймауте (по умолчанию «Время ожидания истекло.») |

#### Таймаут и отмена `/cancel`

При `inputTimeout > 0` генерируется планировщик `_schedule_input_timeout`. По истечении срока форма сбрасывается, пользователю отправляется `inputTimeoutMessage`.

При активном сборе ввода автоматически регистрируется команда `/cancel` — сбрасывает FSM и отвечает «Форма отменена.»

```json
{
  "type": "input",
  "data": {
    "inputVariable": "user_answer",
    "inputType": "text",
    "inputTargetNodeId": "next_node_id",
    "inputTimeout": 120,
    "inputTimeoutMessage": "Слишком долго ждали. Начните заново."
  }
}
```

#### inputType: "callback"

Для сохранения нажатия inline-кнопки. Кнопки на keyboard-ноде ведут к input-ноде с `inputType: "callback"` — текст нажатой кнопки сохраняется в переменную.

```json
{
  "type": "input",
  "data": {
    "inputVariable": "user_choice",
    "inputType": "callback",
    "inputTargetNodeId": "next_node_id"
  }
}
```

#### Сохранение метаданных медиа

Для медиа-типов (`photo`, `video`, `audio`, `document`) можно включить сохранение метаданных в отдельные переменные:

```json
{
  "type": "input",
  "data": {
    "inputVariable": "user_video",
    "inputType": "video",
    "saveMediaMetadata": true,
    "mediaMetadataSuffixes": ["thumbnail", "duration", "file_size", "file_name"],
    "mediaMetadataCustomNames": { "duration": "video_len" },
    "autoTransitionTo": "next_node_id"
  }
}
```

- `saveMediaMetadata` — включить сохранение метаданных (по умолчанию `false`)
- `mediaMetadataSuffixes` — массив суффиксов для сохранения (пустой = все)
- `mediaMetadataCustomNames` — кастомные имена переменных (ключ — суффикс, значение — имя)

Доступные суффиксы: `file_id`, `file_unique_id`, `thumbnail`, `duration`, `file_size`, `file_name`, `width`, `height`, `mime_type`, `title`, `performer`, `small_file_id`, `small_width`, `small_height`, `sizes_count`, `all_sizes`
