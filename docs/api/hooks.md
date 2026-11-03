# hooks

Эндпоинтов: **5**

### `DELETE` /api/hooks/{projectId}/{path}

HTTP hook (DELETE) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

**Operation ID:** `delete_api_hooks_projectId_path_6bb8683369057bfc`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успех api_response; произвольное тело, обычно JSON, либо дефолт {"ok":true} |
| 400 | Node: {"error":"invalid_project"}; Python: {"error":"bad_request"}; возможен пользовательский ответ |
| 401 | Python: {"error":"invalid_secret"}; возможен пользовательский ответ |
| 405 | Python: {"error":"method_not_allowed"}; возможен пользовательский ответ |
| 413 | Node/Python: {"error":"payload_too_large"}; возможен пользовательский ответ |
| 429 | Node: {"error":"rate_limit"}; возможен пользовательский ответ |
| 500 | Python: {"error":"internal_error"}; возможен пользовательский ответ |
| 502 | Node: {"error":"proxy_error"}, включая таймаут fetch 35 секунд; возможен пользовательский ответ |
| 503 | Node: {"error":"bot_offline"}; возможен пользовательский ответ |
| 504 | Python: {"error":"timeout"}, если api_response не получен за 30 секунд; возможен пользовательский ответ |
| default | Любой другой статус и Content-Type upstream api_response; общей формы тела нет |

### `GET` /api/hooks/{projectId}/{path}

HTTP hook (GET) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

**Operation ID:** `get_api_hooks_projectId_path_6b536855fc08eea9`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успех api_response; произвольное тело, обычно JSON, либо дефолт {"ok":true} |
| 400 | Node: {"error":"invalid_project"}; Python: {"error":"bad_request"}; возможен пользовательский ответ |
| 401 | Python: {"error":"invalid_secret"}; возможен пользовательский ответ |
| 405 | Python: {"error":"method_not_allowed"}; возможен пользовательский ответ |
| 413 | Node/Python: {"error":"payload_too_large"}; возможен пользовательский ответ |
| 429 | Node: {"error":"rate_limit"}; возможен пользовательский ответ |
| 500 | Python: {"error":"internal_error"}; возможен пользовательский ответ |
| 502 | Node: {"error":"proxy_error"}, включая таймаут fetch 35 секунд; возможен пользовательский ответ |
| 503 | Node: {"error":"bot_offline"}; возможен пользовательский ответ |
| 504 | Python: {"error":"timeout"}, если api_response не получен за 30 секунд; возможен пользовательский ответ |
| default | Любой другой статус и Content-Type upstream api_response; общей формы тела нет |

### `PATCH` /api/hooks/{projectId}/{path}

HTTP hook (PATCH) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

**Operation ID:** `patch_api_hooks_projectId_path_1b433194624f4103`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успех api_response; произвольное тело, обычно JSON, либо дефолт {"ok":true} |
| 400 | Node: {"error":"invalid_project"}; Python: {"error":"bad_request"}; возможен пользовательский ответ |
| 401 | Python: {"error":"invalid_secret"}; возможен пользовательский ответ |
| 405 | Python: {"error":"method_not_allowed"}; возможен пользовательский ответ |
| 413 | Node/Python: {"error":"payload_too_large"}; возможен пользовательский ответ |
| 429 | Node: {"error":"rate_limit"}; возможен пользовательский ответ |
| 500 | Python: {"error":"internal_error"}; возможен пользовательский ответ |
| 502 | Node: {"error":"proxy_error"}, включая таймаут fetch 35 секунд; возможен пользовательский ответ |
| 503 | Node: {"error":"bot_offline"}; возможен пользовательский ответ |
| 504 | Python: {"error":"timeout"}, если api_response не получен за 30 секунд; возможен пользовательский ответ |
| default | Любой другой статус и Content-Type upstream api_response; общей формы тела нет |

### `POST` /api/hooks/{projectId}/{path}

HTTP hook (POST) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

**Operation ID:** `post_api_hooks_projectId_path_a0f0e44d295f4838`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успех api_response; произвольное тело, обычно JSON, либо дефолт {"ok":true} |
| 400 | Node: {"error":"invalid_project"}; Python: {"error":"bad_request"}; возможен пользовательский ответ |
| 401 | Python: {"error":"invalid_secret"}; возможен пользовательский ответ |
| 405 | Python: {"error":"method_not_allowed"}; возможен пользовательский ответ |
| 413 | Node/Python: {"error":"payload_too_large"}; возможен пользовательский ответ |
| 429 | Node: {"error":"rate_limit"}; возможен пользовательский ответ |
| 500 | Python: {"error":"internal_error"}; возможен пользовательский ответ |
| 502 | Node: {"error":"proxy_error"}, включая таймаут fetch 35 секунд; возможен пользовательский ответ |
| 503 | Node: {"error":"bot_offline"}; возможен пользовательский ответ |
| 504 | Python: {"error":"timeout"}, если api_response не получен за 30 секунд; возможен пользовательский ответ |
| default | Любой другой статус и Content-Type upstream api_response; общей формы тела нет |

### `PUT` /api/hooks/{projectId}/{path}

HTTP hook (PUT) — api_trigger

**Авторизация:** Публичный

**Публичный** эндпоинт для сервер-сервер интеграций. Путь в allowlist `requireApiAuth` (`/hooks/`).

**Поток:** Node → `http://localhost:{9000+tokenId}{apiPath}` → Python `api_trigger`.

**Auth:** `X-Api-Secret` или `Authorization: Bearer` (проверка в Python).

См. также `docs/api/hooks.md`.

**Operation ID:** `put_api_hooks_projectId_path_f9b9515179d50273`

#### Параметры

| Имя | In | Обязательный | Описание | Пример |
|-----|-----|--------------|----------|--------|
| `projectId` | path | да | — | `"42"` |
| `path` | path | да | — | `"payment"` |

#### Ответы

| Код | Описание |
|-----|----------|
| 200 | Успех api_response; произвольное тело, обычно JSON, либо дефолт {"ok":true} |
| 400 | Node: {"error":"invalid_project"}; Python: {"error":"bad_request"}; возможен пользовательский ответ |
| 401 | Python: {"error":"invalid_secret"}; возможен пользовательский ответ |
| 405 | Python: {"error":"method_not_allowed"}; возможен пользовательский ответ |
| 413 | Node/Python: {"error":"payload_too_large"}; возможен пользовательский ответ |
| 429 | Node: {"error":"rate_limit"}; возможен пользовательский ответ |
| 500 | Python: {"error":"internal_error"}; возможен пользовательский ответ |
| 502 | Node: {"error":"proxy_error"}, включая таймаут fetch 35 секунд; возможен пользовательский ответ |
| 503 | Node: {"error":"bot_offline"}; возможен пользовательский ответ |
| 504 | Python: {"error":"timeout"}, если api_response не получен за 30 секунд; возможен пользовательский ответ |
| default | Любой другой статус и Content-Type upstream api_response; общей формы тела нет |
