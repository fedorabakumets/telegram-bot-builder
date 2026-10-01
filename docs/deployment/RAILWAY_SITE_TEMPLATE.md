# Площадка на Railway из шаблона `tbb-site`

Площадка — это исполнитель ботов с собственными Redis и PostgreSQL в аккаунте Railway пользователя. Разворачивается одной кнопкой: [railway.com/deploy/tbb-site](https://railway.com/deploy/tbb-site).

## Создание по токену

```bash
npm run site:create -- --token <токен Railway> [--name tbb-site] [--region europe-west4-drams3a] \
  [--workspace <id>] [--runner-image <образ>] [--keep-on-failure] [--show-secrets]
```

Команда (`server/sites/railway/createRailwaySite.ts`) создаёт проект в аккаунте владельца токена, разворачивает шаблон с регионом для всех трёх сервисов, ждёт их запуска и сведений исполнителя, затем печатает `REDIS_PUBLIC_URL` и адреса базы. Пароли в выводе скрыты, `--show-secrets` их показывает. При ошибке проект удаляется. Если оборвать команду вручную, проект останется, его ID печатается сразу после создания.

- **Токен** — аккаунта или workspace. Токен проекта не подойдёт: он не создаёт проекты. Если у аккаунта несколько workspace, нужен `--workspace`.
- **Неизвестный токен** Railway считает анонимом и создаёт ему временные проекты. Поэтому токен workspace сначала проверяется запросом `projects`: аноним его не проходит, и команда останавливается до создания проекта.
- **Регион** по умолчанию — `europe-west4-drams3a` (Амстердам, рядом с Telegram). Он задаётся в `deploy.region` и `deploy.multiRegionConfig` каждого сервиса до развёртывания, поэтому томам не нужен перенос.
- **Образ исполнителя** можно подменить через `--runner-image`, например тегом ветки.

Проверено на токене workspace `tbb-bots`: площадка в Амстердаме готова за 49 с, исполнитель сообщил регион и адреса базы.

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

Исполнитель проекта `tbb-site` на образе ветки записал `tbb:runners` и `tbb:runner:default:info` со всеми адресами.

## Образ из ветки

`publish-runner.yml` собирает образ и из веток `cursor/**`: тег — имя ветки с `-` вместо `/` (например `:cursor-railway-site-template-281a`), `latest` ставится только из `main`. Чтобы проверить ветку на площадке, укажите этот тег в образе сервиса `Runner`.

Для загрузки из Actions пакету нужен доступ репозитория на запись: GitHub → Packages → `telegram-bot-builder-runner` → Package settings → Manage Actions access → `telegram-bot-builder`, роль **Write**. Без него сборка падает на `permission_denied: write_package`.
