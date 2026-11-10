# project-dialogs

Эндпоинтов: **9**

### `POST` /api/projects/{projectId}/chat-access-checks

Запустить фоновую проверку личных диалогов

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Одна активная проверка на бота; 201 означает созданную задачу, а не завершённую проверку.

**Operation ID:** `post_api_projects_projectId_chat_access_checks_65c4bd9c45e313e5`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | — |
| `tokenId` | query | нет | — | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 201 | Созданная задача |
| 400 | Некорректные параметры либо завершённая задача |
| 401 | Нет авторизации |
| 403 | Нет доступа к проекту |
| 404 | Бот или задача не найдены в проекте |
| 409 | Проверка уже выполняется |

### `POST` /api/projects/{projectId}/chat-access-checks/{jobId}/cancel

Отменить оставшуюся очередь проверки

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `post_api_projects_projectId_chat_access_checks_jobId_cancel_c5209e0545070ea5`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | — |
| `jobId` | path | да | — | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Состояние cancelling либо cancelled |
| 400 | Некорректные параметры либо завершённая задача |
| 401 | Нет авторизации |
| 403 | Нет доступа к проекту |
| 404 | Бот или задача не найдены в проекте |

### `GET` /api/projects/{projectId}/chat-access-checks/active

Прочитать активную или последнюю проверку бота

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `get_api_projects_projectId_chat_access_checks_active_8527b43acc9e3e34`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | — |
| `tokenId` | query | да | — | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Задача либо null |
| 400 | Некорректные параметры либо завершённая задача |
| 401 | Нет авторизации |
| 403 | Нет доступа к проекту |
| 404 | Бот или задача не найдены в проекте |

### `POST` /api/projects/{projectId}/dialogs/{chatId}/check-access

Проверить личный чат действием typing и сохранить результат

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

**Operation ID:** `post_api_projects_projectId_dialogs_chatId_check_access_e21728a51784aab3`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | — |
| `chatId` | path | да | — | — |
| `tokenId` | query | да | — | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Известный результат проверки |
| 400 | Параметры отклонены либо Telegram дал неопределённый результат |
| 401 | Нет авторизации |
| 403 | Нет доступа к проекту |
| 404 | Бот или задача не найдены в проекте |
| 500 | Ошибка проверки; сохранённый статус приложен, если запись удалась |

### `GET` /api/projects/{projectId}/users/{userId}/avatar

Аватар пользователя или бота (прокси)

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Проксирует фото профиля из Telegram (или кэш `avatar_url` / `bot_photo_url`). `userId=bot` или id бота — аватар бота проекта.

**Ответ 200:** бинарное изображение (`image/jpeg` и т.п.), Cache-Control 1 день.

**Клиент:** `user-avatar`, PanelHeader диалогов.

```bash
curl -s -o avatar.jpg -b cookies.txt \
  'http://localhost:5000/api/projects/42/users/123456789/avatar?tokenId=7'
```

**Operation ID:** `get_api_projects_projectId_users_userId_avatar_483774e31eef1a3c`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

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

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Удаляет все `bot_messages` пользователя в скоупе проекта/токена. Не удаляет сообщения в Telegram — только запись в Studio БД.

UI сейчас почти не вызывает; API доступен для очистки истории.

```bash
curl -s -X DELETE -b cookies.txt \
  'http://localhost:5000/api/projects/42/users/123456789/messages?tokenId=7'
```

**Operation ID:** `delete_api_projects_projectId_users_userId_messages_1d662a13069a1d0b`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

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

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Последние N сообщений `bot_messages` (+ media), в хронологическом порядке. По умолчанию limit=100. Фильтр `messageType=user|bot`. Скоуп по `tokenId`.

`includeGroupContext=true` добавляет входящие сообщения этого человека в группах выбранного бота, с `chatType`, `chatId`, `sourceChatTitle`. Без параметра возвращается только личная история. Групповые ответы бота исключены; отправка из личной панели остаётся личной.

**Клиент:** панель диалога, last-message, детали пользователя.

```bash
curl -s -b cookies.txt \
  'http://localhost:5000/api/projects/42/users/123456789/messages?tokenId=7&limit=50'
```

**Operation ID:** `get_api_projects_projectId_users_userId_messages_64c347b5b3d4ec78`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `includeGroupContext` | query | нет | По умолчанию только личная история; true включает групповой контекст пользователя. | — |
| `limit` | query | нет | Лимит последних сообщений (default 100) | `"100"` |
| `messageType` | query | нет | Фильтр по типу сообщения | `"bot"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

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

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Шлёт текст/медиа/кнопки через Telegram Bot API, пишет в `bot_messages`, публикует WS `new-message`. Подставляет переменные из `user_data`.

**Тело:** `messageText`, опционально `mediaUrls`, `buttons`, `buttonsPerRow`. Нужен токен проекта (`tokenId` в query или default).

**Клиент:** поле ввода панели диалога (`use-send-message`).

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  'http://localhost:5000/api/projects/42/users/123456789/send-message?tokenId=7' \
  -d '{"messageText":"Здравствуйте!"}'
```

**Operation ID:** `post_api_projects_projectId_users_userId_send_message_7ea96c32bb8f279e`

**Тело запроса:** `SendDialogMessageRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

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

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

Берёт узел по `nodeId` из `project.data`, рендерит текст/медиа/кнопки (с переменными) и шлёт через бота. В `messageData` помечает `sentFromAdmin` + `nodeId`.

**Клиент:** «Отправить ноду» в диалоге (`use-send-node`).

```bash
curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \
  'http://localhost:5000/api/projects/42/users/123456789/send-node-message?tokenId=7' \
  -d '{"nodeId":"welcome-msg"}'
```

**Operation ID:** `post_api_projects_projectId_users_userId_send_node_message_14261f78c452585c`

**Тело запроса:** `SendNodeMessageRequest`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | ID проекта | `"42"` |
| `userId` | path | да | Telegram user_id (или `bot` для аватара бота) | `"123456789"` |
| `tokenId` | query | нет | ID токена бота проекта | `"7"` |
| `Authorization` | header | нет | Authorization: Bearer mcp_… — PAT агента (альтернатива cookie) | `"Bearer mcp_xxxxxxxx"` |
| `connect.sid` | cookie | нет | Session cookie после login. Не нужна при Authorization: Bearer mcp_… | `"s%3Axxxx.yyyy"` |

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
