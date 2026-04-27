# Промт для ИИ: редактирование JSON сценария бота

Ты редактируешь JSON-структуру Telegram-бота. Ниже — полное описание формата.

---

## Верхний уровень (BotDataWithSheets)

```json
{
  "version": 2,
  "activeSheetId": "sheet-id",
  "sheets": [ ...листы... ]
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `version` | number | Версия формата, всегда `2` |
| `activeSheetId` | string | ID активного листа |
| `sheets` | Sheet[] | Массив листов холста |

---

## Лист (Sheet)

```json
{
  "id": "FnLYhGUixLRUzeobS3May",
  "name": "Старт / Меню",
  "nodes": [ ...узлы... ],
  "viewState": { "pan": { "x": 0, "y": 0 }, "zoom": 100 }
}
```

---

## Узел (Node)

```json
{
  "id": "уникальный-id",
  "type": "тип_узла",
  "position": { "x": 100, "y": 200 },
  "data": { ...данные зависят от типа... }
}
```

---

## Типы триггеров

| Тип | Когда срабатывает |
|-----|-------------------|
| `command_trigger` | Команда `/start`, `/help` и т.д. |
| `text_trigger` | Текстовое сообщение (точное / содержит) |
| `incoming_message_trigger` | Любое входящее сообщение |
| `incoming_callback_trigger` | Callback от inline-кнопки |
| `callback_trigger` | Конкретный `callback_data` |
| `group_message_trigger` | Сообщение в группе |
| `managed_bot_updated_trigger` | Обновление управляемого бота |

### Поля command_trigger

```json
{
  "type": "command_trigger",
  "data": {
    "command": "/start",
    "description": "Запустить бота",
    "showInMenu": true,
    "autoTransitionTo": "nodeId"
  }
}
```

### Поля text_trigger

```json
{
  "type": "text_trigger",
  "data": {
    "textMatchType": "exact",
    "textSynonyms": ["привет", "хай"],
    "autoTransitionTo": "nodeId"
  }
}
```

---

## Типы контент-узлов

### message — отправить сообщение

```json
{
  "type": "message",
  "data": {
    "messageText": "Текст сообщения, поддерживает {переменные}",
    "markdown": false,
    "keyboardType": "none",
    "buttons": [],
    "collectUserInput": false,
    "inputVariable": "имя_переменной",
    "enableTextInput": true,
    "enablePhotoInput": false,
    "enableVideoInput": false,
    "enableAudioInput": false,
    "enableDocumentInput": false,
    "conditionalMessages": [],
    "enableConditionalMessages": false,
    "adminOnly": false,
    "requiresAuth": false,
    "isPrivateOnly": false,
    "enableStatistics": true
  }
}
```

### http_request — HTTP запрос

```json
{
  "type": "http_request",
  "data": {
    "httpRequestUrl": "https://api.example.com/data?id={user_id}",
    "httpRequestMethod": "GET",
    "httpRequestHeaders": "{\"Authorization\": \"Bearer {token}\"}",
    "httpRequestBody": "{\"key\": \"{value}\"}",
    "httpRequestTimeout": 30,
    "httpRequestResponseVariable": "response_var",
    "autoTransitionTo": "next_node_id"
  }
}
```

Переменные в URL, заголовках и теле задаются через `{имя_переменной}`.

#### Получение файла (base64)

```json
{
  "type": "http_request",
  "data": {
    "httpRequestUrl": "https://api.example.com/export/project.json",
    "httpRequestMethod": "GET",
    "httpRequestResponseFormat": "file",
    "httpRequestResponseVariable": "export_file",
    "autoTransitionTo": "send-file-node"
  }
}
```

При `httpRequestResponseFormat: "file"` ответ сохраняется как объект:
```json
{
  "type": "file",
  "data": "base64...",
  "mimeType": "application/json",
  "fileName": "project.json"
}
```

Этот объект можно передать в медиа-ноду через `{export_file}` для отправки файла пользователю.

### condition — ветвление

```json
{
  "type": "condition",
  "data": {
    "variable": "имя_переменной",
    "branches": [
      {
        "id": "branch-1",
        "label": "Равно 1",
        "operator": "equals",
        "value": "1",
        "target": "node_id_if_true"
      },
      {
        "id": "branch-else",
        "label": "Иначе",
        "operator": "else",
        "value": "",
        "target": "node_id_else"
      }
    ]
  }
}
```

Операторы: `equals`, `not_equals`, `contains`, `not_contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`, `else`

### input — ожидать ввод пользователя

```json
{
  "type": "input",
  "data": {
    "inputVariable": "user_answer",
    "inputPrompt": "Введите ваш ответ:",
    "inputType": "text",
    "autoTransitionTo": "next_node_id"
  }
}
```

### broadcast — рассылка

```json
{
  "type": "broadcast",
  "data": {
    "messageText": "Текст рассылки",
    "autoTransitionTo": "next_node_id"
  }
}
```

---

## Медиа-узлы

| Тип | Описание |
|-----|----------|
| `photo` | Отправить фото (`imageUrl`) |
| `video` | Отправить видео (`videoUrl`) |
| `audio` | Отправить аудио (`audioUrl`) |
| `document` | Отправить документ (`documentUrl`, `documentName`) |
| `sticker` | Отправить стикер |
| `animation` | Отправить GIF |
| `location` | Отправить геолокацию |
| `contact` | Отправить контакт |

Все медиа-узлы поддерживают `mediaCaption` — подпись.

---

## Действия с сообщениями

| Тип | Описание |
|-----|----------|
| `edit_message` | Редактировать сообщение |
| `delete_message` | Удалить сообщение |
| `pin_message` | Закрепить сообщение |
| `unpin_message` | Открепить сообщение |
| `forward_message` | Переслать сообщение |
| `answer_callback_query` | Ответить на callback (всплывающее уведомление) |

---

## Действия с пользователями (группы)

| Тип | Описание |
|-----|----------|
| `ban_user` | Забанить пользователя |
| `unban_user` | Разбанить |
| `mute_user` | Замутить |
| `unmute_user` | Размутить |
| `kick_user` | Кикнуть |
| `promote_user` | Назначить администратором |
| `demote_user` | Снять права администратора |
| `admin_rights` | Установить конкретные права |

---

## Кнопки (Button)

Кнопки задаются в `data.buttons[]` узла. Тип клавиатуры задаётся в `data.keyboardType`:
- `"none"` — без клавиатуры
- `"reply"` — reply-клавиатура (под полем ввода)
- `"inline"` — inline-кнопки (под сообщением)

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

### Действия кнопок (action)

| action | Описание | Доп. поля |
|--------|----------|-----------|
| `goto` | Перейти на узел | `target: "nodeId"` |
| `url` | Открыть URL | `url: "https://..."` |
| `web_app` | Открыть Mini App | `webAppUrl: "https://..."` |
| `copy_text` | Скопировать текст | `copyText: "текст"` |
| `command` | Выполнить команду | — |
| `contact` | Запросить контакт | `requestContact: true` |
| `location` | Запросить геолокацию | `requestLocation: true` |
| `selection` | Выбор из списка | — |
| `complete` | Завершить сбор данных | — |
| `request_managed_bot` | Создать управляемого бота | `suggestedBotName`, `suggestedBotUsername` |

### Стили кнопок (style)

| Значение | Цвет |
|----------|------|
| `primary` | Синий |
| `success` | Зелёный |
| `danger` | Красный |

---

## Переменные

Переменные используются в `messageText`, `httpRequestUrl`, `httpRequestBody` и других полях через синтаксис `{имя_переменной}`.

Вложенные поля из HTTP-ответа: `{response.data.user.name}`

Системные переменные:
- `{user_id}` — Telegram ID пользователя
- `{username}` — username пользователя
- `{first_name}`, `{last_name}` — имя пользователя
- `{callback_data}` — данные нажатой кнопки

---

### Переменная типа `file`

HTTP-узел с `httpRequestResponseFormat: "file"` сохраняет ответ как объект:

| Поле | Тип | Описание |
|------|-----|----------|
| `type` | `"file"` | Маркер типа переменной |
| `data` | `string` | Содержимое файла в base64 |
| `mimeType` | `string` | MIME-тип файла |
| `fileName` | `string` | Имя файла при отправке |

Используется в медиа-ноде через `{имя_переменной}` — файл отправляется через `BufferedInputFile` без сохранения на диск.

---

## Связи между узлами

Узлы связываются через:
- `data.autoTransitionTo: "nodeId"` — автоматический переход после выполнения
- `data.buttons[].target: "nodeId"` — переход по кнопке
- `data.branches[].target: "nodeId"` — переход по ветке условия

---

## Пример минимального сценария

```json
{
  "version": 2,
  "activeSheetId": "sheet1",
  "sheets": [{
    "id": "sheet1",
    "name": "Главный",
    "nodes": [
      {
        "id": "cmd-start",
        "type": "command_trigger",
        "position": { "x": 0, "y": 0 },
        "data": {
          "command": "/start",
          "description": "Запустить бота",
          "showInMenu": true,
          "autoTransitionTo": "msg-hello"
        }
      },
      {
        "id": "msg-hello",
        "type": "message",
        "position": { "x": 300, "y": 0 },
        "data": {
          "messageText": "Привет, {first_name}! Выбери действие:",
          "keyboardType": "inline",
          "buttons": [
            { "id": "btn1", "text": "О нас", "action": "goto", "target": "msg-about" },
            { "id": "btn2", "text": "Сайт", "action": "url", "url": "https://example.com" }
          ]
        }
      }
    ]
  }]
}
```

---

## Где смотреть в коде

| Что | Где |
|-----|-----|
| Схема узлов | `shared/schema/tables/node-schema.ts` |
| Схема кнопок | `shared/schema/tables/button-schema.ts` |
| Схема листов | `shared/schema/tables/bot-sheets.ts` |
| Генератор Python | `lib/bot-generator.ts` |
| Шаблоны генерации | `lib/templates/` |
| Примеры JSON | `bots/*/project.json` |
| Типы condition | `shared/types/condition-node.ts` |
