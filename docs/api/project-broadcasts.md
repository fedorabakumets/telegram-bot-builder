# project-broadcasts

Эндпоинтов: **7**

### `GET` /api/projects/{projectId}/broadcasts

GET /api/projects/{projectId}/broadcasts

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/projects/{projectId}/broadcasts

POST /api/projects/{projectId}/broadcasts

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `DELETE` /api/projects/{projectId}/broadcasts/{broadcastId}

DELETE /api/projects/{projectId}/broadcasts/{broadcastId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `GET` /api/projects/{projectId}/broadcasts/{broadcastId}

GET /api/projects/{projectId}/broadcasts/{broadcastId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `PUT` /api/projects/{projectId}/broadcasts/{broadcastId}

PUT /api/projects/{projectId}/broadcasts/{broadcastId}

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/projects/{projectId}/broadcasts/{broadcastId}/stop

POST /api/projects/{projectId}/broadcasts/{broadcastId}/stop

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |

### `POST` /api/projects/{projectId}/broadcasts/preview-audience

POST /api/projects/{projectId}/broadcasts/preview-audience

**Авторизация:** Cookie (`connect.sid`) или Bearer PAT

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ |
| 401 | Требуется авторизация (сессия или Bearer PAT) |
| 503 | Приложение не настроено — настройка в /admin |
