# Боты в сервисах Railway — `WORKER_RAILWAY_PROJECTS`

Панель работает на своей машине, а боты выбранных проектов — в отдельных сервисах [Railway](https://railway.com). Для пользователя всё как раньше: кнопки «Запустить», «Остановить», «Перезапустить», статус, логи и память в статистике. Остальные проекты продолжают работать на машине панели.

## Как это работает

```
Панель                                          Railway (проект tbb-bots)
──────                                          ─────────────────────────
«Запустить» бот проекта 1
  ├─ сборка кода → бакет S3 ───────────────────► бакет tbb-bot-builds
  ├─ API Railway: создать/развернуть ──────────► сервис tbb-bot-p1 (образ исполнителя)
  ├─ ping … pong ◄──────── Redis ─────────────►   └─ исполнитель
  └─ start_bot (ссылка на сборку, переменные) ►        └─ worker.py → бот
статистика, логи, статусы ◄─── Redis ─────────     бот → PostgreSQL и Redis проекта
```

1. Панель сохраняет сборку бота в S3 и создаёт на Railway сервис `tbb-bot-p<id проекта>` на образе исполнителя. Если сервис уже есть, разворачивает его заново или переиспользует работающий.
2. Ждёт ответа исполнителя (`ping` → `pong`, после деплоя — `hello`): команды, отправленные раньше, исполнитель не увидел бы.
3. Отправляет обычный `start_bot`. Исполнитель скачивает код по временной ссылке, запускает воркер и шлёт обратно логи, статусы и память.
4. Когда воркер проекта завершился, через 30 секунд деплой снимается (`deploymentRemove`), чтобы не платить за простой. Если за это время бот запущен снова (перезапуск), исполнитель переиспользуется.

У проекта на Railway свой воркер (ключ `-projectId`) независимо от `WORKER_GROUPING`. Код бота всегда приходит из S3, переменные — в команде запуска (`.env` в папке бота не пишется).

## Что нужно на Railway

В одном проекте Railway:

- **Redis** — связь панели с исполнителями. Панели нужен внешний адрес (TCP Proxy), исполнители ходят по внутреннему `${{Redis.REDIS_URL}}`.
- **PostgreSQL** — база ботов. Таблицы создаются миграциями панели (`npm run migrate` с `DATABASE_URL` этой базы). Таблицы ботов ссылаются на `bot_projects`, поэтому строки проекта, его владельца и токена должны быть и в этой базе.
- **Бакет** (S3) — сборки ботов. В панели он добавляется как хранилище S3 и указывается в `BOT_BUILDS_STORAGE_ID`. Уже сохранённые сборки переносятся командой `npm run bot-builds:move -- --to <id хранилища>`: ссылка на сборку в локальном хранилище с Railway не откроется.
- **Токен API** — токен проекта (Project Settings → Tokens) или workspace.

Образ исполнителя собирается из `Dockerfile.runner` (BuildKit, amd64 и arm64) и публикуется workflow `publish-runner.yml` в `ghcr.io/fedorabakumets/telegram-bot-builder-runner`. Пакет должен быть публичным (Package settings → Change visibility), иначе Railway его не скачает.

## Переменные панели

```env
WORKER_RAILWAY_PROJECTS=1,5              # проекты, чьи боты работают на Railway
RAILWAY_TOKEN=...                        # токен проекта Railway
# или RAILWAY_API_TOKEN=...              # токен workspace/аккаунта
RAILWAY_PROJECT_ID=...
RAILWAY_ENVIRONMENT_ID=...
RAILWAY_RUNNER_IMAGE=ghcr.io/fedorabakumets/telegram-bot-builder-runner:latest
RAILWAY_REGION=europe-west4-drams3a      # регион сервисов ботов (Амстердам); пусто — по умолчанию Railway
WORKER_RUNNER_REDIS_URL=redis://default:...@<tcp-proxy>:<port>   # Redis на Railway для панели
RAILWAY_BOT_DATABASE_URL=postgresql://...@postgres.railway.internal:5432/railway
RAILWAY_BOT_REDIS_URL=redis://default:...@redis.railway.internal:6379
BOT_ARTIFACT_SOURCE=storage
BOT_BUILDS_STORAGE_ID=<id S3-хранилища на Railway>
# Необязательно: REDIS_URL для исполнителя внутри Railway
# RAILWAY_RUNNER_REDIS_URL=${{Redis.REDIS_URL}}
```

Регион применяется при каждом развёртывании сервиса бота. Redis и PostgreSQL лучше держать в том же регионе (Service Settings → Regions), иначе каждый запрос бота к базе идёт через океан.

### База панели вместо базы на Railway

Чтобы диалоги и пользователи ботов с Railway были видны в панели, `RAILWAY_BOT_DATABASE_URL` указывает на PostgreSQL панели, открытый наружу (публичный адрес сервера или TCP-туннель). Для ботов заводится отдельная роль без прав суперпользователя:

```sql
CREATE ROLE railway_bot LOGIN PASSWORD '<случайный пароль>';
GRANT USAGE, CREATE ON SCHEMA public TO railway_bot;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO railway_bot;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO railway_bot;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO railway_bot;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO railway_bot;
```

Роль видит данные всех проектов, это временное решение до ролей на проект. Каждый запрос бота к базе идёт через интернет, поэтому база должна быть недалеко от региона Railway. Redis для состояний бота (`RAILWAY_BOT_REDIS_URL`) лучше оставить на Railway, рядом с ботом.

`RAILWAY_BOT_*` подставляются боту вместо `DATABASE_URL` и `REDIS_URL` панели, если у токена не заданы свои. Ссылки `${{VAR}}` в переменных ботов раскрываются только для `WORKER_ENV_PASSTHROUGH`, пока задан `WORKER_RAILWAY_PROJECTS`.

## Проверено

Бот проекта 1 с userbot на Railway: запуск из панели (сервис создан, исполнитель ответил, код скачан из бакета, бот подключился к PostgreSQL и Redis на Railway и принимал сообщения), остановка (деплой снят), запуск заново (новый деплой за 15 с), перезапуск без нового деплоя (9 с), перезапуск панели (бот восстановлен на том же исполнителе). После переноса Redis, PostgreSQL и сервиса бота в Амстердам (`europe-west4-drams3a`) данные сохранились, бот отвечает.

## Ограничения

- **Сообщения и пользователи бота** пишутся в базу из `RAILWAY_BOT_DATABASE_URL`. Если это база на Railway, диалоги в панели не видны; вариант с базой панели описан выше.
- **Медиа из `/uploads`** бот читает с локального диска — на Railway их нет.
- **Переменные бота** (токен, сессия userbot, адрес БД) идут через Redis открытым текстом.
- **Сигналов «жив» нет**: если сервис упал и не поднялся, бот числится запущенным.
- **Место запуска** задаётся в `.env` панели, а не в интерфейсе.
- **Отложенная остановка** живёт в памяти панели: если панель перезапустилась в эти 30 секунд, сервис остаётся развёрнутым до следующей остановки бота.
- **Сеть хоста Railway**: однажды с нового хоста в Амстердаме не открывалось соединение с `api.telegram.org` (Telethon при этом работал), бот завершил polling. Помог повторный запуск (новый деплой). Проверить можно в логах сервиса Railway, вкладка Network: к 149.154.166.110 уходят пакеты без ответа.
