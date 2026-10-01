# Воркеры ботов в Docker (контейнер на человека)

Режим `WORKER_RUNTIME=docker` запускает каждый Python-воркер в отдельном контейнере.
Вместе с `WORKER_GROUPING=owner` получается **один контейнер на пользователя**: все его боты
работают в одном контейнере, боты разных людей друг друга не видят.

По умолчанию (`WORKER_RUNTIME=process`) всё работает как раньше — воркер это дочерний процесс сервера.

## Что меняется для ботов

| | `process` | `docker` |
|---|---|---|
| Переменные окружения сервера (`DATABASE_URL`, `SESSION_SECRET`, ключи) | видны боту | не попадают в контейнер |
| `${{VAR}}` в переменных бота | раскрывается любая переменная сервера | только из `WORKER_ENV_PASSTHROUGH` |
| Файлы | весь сервер | копии папок своих ботов (только чтение) и `uploads/<id>` своих проектов |
| Системные файлы контейнера | — | только чтение, `/tmp` в памяти (64 МБ) |
| Права | права сервера | `--cap-drop ALL`, `no-new-privileges`, не больше 256 процессов |
| Лимиты | общий лимит контейнера app | `WORKER_MEMORY_LIMIT`, `WORKER_CPUS` на каждый контейнер |

Память на человека такая же, как в режиме `owner` без Docker (~110 МБ на контейнер с ботом).

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

- **Доступ к БД платформы.** В `.env` бота по-прежнему лежит `DATABASE_URL` платформы — боты
  пишут в `bot_users`, `bot_messages` и другие таблицы. Код бота (нода `code`, `psql_query`)
  может прочитать этот `.env` и сделать любой запрос. Нужна отдельная роль БД на проект — следующий шаг.
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
