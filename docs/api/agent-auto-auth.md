# agent-auto-auth

Эндпоинтов: **2**

### `POST` /api/auth/agent/disconnect

Отключить доступ доверенного агента

**Авторизация:** Публичный

Только сервер агента. Конструктор доверяет удостоверению отправителя этим сервером. HMAC-SHA256 подписывает METHOD + LF + PATH + LF + TIMESTAMP + LF + NONCE + LF + SHA256(raw body). Лимиты: 10/мин на пользователя, 300/мин на агента, 20 неверных подписей/мин на IP. PAT: read,write, без bot_manager, 24 часа, обновление за 5 минут; старый PAT доживает свой срок. Отключение отзывает все связанные PAT. Восстановление только браузерной сессией владельца. Не является инструментом MCP. Ответ Cache-Control: no-store.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `X-Agent-Id` | header | да | Идентификатор доверенного агента | — |
| `X-Agent-Timestamp` | header | да | Unix timestamp, допуск 60 секунд | — |
| `X-Agent-Nonce` | header | да | 16 случайных байт hex; хранится в Redis 120 секунд | — |
| `X-Agent-Signature` | header | да | HMAC-SHA256, lowercase hex | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успех |
| 400 | INVALID_REQUEST |
| 401 | UNAUTHORIZED: подпись или время |
| 403 | CONNECTION_REVOKED или AUTO_AUTH_NOT_ALLOWED |
| 409 | REPLAY_DETECTED |
| 429 | RATE_LIMITED |
| 503 | AUTO_AUTH_UNAVAILABLE: ключ, Redis или БД недоступны |

### `POST` /api/auth/agent/telegram

Доверенный обмен Telegram ID на PAT

**Авторизация:** Публичный

Только сервер агента. Конструктор доверяет удостоверению отправителя этим сервером. HMAC-SHA256 подписывает METHOD + LF + PATH + LF + TIMESTAMP + LF + NONCE + LF + SHA256(raw body). Лимиты: 10/мин на пользователя, 300/мин на агента, 20 неверных подписей/мин на IP. PAT: read,write, без bot_manager, 24 часа, обновление за 5 минут; старый PAT доживает свой срок. Отключение отзывает все связанные PAT. Восстановление только браузерной сессией владельца. Не является инструментом MCP. Ответ Cache-Control: no-store.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `X-Agent-Id` | header | да | Идентификатор доверенного агента | — |
| `X-Agent-Timestamp` | header | да | Unix timestamp, допуск 60 секунд | — |
| `X-Agent-Nonce` | header | да | 16 случайных байт hex; хранится в Redis 120 секунд | — |
| `X-Agent-Signature` | header | да | HMAC-SHA256, lowercase hex | — |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успех |
| 400 | INVALID_REQUEST |
| 401 | UNAUTHORIZED: подпись или время |
| 403 | CONNECTION_REVOKED или AUTO_AUTH_NOT_ALLOWED |
| 409 | REPLAY_DETECTED |
| 429 | RATE_LIMITED |
| 503 | AUTO_AUTH_UNAVAILABLE: ключ, Redis или БД недоступны |
