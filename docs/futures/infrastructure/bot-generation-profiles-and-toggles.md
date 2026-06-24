## Feature: Профили генерации (минимальный код для простых ботов)

### Проблема

Сейчас даже проект с 1–2 нодами генерирует **огромный Python-файл** (тысячи строк).
Пример: бот с `/start` + одно сообщение → ~3168 строк сгенерированного кода.

Это усложняет:

- отладку (сложно найти код своего сценария среди инфраструктуры),
- поддержку (больше middleware, catch-all хендлеров, дублирования — выше шанс багов),
- старт и потребление памяти (лишние импорты и фоновые задачи даже когда сценарий их не использует),
- деплой (код требует PostgreSQL/Redis в `.env`, хотя сценарий этого не требует).

**Главный симптом:** генератор всегда включает полный рантайм-пакет (БД, Redis, FSM, deep-link, content cache, catch-all handlers, webhook-ветку и т.д.), независимо от нод и настроек.

### Про зависимости (requirements.txt) — вторично

`requirements.txt` по-прежнему генерируется как файл проекта, но **не устанавливается при каждом запуске бота**:
в `server/bots/startBot.ts` по умолчанию `SKIP_PIP_INSTALL !== 'false'` → `pip install` пропускается.
Зависимости ставятся **один раз вручную** на сервере, все боты используют общее окружение.

Поэтому для этой фичи **приоритет — уменьшение сгенерированного Python-кода**, а не оптимизация `requirements.txt`.
Параметризация `generateRequirementsTxt()` — опциональное улучшение (для документации/деплоя), но не решает основную боль.

### Что уже есть на вкладке «Бот»

Системные настройки, которые по смыслу должны влиять на состав генерируемого кода:

- `USER_DATABASE` — переключатель БД,
- `LAUNCH_MODE` + `WEBHOOK_BASE_URL` + `WEBHOOK_SECRET_TOKEN` — polling/webhook,
- `PROTECT_CONTENT`,
- `SAVE_INCOMING_MEDIA`.

Сейчас эти флаги частично попадают в `.env`, но **не режут объём Python-кода** при генерации.

### Цель

Сделать так, чтобы пользователь мог выбрать **уровень “обвязки”** и получать:

- минимальный Python-код для простых сценариев,
- расширенный рантайм только когда он действительно нужен.

### Предлагаемое решение (UI)

Добавить на вкладке «Бот» (в карточку бота / настройки проекта) новую секцию:

#### 1) Профиль генерации (главный переключатель)

`Профиль генерации`: **Минимальный / Стандартный / Расширенный**

- **Минимальный**
  - ориентирован на простые сценарии: `/start` → сообщения/кнопки
  - никаких обязательных БД/Redis в сгенерированном коде
  - минимальные middleware и минимум catch-all обработчиков
  - без фоновых задач (content reload, TTL cleanup и т.п.), если не нужны

- **Стандартный**
  - текущий “дефолт”, но без неиспользуемых блоков
  - включает только то, что требуется выбранными нодами и настройками

- **Расширенный**
  - enterprise/инфраструктурные фичи (Redis pubsub, distributed lock, расширенный логинг)
  - для продакшн-нагрузок и сложных проектов

#### 2) Тумблеры фич (тонкая настройка, опционально)

Под профилем — «Дополнительные возможности» (по умолчанию свёрнуто).
В «Минимальном» профиле большинство фич выключены и заблокированы.

### Предлагаемые переключатели (фичи рантайма)

Ниже — фичи, которые **напрямую влияют на объём сгенерированного Python-кода**.

#### A) Режим запуска

- **Launch mode**: `polling` / `webhook`
  - При `polling`: не генерировать aiohttp webhook-сервер, `set_webhook`, `SimpleRequestHandler`
  - При `webhook`: генерировать всё необходимое и валидировать конфигурацию

#### B) Персистентность / хранилища

- **User database**: `off` / `users only` / `users + messages` / `full (media/files)`
  - `off`: не генерировать `asyncpg` пул, `init_database`, миграции таблиц, `save_user_to_db`, логи сообщений
  - `users only`: только таблица пользователей и минимальные апдейты
  - `users + messages`: добавить логирование входящих/исходящих
  - `full`: медиа-таблицы, file_id cache

- **FSM storage**: `in_memory` / `postgres` / `redis`
  - `in_memory`: не генерировать `PostgresStorage` / `RedisStorage`
  - `postgres`: только если включена БД
  - `redis`: только если включён Redis

#### C) Redis (разбить на конкретные фичи)

- **Redis enabled**: off/on
  - **Distributed lock** (только polling)
  - **Pub/Sub logs**
  - **Pub/Sub content reload**
  - **Redis FSM**

#### D) Deep link и атрибуция

- **Deep-link router**: on/off — убирает `CommandStart(deep_link=True)` и связанную логику
- **Attribution tracking (utm/referrer)**: on/off

#### E) Контент / таблицы проекта

- **Content cache (`_content`)**: on/off
  - `off`: убрать `reload_content`, `_content_reload_loop`, `_content_subscribe_redis`

#### F) Медиа

- **Save incoming media**: on/off (уже есть `SAVE_INCOMING_MEDIA`)
- **file_id cache**: on/off

#### G) Интеграции

- **Userbot / Telethon**: on/off
- **Google Sheets**: on/off
- **Cron / schedule**: on/off (только если есть `schedule_trigger` ноды)

#### H) Универсальная обвязка (важно для простых ботов)

- **Catch-all handlers**: on/off — `handle_unhandled_message`, `fallback_callback_handler`, `fallback_text_handler`
- **Расширенные middleware**: on/off — логирование входящих/исходящих, stale-update filter, обёртки `send_*`
- **Аватарки пользователей**: on/off — `get_user_profile_photos` при каждом заходе в message-ноду

### Как это должно работать в генераторе

#### 1) Единый объект feature flags на вход генерации

- `generationProfile`: `'minimal' | 'standard' | 'extended'`
- `features`: набор boolean/enum флагов (см. выше)

Источники флагов:

- настройки с вкладки «Бот» (env / токен),
- автоматическое определение по нодам (нет schedule_trigger → не генерировать schedule-код),
- профиль как дефолтный набор.

#### 2) Шаблоны Python — «по необходимости»

Сейчас многие блоки присутствуют всегда, даже если конфиг их не активирует.
В идеале:

- webhook-код только при `webhook`,
- Redis pubsub/lock только при включении,
- `_content` только при включении,
- catch-all хендлеры только при включении,
- database-блок только при `USER_DATABASE=1`.

#### 3) Requirements.txt (низкий приоритет)

Опционально: параметризовать `generateRequirementsTxt()` под фичи/ноды — для документации и ручного деплоя.
На рантайм в текущей архитектуре (общее venv, `SKIP_PIP_INSTALL`) это почти не влияет.

### Минимальный ожидаемый результат

Для проекта из 1–2 message/command_trigger нод в профиле **Минимальный**:

- Python-файл на порядок меньше (сотни строк вместо тысяч),
- только нужные импорты (`aiogram`, `python-dotenv`, без `asyncpg`/`redis` если не нужны),
- нет обязательной PostgreSQL/Redis конфигурации в `.env`,
- нет фоновых задач и catch-all middleware.

### Совместимость и миграция

- Профиль по умолчанию для существующих проектов: **Стандартный** (без изменения поведения).
- Для новых проектов — предлагать «Минимальный» как быстрый старт.
- В UI: «Профиль влияет на размер сгенерированного кода; переключение требует перегенерации и перезапуска».

---

## Статус реализации (обновляется по мере работы)

Вместо одного «профиля» движемся по отдельным переключателям/автодетектам — каждый режет свой блок сгенерированного кода. Текущее состояние:

### ✅ Сделано

- **Сбор базы данных пользователей** (`USER_DATABASE` → `bot_tokens` через проект). Выключение убирает весь блок БД (пул, `init_database`, `save_user_to_db`, логирование сообщений). Под тумблером добавлен спойлer-пояснение «Что это за переключатель?».
- **Catch-all обработчики** (`CATCH_ALL_HANDLERS`, поле `bot_tokens.catch_all_handlers`, default 1). Гейтит `handle_unhandled_message` / `handle_unhandled_photo` / `fallback_callback_handler`. **Предохранитель-автодетект**: при наличии `incoming_*_trigger` или динамических кнопок генерируются принудительно. Тест: `lib/tests/test-phase67-catch-all.ts`.
- **Защита от копирования** (`PROTECT_CONTENT`, поле `bot_tokens.protect_content`, default 0). Гейтит `_wrap_bot_protect_content` и обёртки `send_*`. Тест: `test-phase68-protect-content.ts`.
- **Живое обновление контента** (`CONTENT_CACHE`, поле `bot_tokens.content_cache`, default 1). Гейтит машинерию live-reload (`load_content` / `reload_content` / `_content_reload_loop` / `_content_subscribe_redis`); аксессор `get_content` / `_content_cache` остаётся всегда. Дополнительно гейтится по БД (`generateContentResult = contentCache && userDatabaseEnabled`), т.к. `_content` читается через `db_pool`; тумблер в UI скрыт при выключенной БД. Тест: `test-phase69-content-cache.ts`.

### 🔧 Сопутствующие фиксы генерации при выключенной БД

- `db_pool = None` объявляется всегда (защита от `NameError` в коде контента и `main()`).
- `stale_update_filter_middleware` генерируется всегда (его безусловно регистрирует `main()`).
- Тесты: `test-phase66-db-toggle.ts`.

### 📋 Кандидаты дальше (по приоритету)

1. **Режим запуска `polling` / `webhook`** — поле `bot_tokens.launch_mode` уже есть. При `polling` не генерировать webhook-ветку (`aiohttp`, `SimpleRequestHandler`, `set_webhook`) и валидацию «REDIS_URL обязателен». Низкий риск.
2. **Redis (off/on)** — самый крупный блок (`init_redis_client`, `RedisStorage`, distributed-lock + refresh, `_RedisLogHandler`, pub/sub). **Предохранитель**: при `webhook` Redis обязателен → принудительно on. Делать после (1).
3. **FSM-хранилище** (`in_memory` / `postgres` / `redis`) — `PostgresStorage` генерируется всегда; при БД off + Redis off логичнее `MemoryStorage`. Заодно закрывает латентный риск с `update_user_data_in_db`.
4. **Фильтр устаревших апдейтов** (`stale_update_filter_middleware`) — тумблер «Игнорировать старые апдейты».
5. **Отслеживание источников** (utm / deep_link / referrer) — меньший объём; автодетект по наличию deep-link сценариев.

### Паттерн реализации тумблера (закреплён)

1. Поле `bot_tokens.<flag>` (default сохраняет текущее поведение) + миграция `migrations/000N_*.sql` + дубль-страховка в `server/database/init-db.ts`.
2. Сервер: PUT `/api/projects/:projectId/tokens/:tokenId/<flag>`, запись в `.env`, маппинг `ENV_KEY → поле` в `tokenFieldMap`.
3. lib: опция в `GeneratePythonCodeOptions` + `GenerationOptions`, флаг в `computeFeatureFlags`, гейт в шаблоне (`{%- if flag %}`), при необходимости предохранитель-автодетект через предикат в `node-predicates.ts`.
4. UI: компонент-тумблер в карточке бота (`client/components/editor/bot/card/`), подключение в `BotSettingsGrid`.
5. Фазовый тест `lib/tests/test-phaseNN-*.ts` (включая `py_compile`) + обновление `docs/`.
