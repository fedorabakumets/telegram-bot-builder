# auth

Эндпоинтов: **8**

### `POST` /api/auth/dev-login

Dev-вход по Telegram ID (без proof)

**Авторизация:** Публичный

Локальный вход **без** Telegram Widget / id_token. Создаёт пользователя, ставит cookie, мигрирует **все** гостевые проекты на этого user.

**Когда доступен:** в `/admin/settings` режим `dev_login` (или env fallback, пока не выбран `telegram_widget`).
Иначе → **403** `dev-login отключён`.

**Тело:** `id` (number), `firstName` (string), опционально `username`.

**Клиент:** `AuthDevForm`, popup `/api/auth/login` в dev.

⚠️ Не использовать на проде со включённым dev-login — любой может войти под чужим ID.

```bash
curl -s -X POST http://localhost:5000/api/auth/dev-login \
  -H 'Content-Type: application/json' -c cookies.txt \
  -d '{"id":123456789,"firstName":"Иван","username":"ivan_p"}'
```

**Тело запроса:** `DevLoginRequest`

#### Пример тела запроса

```json
{
  "id": 123456789,
  "firstName": "Иван",
  "username": "ivan_p"
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сессия создана |
| 400 | Нет id или firstName |
| 403 | Режим telegram_widget / SKIP_AUTH=false |
| 429 | Rate limit auth |
| 500 | Сессия/БД |

#### Пример ответа `200`

```json
{
  "success": true,
  "user": {
    "id": 123456789,
    "firstName": "Иван",
    "lastName": "Петров",
    "username": "ivan_p",
    "photoUrl": "https://t.me/i/userpic/320/ivan_p.jpg",
    "authDate": 1710000000,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-08-08T12:00:00.000Z"
  }
}
```

### `GET` /api/auth/login

HTML-страница входа (popup)

**Авторизация:** Публичный

Отдаёт **HTML** (не JSON): Telegram Login Widget или dev-форма по режиму входа.

Открывается popup из `useTelegramLogin` (`window.open('/api/auth/login')`). После успеха страница шлёт `postMessage` родителю / вызывает `dev-login`.

```bash
curl -s http://localhost:5000/api/auth/login | head
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | HTML страница входа |

### `POST` /api/auth/logout

Выход из Studio-сессии

**Авторизация:** Публичный

Уничтожает серверную сессию и очищает cookie `connect.sid`.

Cookie **опциональна**: без `connect.sid` ответ всё равно **200** `{ success: true }` (идемпотентно — `destroySession` no-op при отсутствии сессии).

Rate limit: общий лимит mutating auth. `/api/auth/*` вне setupGuard — **503 не бывает**.

**Клиент:** кнопка «Выйти» в шапке/сайдбаре.

```bash
curl -s -X POST http://localhost:5000/api/auth/logout -b cookies.txt -c cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie. Необязательна: без неё ответ всё равно 200 (выход идемпотентен). | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сессия уничтожена (или уже не было сессии) |
| 500 | Ошибка destroy session |

#### Пример ответа `200`

```json
{
  "success": true,
  "message": "Выход выполнен"
}
```

### `GET` /api/auth/me

Текущий пользователь сессии

**Авторизация:** Публичный

Источник правды после reload страницы. **Не** меняет сессию.

- Есть cookie `connect.sid` + `telegramUser` → `{ user: {...} }`
- Нет cookie / гость → **всё равно 200** `{ user: null }` (это **не** 401)

**Параметры:** path/query/body **нет**. Единственный вход — опциональная cookie `connect.sid` (см. Parameters).

`/api/auth/*` исключены из setupGuard — **503 не бывает**.

**Клиент:** `useTelegramAuth` (React Query `['/api/auth/me']`).

```bash
curl -s http://localhost:5000/api/auth/me -b cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie после login. Необязательна: без неё `{ user: null }`. | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Пользователь из сессии или null (гость) |
| 500 | Сбой чтения session store |

#### Пример ответа `200`

```json
{
  "user": {
    "id": 123456789,
    "firstName": "Иван",
    "lastName": "Петров",
    "username": "ivan_p",
    "photoUrl": "https://t.me/i/userpic/320/ivan_p.jpg",
    "authDate": 1710000000,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-08-08T12:00:00.000Z"
  }
}
```

### `POST` /api/auth/telegram

Вход / смена аккаунта (Telegram Login Widget)

**Авторизация:** Публичный

Реальный login (не restore после reload). Создаёт/обновляет `telegram_users`, ставит cookie `connect.sid`, мигрирует гостевые проекты текущей session.

**Поля тела:** `id`, `first_name` (+ опционально last_name, username, photo_url, auth_date).
**`id_token`:** обязателен в режиме `telegram_widget` / production без skip; в dev-login режиме proof не требуется.

**Смена аккаунта:** другой `id` при уже залогиненной сессии → `regenerateSession`, `switched: true`. Проекты прошлого пользователя не переносятся.

**Клиент:** `useTelegramLogin` / Telegram Login Widget.

```bash
curl -s -X POST http://localhost:5000/api/auth/telegram \
  -H 'Content-Type: application/json' -c cookies.txt \
  -d '{"id":123456789,"first_name":"Иван","id_token":"eyJ..."}'
```

**Тело запроса:** `TelegramAuthRequest`

#### Пример тела запроса

```json
{
  "id": 123456789,
  "first_name": "Иван",
  "last_name": "Петров",
  "username": "ivan_p",
  "auth_date": 1710000000,
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Авторизация успешна, cookie установлена |
| 400 | Не передан id / битое тело |
| 401 | Нет или невалиден id_token / proof |
| 429 | Rate limit auth |

#### Пример ответа `200`

```json
{
  "success": true,
  "message": "Авторизация успешна",
  "user": {
    "id": 123456789,
    "firstName": "Иван",
    "lastName": "Петров",
    "username": "ivan_p",
    "photoUrl": "https://t.me/i/userpic/320/ivan_p.jpg",
    "authDate": 1710000000,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-08-08T12:00:00.000Z"
  },
  "switched": false
}
```

### `POST` /api/auth/telegram/logout

Выход (алиас logout)

**Авторизация:** Публичный

Тот же обработчик, что `POST /api/auth/logout` (включая идемпотентность без cookie). Оставлен для совместимости со старым клиентом.

```bash
curl -s -X POST http://localhost:5000/api/auth/telegram/logout -b cookies.txt -c cookies.txt
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `connect.sid` | cookie | нет | Session cookie. Необязательна: без неё ответ всё равно 200 (выход идемпотентен). | `"s%3Axxxx.yyyy"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сессия уничтожена (или уже не было сессии) |
| 500 | Ошибка destroy session |

#### Пример ответа `200`

```json
{
  "success": true,
  "message": "Выход выполнен"
}
```

### `POST` /api/auth/telegram/miniapp

Вход из Telegram Mini App (initData)

**Авторизация:** Публичный

Верифицирует `initData` HMAC бот-токеном (`telegram_bot_token` в admin settings), создаёт сессию. Логика смены аккаунта как у Widget (`switched`).

**Тело:** `{ "initData": "<Telegram.WebApp.initData>" }`.

В development без bot token проверка HMAC ослаблена; в production без токена — 500.

**Клиент:** `useMiniAppAuth` при открытии внутри Telegram.

```bash
curl -s -X POST http://localhost:5000/api/auth/telegram/miniapp \
  -H 'Content-Type: application/json' -c cookies.txt \
  -d '{"initData":"user=%7B%22id%22%3A123...&hash=..."}'
```

**Тело запроса:** `MiniAppAuthRequest`

#### Пример тела запроса

```json
{
  "initData": "user=%7B%22id%22%3A123456789%7D&auth_date=1710000000&hash=abc..."
}
```

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Сессия создана / обновлена |
| 400 | Нет initData или нет user в initData |
| 401 | Невалидный initData (HMAC) |
| 429 | Rate limit auth |
| 500 | Bot token не настроен (не-dev) |

#### Пример ответа `200`

```json
{
  "success": true,
  "message": "Авторизация успешна",
  "user": {
    "id": 123456789,
    "firstName": "Иван",
    "lastName": "Петров",
    "username": "ivan_p",
    "photoUrl": "https://t.me/i/userpic/320/ivan_p.jpg",
    "authDate": 1710000000,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-08-08T12:00:00.000Z"
  },
  "switched": false
}
```

### `GET` /api/auth/telegram/user/{id}

Пользователь Telegram по ID

**Авторизация:** Публичный

Публичное чтение записи из `telegram_users` по числовому id.

**Параметр path:** `id` — Telegram user id.

Не создаёт сессию и не требует cookie. Studio login на этот эндпоинт не опирается (источник правды — `GET /api/auth/me`).

```bash
curl -s http://localhost:5000/api/auth/telegram/user/123456789
```

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `id` | path | да | Числовой Telegram user id | `"123456789"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Пользователь найден |
| 400 | Невалидный id |
| 404 | Нет записи в БД |

#### Пример ответа `200`

```json
{
  "success": true,
  "user": {
    "id": 123456789,
    "firstName": "Иван",
    "lastName": "Петров",
    "username": "ivan_p",
    "photoUrl": "https://t.me/i/userpic/320/ivan_p.jpg",
    "authDate": 1710000000,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-08-08T12:00:00.000Z"
  }
}
```
