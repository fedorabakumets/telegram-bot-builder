# Среда и зависимости

Для локального запуска используйте **Node.js 24 LTS** и **Python 3.13**.
Требование Node задаётся в `package.json`, `.nvmrc` и `.node-version`.
Python проекта должен быть не ниже 3.11 и ниже 3.15: установленный в проекте
aiogram 3.31.0 ограничивает совместимость значением `<3.15`.
Установка более нового Python на компьютер не обновляет существующие venv.

## Источники версий

- `package.json` — прямые npm-зависимости и команды.
- `package-lock.json` — точные версии npm; устанавливайте через `npm ci`.
- `requirements.txt` — полный набор прямых Python-зависимостей ботов с точными версиями.
- `pyproject.toml` — метаданные Python и часть зависимостей; для запуска всех ботов
  устанавливайте именно `requirements.txt`. Транзитивные Python-зависимости не зафиксированы.
- `docs-site/package-lock.json` — отдельные зависимости сайта документации.

React 18 и Vite 6 остаются текущими основными версиями. Установлены Zod 4 и Vitest 5.
Обновления React, Vite и других библиотек на следующие основные версии требуют
отдельной проверки совместимости.

## Python: отдельное окружение

Windows (PowerShell):

```powershell
py -3.13 -m venv .venv-botcraft
.\.venv-botcraft\Scripts\python.exe -m pip install -r requirements.txt
.\.venv-botcraft\Scripts\python.exe -m pip check
```

Linux/macOS (с установленным Python 3.13):

```sh
python3.13 -m venv .venv-botcraft
.venv-botcraft/bin/python -m pip install -r requirements.txt
.venv-botcraft/bin/python -m pip check
```

В локальном `.env` укажите `PYTHON_PATH` — абсолютный путь к Python внутри этого
окружения. На Windows можно использовать прямые слеши, например
`PYTHON_PATH=C:/projects/telegram-bot-builder/.venv-botcraft/Scripts/python.exe`.
На Linux/macOS путь заканчивается на `/.venv-botcraft/bin/python`.
Не переносите локальное значение `PYTHON_PATH` в Docker или Railway.

## Установка и запуск

```sh
npm ci
npm run dev
```

До запуска настройте PostgreSQL, Redis и `.env` по инструкции установки.
Обычный `dev` обслуживает панель и API на одном порту; разделённый режим описан
в [инструкции frontend/backend](frontend-backend-split.md).
Production: `npm run build`, затем `npm start`; сервер работает из готового JavaScript.
Python-окружение и подключение к БД нужны отдельно от сборки JavaScript.

## Проверки

Все фазовые тесты генератора: `npm run test:phases`.
Для проверки синтаксиса сгенерированного кода команда `python` в терминале должна
указывать на поддерживаемую версию; при необходимости активируйте venv.
GitHub Actions запускает весь набор фаз рядом с TypeScript и проверками React Hooks.
Локально не запускайте полную проверку `npm run check`/`tsc`: используйте адресную
диагностику изменённых файлов согласно правилам репозитория.
