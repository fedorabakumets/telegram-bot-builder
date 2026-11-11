# Telegram Bot Builder API — API Reference

Явно документированные контракты. Сборка без запуска приложения; не включает автоматически обнаруживаемые недокументированные маршруты.

**Версия OpenAPI:** 2.2.0.5

> Сгенерировано из OpenAPI spec (`npm run docs:api`). Интерактивная документация: `/admin/docs`.

В снимке 288 HTTP-операций. Число маршрутов HTTP не равно числу действий основного MCP.

## Сборка и границы покрытия

`npm run docs:api` (или `npx tsx scripts/generate-api-docs.ts`) собирает контракты из реестра без запуска Express, фоновых задач, Redis и БД. Проверка зависимостей в `lib/api-docs/offline-document.test.ts` запрещает импорт исполняемых маршрутов и модулей хранилища.

[Отчёт покрытия](./offline-coverage.json) содержит неразрешённые ссылки, дубли ID, ответы без схем, намеренно пустые ответы и статические кандидаты маршрутов. Старые runtime-only записи сохраняются с `x-offline-unverified` до описания. Пустой missingCandidates означает покрытие разрешённых AST-литералов, а не доказательство работы всех маршрутов: динамические выражения, условные регистрации и Router mounts требуют отдельной проверки в изолированном приложении.

Основной MCP использует общий реестр действий и полный либо компактный профиль с четырьмя инструментами. [Альтернативный OpenAPI-адаптер](../../tools/mcp-openapi/README.md) публикует только пять проверенных GET-действий чтения и статусов. Он не открывает все API, секреты или управление собственными ключами. Для обновления его подмножества: `node tools/mcp-openapi/prepare-spec.mjs`; старый generated-клиент после изменения политики нужно пересобрать отдельно.

## Повторяемые записи таблиц

Создание таблицы/столбца/строк, импорт строк/таблиц, apply-ops и cells/edit принимают необязательный UUID requestId. Без него действует прежний формат: объект дополнен persistence, массив остаётся массивом и подтверждается JSON-заголовком x-botcraft-persistence. С UUID ответ содержит state:completed, receipt.ids (до 500), idsTruncated и доступное persistence. Повтор UUID с прежними аргументами возвращает квитанцию, с другими — 409. Ответ 202 со state:unknown и retryable:false требует сверки, а не автоматического повтора. Подтверждение БД не означает доставку live-события или применение изменений работающим ботом.

## Разделы

| Тег | Эндпоинтов |
|-----|------------|
| [admin](./admin.md) | 27 |
| [agent-auto-auth](./agent-auto-auth.md) | 2 |
| [agent-connections](./agent-connections.md) | 2 |
| [agent-tokens](./agent-tokens.md) | 3 |
| [analytics-v2](./analytics-v2.md) | 23 |
| [auth](./auth.md) | 11 |
| [bot](./bot.md) | 25 |
| [bot-logs](./bot-logs.md) | 1 |
| [bots](./bots.md) | 1 |
| [config](./config.md) | 2 |
| [health](./health.md) | 2 |
| [hooks](./hooks.md) | 5 |
| [launch](./launch.md) | 1 |
| [media](./media.md) | 14 |
| [project-bot](./project-bot.md) | 8 |
| [project-broadcasts](./project-broadcasts.md) | 12 |
| [project-dialogs](./project-dialogs.md) | 9 |
| [project-files](./project-files.md) | 5 |
| [project-groups](./project-groups.md) | 6 |
| [project-messages](./project-messages.md) | 4 |
| [project-tables](./project-tables.md) | 29 |
| [project-tokens](./project-tokens.md) | 31 |
| [project-users](./project-users.md) | 13 |
| [project-versions](./project-versions.md) | 6 |
| [projects](./projects.md) | 18 |
| [server](./server.md) | 1 |
| [setup](./setup.md) | 2 |
| [storage-configs](./storage-configs.md) | 5 |
| [support](./support.md) | 4 |
| [templates](./templates.md) | 9 |
| [tokens](./tokens.md) | 2 |
| [webhook](./webhook.md) | 1 |
| [workers](./workers.md) | 1 |
| [Диалоги](./Диалоги.md) | 3 |

## Авторизация

- **Cookie** — сессия после Telegram Login / Mini App / dev-login (`connect.sid`)
- **Bearer PAT** — персональный токен агента (MCP/CLI)
- **Admin cookie** — `/admin/login` (`ADMIN_API_KEY`)
- Публичные эндпоинты помечены «Публичный»
