# Исполнитель Cursor Cloud Agents на Railway (My Machines)

Облачный агент Cursor может выполнять команды не на машине Cursor, а на нашем сервисе Railway. Модель и логика агента остаются у Cursor. В сервисе выполняются правки файлов, терминал и git, в клоне репозитория на томе `/data`. Режим My Machines работает на любом тарифе с Cloud Agents, Enterprise не нужен.

Образ: `tools/cursor-worker/Dockerfile`, запуск: `tools/cursor-worker/entrypoint.sh`.

## Сервис Railway

- Источник — этот репозиторий, переменная `RAILWAY_DOCKERFILE_PATH=tools/cursor-worker/Dockerfile`.
- Том на `/data`: там клон репозитория (`/data/workspace`), `node_modules` и данные исполнителя (`/data/cursor`). Всё это переживает перезапуск.
- Политика перезапуска `ALWAYS`.
- Входящие порты и домен не нужны: исполнитель сам держит исходящее HTTPS-соединение с `api2.cursor.sh`.

## Переменные

| Переменная | Что это |
|---|---|
| `CURSOR_API_KEY` | Личный API-ключ Cursor (Dashboard → Integrations → User API Keys). Обязательно |
| `GITHUB_TOKEN` | Токен GitHub с правом записи в репозиторий: для `git push` и `gh` |
| `CURSOR_WORKER_NAME` | Имя машины в Cursor, по умолчанию `railway` |
| `GIT_USER_NAME`, `GIT_USER_EMAIL` | Автор коммитов агента |
| `REPO_URL` | Репозиторий, по умолчанию `fedorabakumets/telegram-bot-builder` |

## Как устроен запуск

1. Записывает `GITHUB_TOKEN` в `~/.git-credentials`, а не в адрес remote, и передаёт его `gh` через `GH_TOKEN`.
2. При первом запуске клонирует репозиторий и выполняет `npm ci`, потом только `git fetch`.
3. Запускает `agent worker --worker-dir /data/workspace --idle-release-timeout 0 start`. Без `--idle-release-timeout 0` исполнитель сам завершается через час простоя с кодом 0.

После запуска машина появляется в выборе окружения Cloud Agents. Из Slack, GitHub или Linear её выбирают так: `worker=railway`.

## Ограничения

- **Docker внутри сервиса нет**: тесты и запуск ботов в контейнерах там недоступны.
- **Короткоживущие токены GitHub** (`--mint-github-token`) и синхронизация секретов дашборда есть только у пулов Enterprise. Здесь нужен свой `GITHUB_TOKEN`.
- **Ключ Cursor даёт доступ к аккаунту**: всё, что агент читает в сервисе, уходит модели. Секреты в переменных сервиса агенту видны.
- **Несколько агентов** могут работать на машине одновременно и делят одну рабочую копию.
