# Площадка на Railway из шаблона `tbb-site`

Площадка — это исполнитель ботов с собственными Redis и PostgreSQL в аккаунте Railway пользователя. Разворачивается одной кнопкой: [railway.com/deploy/tbb-site](https://railway.com/deploy/tbb-site).

## Что внутри

| Сервис | Образ | Наружу |
|---|---|---|
| `Runner` | `ghcr.io/fedorabakumets/telegram-bot-builder-runner:latest` | нет |
| `Redis` | `redis:8.2`, том `/data` | TCP Proxy → `REDIS_PUBLIC_URL` |
| `Postgres` | `ghcr.io/railwayapp-templates/postgres-ssl:18`, том `/var/lib/postgresql/data` | TCP Proxy → `DATABASE_PUBLIC_URL` |

Пароли Redis и PostgreSQL генерируются заново при каждом развёртывании. Пользователь и база PostgreSQL — `postgres`.

Переменные исполнителя:

- `REDIS_URL`, `RUNNER_BOT_REDIS_URL` = `${{Redis.REDIS_URL}}`;
- `RUNNER_BOT_DATABASE_URL` = `${{Postgres.DATABASE_URL}}` — база для ботов внутри Railway;
- `RUNNER_DATABASE_PUBLIC_URL` = `${{Postgres.DATABASE_PUBLIC_URL}}` — та же база снаружи (для панели и бэкапов).

`RUNNER_ID` не задан, поэтому ID исполнителя — `default`.

## Как панель находит площадку

Панели нужен только `REDIS_PUBLIC_URL`. При старте исполнитель записывает в Redis (`server/redis/runnerSiteInfo.ts`):

- `tbb:runners` — множество ID исполнителей;
- `tbb:runner:<id>:info` — JSON со сведениями: `runnerId`, `platform` (`railway` / `docker`), `region`, `botDatabaseUrl`, `databasePublicUrl`, `botRedisUrl`, `startedAt`.

Прочитать их можно через `listRunnerSiteInfos()`. Проверить, что исполнитель слушает команды: записать `k=ping` в `tbb:runner:<id>:cmd` и дождаться `k=pong` в `tbb:runner:<id>:ev`.

## Как пересоздать шаблон

Шаблон генерируется из проекта `tbb-site` в workspace `tbb-bots` (мутации `templateGenerate` и `templatePublish` Railway API). Правьте сервисы в этом проекте, затем удалите старый шаблон и сгенерируйте новый.

> ⚠️ `templateGenerate` не переносит обычные значения переменных: в шаблоне они становятся обязательными пустыми полями. Поэтому все переменные проекта заданы только через ссылки `${{...}}` или `secret()`, например `PGDATA=${{RAILWAY_VOLUME_MOUNT_PATH}}/pgdata`, а постоянные части (`postgres`, порт `5432`) вписаны прямо в адреса.

`templatePublish` требует в readme разделы `# Deploy and Host …`, `## About Hosting …`, `## Why Deploy …`, `## Common Use Cases`, `## Dependencies for …`.

## Проверено

Шаблон развёрнут в новом проекте: три сервиса поднялись, исполнитель ответил `pong` через `REDIS_PUBLIC_URL`, PostgreSQL 18 доступен по `DATABASE_PUBLIC_URL`, данные лежат на томе.

Сведения в `tbb:runner:<id>:info` пишет исполнитель из этой ветки; опубликованный образ начнёт их писать после слияния в `main` и сборки `publish-runner.yml`.
