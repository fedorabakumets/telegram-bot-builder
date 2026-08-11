# project-dialogs

Эндпоинтов: **5**

### `GET` /api/projects/{projectId}/users/{userId}/avatar

Аватар пользователя или бота (прокси)

**Авторизация:** Cookie (`connect.sid`)

Проксирует фото профиля из Telegram (или кэш `avatar_url` / `bot_photo_url`). `userId=bot` или id бота — аватар бота проекта.

**Ответ 200:** бинарное изображение (`image/jpeg` и т.п.), Cache-Control 1 день.

**Клиент:** `user-avatar`, PanelHeader диалогов.

```bash
curl -s -o avatar.jpg -b cookies.txt \
  'http://localhost:5000/api/projects/42/users/123456789/avatar?tokenId=7'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Байты изображения |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 404 | Нет фото / не удалось скачать |
| 500 | Ошибка прокси / БД |

### `DELETE` /api/projects/{projectId}/users/{userId}/messages

Удалить историю сообщений диалога

**Авторизация:** Cookie (`connect.sid`)

Удаляет все `bot_messages` пользователя в скоупе проекта/токена. Не удаляет сообщения в Telegram — только запись в Studio БД.

UI сейчас почти не вызывает; API доступен для очистки истории.

```bash
curl -s -X DELETE -b cookies.txt \
  'http://localhost:5000/api/projects/42/users/123456789/messages?tokenId=7'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | История очищена |
| 400 | Неверный projectId |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
{
  "message": "Сообщения успешно удалены",
  "deleted": true
}
```

### `GET` /api/projects/{projectId}/users/{userId}/messages

История сообщений диалога

**Авторизация:** Cookie (`connect.sid`)

Последние N сообщений `bot_messages` (+ media), в хронологическом порядке. По умолчанию limit=100. Фильтр `messageType=user|bot`. Скоуп по `tokenId`.

**Клиент:** панель диалога, last-message, детали пользователя.

```bash
curl -s -b cookies.txt \
  'http://localhost:5000/api/projects/42/users/123456789/messages?tokenId=7&limit=50'
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `limit` | query | нет | — | `"100"` |
| `messageType` | query | нет | — | `"bot"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Массив сообщений (может быть пустым) |
| 400 | Неверный projectId |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 500 | Ошибка БД |

#### Пример ответа `200`

```json
[
  {
    "id": 501,
    "projectId": 42,
    "tokenId": 7,
    "userId": "123456789",
    "messageType": "bot",
    "messageText": "Привет! Чем могу помочь?",
    "messageData": {
      "sentFromAdmin": true
    },
    "telegramMessageId": 1001,
    "createdAt": "2026-08-11T15:00:00.000Z",
    "media": []
  }
]
```

### `POST` /api/projects/{projectId}/users/{userId}/send-message

Отправить сообщение пользователю от бота

**Авторизация:** Cookie (`connect.sid`)

Шлёт текст/медиа/кнопки через Telegram Bot API, пишет в `bot_messages`, публикует WS `new-message`. Подставляет переменные из `user_data`.

**Тело:** `messageText`, опционально `mediaUrls`, `buttons`, `buttonsPerRow`. Нужен токен проекта (`tokenId` в query или default).

**Клиент:** поле ввода панели диалога (`use-send-message`).

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  'http://localhost:5000/api/projects/42/users/123456789/send-message?tokenId=7' \
  -d '{"messageText":"Здравствуйте!"}'
```

**Тело запроса:** `SendDialogMessageRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "messageText": "Здравствуйте!",
  "mediaUrls": [],
  "buttons": [],
  "buttonsPerRow": 0
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Отправлено в Telegram и сохранено |
| 400 | Валидация / нет токена / нечего отправлять |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |

#### Пример ответа `200`

```json
{
  "message": "Сообщение успешно отправлено",
  "result": {
    "ok": true,
    "result": {
      "message_id": 1002
    }
  }
}
```

### `POST` /api/projects/{projectId}/users/{userId}/send-node-message

Отправить содержимое узла сценария пользователю

**Авторизация:** Cookie (`connect.sid`)

Берёт узел по `nodeId` из `project.data`, рендерит текст/медиа/кнопки (с переменными) и шлёт через бота. В `messageData` помечает `sentFromAdmin` + `nodeId`.

**Клиент:** «Отправить ноду» в диалоге (`use-send-node`).

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  'http://localhost:5000/api/projects/42/users/123456789/send-node-message?tokenId=7' \
  -d '{"nodeId":"welcome-msg"}'
```

**Тело запроса:** `SendNodeMessageRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `connect.sid` | cookie | нет | Session cookie после login. Альтернатива — Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

#### Пример тела запроса

```json
{
  "nodeId": "welcome-msg",
  "userData": {
    "order_id": "A-100"
  }
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Узел отправлен |
| 400 | Нет nodeId / нет токена |
| 401 | Нет session / PAT |
| 403 | Нет доступа к проекту |
| 404 | Проект или узел не найден |

#### Пример ответа `200`

```json
{
  "message": "Сообщение успешно отправлено",
  "result": {
    "ok": true,
    "result": {
      "message_id": 1002
    }
  }
}
```
