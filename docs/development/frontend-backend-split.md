<!-- @fileoverview Запуск интерфейса отдельно от API, подготовка Railway и безопасный откат. -->
# Раздельные frontend и backend

Репозиторий поддерживает совмещённый запуск и два отдельных процесса. Боты пока
остаются в backend: обновление frontend не перезапускает ботов, обновление backend
по-прежнему перезапускает их. Существующие `Dockerfile` и `railway.toml` сохраняют
прежний production-путь; новые конфиги сами по себе не переключают Railway.

## Локальная разработка и сборка

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Прежний совмещённый сервер разработки на порту 5000 |
| `npm run dev:split` | Отдельные Vite и backend, открывать frontend на порту 5173 |
| `npm run dev:frontend` | Только Vite; backend уже должен работать отдельно |
| `npm run dev:backend` | Только API и боты в режиме разработки |
| `npm run build` | Сборка клиента, затем сервера |
| `npm run build:client` | Только интерфейс в `dist/` |
| `npm run build:server` | Только сервер в `dist/server/` |
| `npm start` | Совмещённый запуск собранного приложения |
| `npm run start:frontend` | Собранный интерфейс и прокси |
| `npm run start:backend` | API и боты без SPA |

Для раздельной готовой сборки после `npm run build` открыть два терминала:

```powershell
# Первый терминал; только локальная тестовая БД и Redis.
npm run start:backend
```

```powershell
# Второй терминал; BACKEND_URL не попадает в браузерную сборку.
$env:BACKEND_URL = 'http://127.0.0.1:5000'
npm run start:frontend
```

Открывать `http://localhost:5173`, обращаться к API через тот же адрес. Нельзя
одновременно запускать два backend с боевыми токенами: это не способ проверки
split-режима. Использовать изолированную БД и тестовые токены.

`dev:split` принимает `FRONTEND_PORT` и `BACKEND_PORT`; если BACKEND_PORT не
задан, используется `PORT` или 5000. Для отдельного `dev:backend` порт задаётся
через `PORT`. В `dev:frontend` можно явно указать `BACKEND_URL`.

Vite при `build:client` очищает `dist/`, поэтому при ручном запуске двух сборок
нужен порядок «client, затем server», как в `npm run build`.

## Одна точка входа

Frontend отдаёт SPA и проксирует серверные запросы, включая API, WebSocket,
локальные медиа и серверные маршруты админки. Браузер использует относительные
URL, cookies остаются на одном origin; отдельный публичный адрес API, CORS и
копирование токенов в frontend не требуются. Пути авторизации и админки должны
сохранять маршрутизацию backend и его проверки доступа.

`BACKEND_URL` задаётся только процессу frontend и содержит HTTP(S) origin без
секретов и пути. Backend сохраняет PostgreSQL, Redis, хранилища, ключи и Python.
В frontend не передавать DATABASE_URL, REDIS_URL, SESSION_SECRET и токены ботов.

## Подготовленные конфиги Railway

| Сервис | Config File Path | Dockerfile | Запуск |
| --- | --- | --- | --- |
| frontend | `/railway.frontend.toml` | `Dockerfile.frontend` | `node frontend/index.mjs` |
| backend | `/railway.backend.toml` | `Dockerfile.backend` | `node dist/server/index.js` |

Оба сервиса используют корень репозитория `/`: здесь общие package-lock, shared
и lib. Не выставлять Root Directory в `/client` или `/server`. Поле Config File
Path выбрать для каждого сервиса явно. Старый `/railway.toml` остаётся для
совмещённого развёртывания.

Backend-образ выставляет `APP_MODE=backend`. Для backend задать постоянный
`PORT=5000` и `HOST=::`, чтобы слушать IPv6, необходимый приватной сети Railway
в окружениях с IPv6-only DNS (на Linux dual stack также принимает IPv4). Для
frontend задать `BACKEND_URL=http://backend.railway.internal:5000`, заменив
`backend` действительным внутренним именем сервиса. Оба сервиса должны быть
в одном environment. Frontend использует предоставленный Railway `PORT`.
Публичный адрес направляется на frontend; backend остаётся внутренним, кроме
отдельно необходимых Telegram webhook или внешних API-интеграций.

Healthcheck `/api/health` frontend проходит через proxy: успешная раздача HTML
при недоступном backend не считается готовностью сервиса.

Для проверки образов при работающем Docker Engine:

```text
docker build -f Dockerfile.frontend -t botcraft-frontend .
docker build -f Dockerfile.backend -t botcraft-backend .
```

Проверка Node.js локально не заменяет сборку Linux-образов. Если Docker Engine
недоступен, использовать результат GitHub workflow `split-runtime`, который
собирает оба Linux-образа без deploy. Успешная сборка образа ещё не заменяет
проверку приватной сети и переменных в staging.

Watch paths включают общие исходники, package-lock, конфиги и Dockerfile каждого
сервиса. Frontend следит также за `scripts/vite*.ts`, которые импортирует его
конфигурация сборки. Backend намеренно следит за `client/utils/**` и
`client/components/editor/sidebar/parsePythonCodeToJson.ts`: генератор пока
импортирует эти утилиты. Остальные изменения только интерфейса не должны
перезапускать backend. Изменения package-lock и shared/lib пересобирают оба.
При добавлении зависимости сборки соответствующий watch path нужно обновить.

## Порядок переключения и откат

1. Сначала проверить два процесса локально и в изолированном окружении: вход,
   выход, прямые `/projects/...`, админку, файлы и WebSocket. Боевые боты не
   дублировать в тестовой среде.
2. Оставить действующий сервис совмещённым и поднять frontend на временном
   адресе с proxy к нему. Совмещённый сервер может выступать backend для proxy.
3. Проверить cookie и callback Telegram на будущем публичном адресе; во время
   перехода сохранить прежний SESSION_SECRET и серверное хранилище сессий.
4. Для пользовательского домена переключить цель на frontend, сохранив само
   имя домена. Стандартный домен `*.up.railway.app` привязан к сервису: перенос
   того же имени между сервисами не обещается. Если нужен неизменный адрес,
   сначала подготовить пользовательский домен или оставить старую точку входа.
5. После проверки публичного frontend переключить действующий backend на
   `/railway.backend.toml`. Не создавать второй исполняющий ботов экземпляр
   с той же БД и токенами ради переноса.
6. Для отката вернуть действующему сервису `/railway.toml` и прежние переменные,
   дождаться healthcheck, затем вернуть пользовательский домен на него.
   Frontend отключать после возврата трафика. Миграция данных не требуется.

Протокол API менять совместимо со старыми открытыми вкладками. Само разделение
не гарантирует снижения RAM: измерять отдельно frontend, backend и ботов.

## Основания конфигурации

- [Railway: Config as Code](https://docs.railway.com/config-as-code/reference)
  — Dockerfile path, watch patterns и healthcheck.
- [Railway: shared monorepo](https://docs.railway.com/deployments/monorepo)
  — общая корневая директория и отдельные команды сервисов.
- [Railway: private networking](https://docs.railway.com/networking/private-networking)
  — внутренние DNS и связь в одном environment.
