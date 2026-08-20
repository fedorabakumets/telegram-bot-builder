# Деплой на VPS через GitHub Actions

Конструктор на VPS обновляется **без сборки на проде**.  
Тяжёлый `docker build` / Vite идёт в GitHub Actions, сервер только скачивает готовый образ и перезапускает контейнеры.

## Схема

```text
push в main
  → Actions: docker build + push в GHCR
  → SSH на VPS (restricted key)
  → git sync compose-файлов
  → docker compose pull app
  → docker compose up -d --no-build
  → health-check /api/health
```

Образ: `ghcr.io/fedorabakumets/telegram-bot-builder:latest`  
(также тег `sha-…` на каждый коммит)

## Почему так

На маленьком VPS (≈3 GB RAM) `docker compose build` на самом сервере легко кладёт машину (load уходит в десятки, SSH отваливается).  
Сборка в Actions этого не делает: прод только `pull` + `up`.

## Что нужно в GitHub Secrets

| Secret | Назначение |
|---|---|
| `DEPLOY_HOST` | IP/хост VPS |
| `DEPLOY_USER` | обычно `root` |
| `DEPLOY_SSH_KEY` | private key, на сервере **restricted** (`command=` → только deploy-скрипт) |

Workflow: [`.github/workflows/deploy-vps.yml`](../../.github/workflows/deploy-vps.yml)

## Что лежит на VPS

| Путь | Назначение |
|---|---|
| `/opt/telegram-bot-builder` | клон репо + `.env` + volumes (`uploads`, `bots`) |
| `/usr/local/sbin/bot-builder-gh-deploy.sh` | скрипт деплоя (pull/up, без build) |
| `/var/log/bot-builder-deploy.log` | лог деплоев |
| `/var/lock/bot-builder-deploy.lock` | блокировка параллельных деплоев |
| `docker-compose.override.yml` | локальный оверрайд (у нас Postgres 17, `pull_policy: always`) |

Скрипт в репозитории (источник правды): [`scripts/deploy/bot-builder-gh-deploy.sh`](../../scripts/deploy/bot-builder-gh-deploy.sh)  
При каждом деплое он синхронизируется в `/usr/local/sbin/`.

## Restricted SSH-ключ

В `authorized_keys` у deploy-ключа стоит `command=.../bot-builder-gh-deploy.sh`.  
Любая команда из Actions игнорируется — всегда запускается только этот скрипт. Это нормально и безопаснее, чем полный root по CI-ключу.

## Локальная разработка

В `docker-compose.yml` у сервиса `app` есть и `image`, и `build`:

- локально: `docker compose build app` / `up --build`
- на VPS: только образ из GHCR (`pull_policy: always` в override)

## Ручной запуск

Actions → **Deploy VPS** → **Run workflow** (`workflow_dispatch`).

Или push в `main` (workflow срабатывает автоматически).

## Проверка после деплоя

На сервере:

```bash
docker compose -f /opt/telegram-bot-builder/docker-compose.yml ps
curl -fsS http://127.0.0.1:5000/api/health
tail -50 /var/log/bot-builder-deploy.log
```

Ожидается что-то вроде:

```json
{"database":true,"templates":true,"ready":true}
```

и образ `ghcr.io/fedorabakumets/telegram-bot-builder:latest` у контейнера `bot-builder-app`.

## Типичные проблемы

**Health-check упал сразу после recreate**  
Приложение ещё стартует. В скрипте есть ретраи `curl` (до ~30 с). Если всё равно падает — смотри `docker compose logs app`.

**Параллельный деплой**  
`flock` на lock-файле ждёт предыдущий прогон; Actions не должен считать «пустой» успех при skip.

## Связанное

- [Быстрый деплой на Railway](RAILWAY_QUICK_DEPLOY.md) — альтернатива / параллельный прод
- [Устранение проблем Railway](RAILWAY_TROUBLESHOOTING.md)
