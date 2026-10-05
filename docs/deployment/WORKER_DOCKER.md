# Воркеры ботов в Docker (контейнер на человека)

Режим `WORKER_RUNTIME=docker` запускает каждый Python-воркер в отдельном контейнере.
Вместе с `WORKER_GROUPING=owner` получается **один контейнер на пользователя**: все его боты
работают в одном контейнере, боты разных людей друг друга не видят.

По умолчанию (`WORKER_RUNTIME=process`) всё работает как раньше — воркер это дочерний процесс сервера.

## Что меняется для ботов

| | `process` | `docker` |
|---|---|---|
| Переменные окружения сервера (`SESSION_SECRET`, `ADMIN_API_KEY`, ключи) | не наследуются: в базу процесса входят технические (PATH, локаль, PYTHON*), `API_BASE_URL`/`WEBHOOK_BASE_URL` и `WORKER_ENV_PASSTHROUGH`. `DATABASE_URL`/`REDIS_URL` бот получает в своём словаре | не попадают в контейнер, кроме `WORKER_ENV_PASSTHROUGH` |
| `${{VAR}}` в переменных бота | только из `WORKER_ENV_PASSTHROUGH` (вне denylist) | только из `WORKER_ENV_PASSTHROUGH` (вне denylist) |
| Файлы | весь сервер | копии папок своих ботов (только чтение) и `uploads/<id>` своих проектов |
| Системные файлы контейнера | — | только чтение, `/tmp` в памяти (64 МБ) |
| Права | права сервера | `--cap-drop ALL`, `no-new-privileges`, не больше 256 процессов |
| Лимиты | общий лимит контейнера app | `WORKER_MEMORY_LIMIT`, `WORKER_CPUS` на каждый контейнер |

Память на человека такая же, как в режиме `owner` без Docker (~110 МБ на контейнер с ботом).

## Серверные переменные и боты (все режимы)

Окружение бота состоит из трёх слоёв:

1. **Переменные токена** (вкладка «Переменные» у бота) — отдаются как есть.
2. **Системные**: `BOT_TOKEN`, `TOKEN_ID`, `PROJECT_ID`, `ADMIN_IDS`, `WEBHOOK_*`,
   `DATABASE_URL`, `REDIS_URL` — в словаре этого бота, не в базе процесса воркера.
   В базе процесса остаются `API_BASE_URL`, `WEBHOOK_BASE_URL` и технические переменные:
   `PATH`, `HOME`, `USER`, `LOGNAME`, `LANG`, `LANGUAGE`, `LC_*`, `TZ`, `TMPDIR`/`TMP`/`TEMP`,
   `PYTHON*`, `VIRTUAL_ENV`, `LD_LIBRARY_PATH`, `SSL_CERT_FILE`, `SSL_CERT_DIR`, `REQUESTS_CA_BUNDLE`,
   системные переменные Windows, а также настройки воркера `BOT_CODE_CACHE`, `AIOGRAM_LAZY_MODELS`,
   `WORKER_REPORT_MEMORY`, `MAX_UPDATE_AGE_SECONDS`, `DISABLE_ASYNC_LOG`, `LOG_LEVEL`.
3. **Остальные переменные сервера** боту не видны — ни наследованием процесса, ни ссылкой `${{VAR}}`.
   Отдаются только перечисленные в `WORKER_ENV_PASSTHROUGH`, во всех режимах `WORKER_RUNTIME`
   (`process`, `docker`, `remote`):

```env
WORKER_ENV_PASSTHROUGH=OPENAI_API_KEY,WEBHOOK_BASE_URL
```

Такие переменные видны коду бота в `os.environ` (например `{OPENAI_API_KEY}` в ноде `http_request`)
и раскрываются в ссылках `${{OPENAI_API_KEY}}` в переменных токена. Нераскрытая ссылка остаётся
текстом, в логе сервера — предупреждение `[BotEnv]`.

**Denylist** — эти имена не отдаются ботам даже из `WORKER_ENV_PASSTHROUGH` (сравнение без учёта регистра,
код: `server/bots/botEnvPolicy.ts`):

- точные имена: `SESSION_SECRET`, `ADMIN_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `TELEGRAM_BOT_TOKEN`,
  `VITE_TELEGRAM_BOT_TOKEN`, `MCP_AGENT_TOKEN`;
- префиксы: `PG*` (`PGHOST`, `PGPASSWORD`, …), `RAILWAY_*`, `RUNNER_*`;
- подстроки в имени: `SECRET`, `PASSWORD`, `PASSWD`, `PRIVATE_KEY`, `DATABASE_URL`, `REDIS_URL`
  (например `STRIPE_SECRET_KEY`, `SMTP_PASSWORD`, `RAILWAY_BOT_DATABASE_URL`).

`DATABASE_URL` и `REDIS_URL` бот получает в своём словаре (сборка переменных бота), не в базе процесса, поэтому ссылка `${{DATABASE_URL}}` не нужна: если она
осталась в переменных токена, она отбрасывается и бот получает подключение панели. Если секрет нужен боту,
назовите его без запрещённых слов и добавьте в `WORKER_ENV_PASSTHROUGH` или задайте прямо в переменных токена.

## Как работает

- Сервер запускает `docker run -i --rm … python3 -u /opt/worker/worker.py`. Протокол тот же
  (JSON через stdin/stdout), поэтому запуск, остановка и логи ботов не меняются.
- Перед запуском бота его папка копируется в `.worker-runtime/tbb-worker-<ключ>/bots/`.
  Эта папка монтируется в контейнер только для чтения; при создании контейнера она очищается.
- Uploads монтируются по проектам владельца: `uploads/<projectId>` → `/app/uploads/<projectId>`.
- Если человек создал новый проект, а его контейнер уже работает, контейнер пересоздаётся:
  работающие боты переносятся в новый контейнер без смены статуса в БД (простой — несколько секунд).
- Память в `/api/workers/stats` сообщает сам воркер (RSS процесса в контейнере раз в 10 с).
- Последний бот остановлен — контейнер завершается и удаляется. Сервер упал — контейнеры
  завершаются сами (закрывается stdin).

## Что не закрывает

- **Доступ к БД платформы.** В словаре бота по-прежнему лежит его `DATABASE_URL` платформы — боты
  пишут в `bot_users`, `bot_messages` и другие таблицы. Код бота (нода `code`, `psql_query`)
  видит эту строку и может сделать любой запрос. Сосед в том же процессе через `os.environ` её не видит.
  Нужна отдельная роль БД на проект — следующий шаг.
- **Сеть.** С `WORKER_DOCKER_NETWORK=host` контейнер видит всё, что слушает на хосте.
  Для прода лучше отдельная сеть, где доступны только db и redis.
- **Боты одного человека** по-прежнему в одном процессе и видят друг друга.

## Локальный запуск

```bash
# Образ с зависимостями ботов
cat > /tmp/Dockerfile.worker <<'EOF'
FROM python:3.12-slim
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
EOF
docker build -t tbb-worker:local -f /tmp/Dockerfile.worker .
```

```bash
# .env
WORKER_GROUPING=owner
WORKER_RUNTIME=docker
WORKER_DOCKER_IMAGE=tbb-worker:local
WORKER_MEMORY_LIMIT=256m
```

Проверка: `docker ps --filter label=tbb.worker` — по контейнеру на владельца с запущенными ботами.

## Прод (сервер сам в docker compose)

Сейчас не включено. Что нужно:

1. В образ app — docker CLI (`apk add docker-cli`), в `docker-compose.yml` для app —
   `/var/run/docker.sock:/var/run/docker.sock`. Доступ к сокету = root на хосте, поэтому
   лучше через прокси сокета с разрешёнными только `containers/create|start|attach|delete`.
2. `WORKER_DOCKER_HOST_ROOT=/opt/telegram-bot-builder` — пути для `-v` должны быть путями хоста.
3. `WORKER_DOCKER_NETWORK=<сеть compose>` (например `telegram-bot-builder_default`), чтобы
   работали адреса `db` и `redis` из `DATABASE_URL`/`REDIS_URL`.
4. `WORKER_DOCKER_IMAGE` — тот же образ app (в нём есть Python и зависимости ботов).
