# hooks

Эндпоинтов: **5**

### `DELETE` /api/hooks/{projectId}/{path}

HTTP hook (DELETE) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ из api_response или дефолт {"ok":true} |
| 401 | invalid_secret |
| 413 | payload_too_large |
| 429 | rate_limit |
| 503 | bot_offline |
| 504 | timeout (нет api_response за 30 с) |

### `GET` /api/hooks/{projectId}/{path}

HTTP hook (GET) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ из api_response или дефолт {"ok":true} |
| 401 | invalid_secret |
| 413 | payload_too_large |
| 429 | rate_limit |
| 503 | bot_offline |
| 504 | timeout (нет api_response за 30 с) |

### `PATCH` /api/hooks/{projectId}/{path}

HTTP hook (PATCH) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ из api_response или дефолт {"ok":true} |
| 401 | invalid_secret |
| 413 | payload_too_large |
| 429 | rate_limit |
| 503 | bot_offline |
| 504 | timeout (нет api_response за 30 с) |

### `POST` /api/hooks/{projectId}/{path}

HTTP hook (POST) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ из api_response или дефолт {"ok":true} |
| 401 | invalid_secret |
| 413 | payload_too_large |
| 429 | rate_limit |
| 503 | bot_offline |
| 504 | timeout (нет api_response за 30 с) |

### `PUT` /api/hooks/{projectId}/{path}

HTTP hook (PUT) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успешный ответ из api_response или дефолт {"ok":true} |
| 401 | invalid_secret |
| 413 | payload_too_large |
| 429 | rate_limit |
| 503 | bot_offline |
| 504 | timeout (нет api_response за 30 с) |
