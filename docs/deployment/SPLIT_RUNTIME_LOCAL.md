# Раздельный запуск одной кодовой базы

Обычный `npm run dev` запускает совмещённую панель на порту 5000. Существующий `npm run dev:split` запускает API и frontend двумя процессами. Для проверки трёх сервисов запустите в отдельных терминалах `npm run dev:api`, `npm run dev:runtime` и `npm run dev:frontend`. API по умолчанию слушает порт 5000, frontend — 5173. Укажите одинаковый `REDIS_URL` для API и runtime; `WORKER_RUNNER_ID` API должен совпадать с `RUNNER_ID` исполнителя (по умолчанию `default`). Для очереди рассылок runtime также нужен `DATABASE_URL` общей БД. `dev:api` задаёт `BOT_RUNTIME_MODE=api`; `dev:runtime` и Compose включают `RUNNER_REQUIRE_FENCE=true` и `RUNNER_BROADCASTS_ENABLED=true`.

Команды сборки: `npm run build:frontend`, `npm run build:api`, `npm run build:runtime`. Общая `npm run build` сохраняет прежнее поведение. Образы независимо собираются из `Dockerfile.frontend`, `Dockerfile.backend` и `Dockerfile.runner`. Подготовленные конфиги `railway.frontend.toml`, `railway.backend.toml` и `railway.runtime.toml` можно назначить сервисам при отдельном переключении; их наличие в репозитории ничего не развёртывает.

В Compose обычный `docker compose up --build` сохраняет совмещённый сервис `app`. Для раздельного профиля используйте `docker compose --profile split up --build db redis api runtime frontend`. Для реального запуска ботов в этом профиле задайте S3-совместимое хранилище и `BOT_BUILDS_STORAGE_ID`: исполнитель скачивает сборку по подписанной ссылке, а общую папку с API не использует. Перед настройкой хранилища изучите [хранение сборок](BOT_BUILDS.md).

Этот профиль предназначен для локальной проверки. Конфигурацию действующих сервисов Railway он не меняет.
