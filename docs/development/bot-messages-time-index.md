# Индекс сообщений по проекту и времени

Индекс `idx_bot_messages_project_created_at` поддерживает выборки активности по проекту и временному окну. Он создаётся отдельной операцией, а не миграцией при старте сервера: PostgreSQL строит его с `CONCURRENTLY`, сохраняя запись новых сообщений.

## Запуск

Задайте `DATABASE_URL` нужной среды и выполните из корня проекта:

```bash
npx tsx --tsconfig tsconfig.node.json tools/create-bot-messages-time-index.ts
```

Скрипт повторяемый. Он проверяет состав и готовность существующего индекса. Если предыдущее построение оставило невалидный индекс, скрипт удалит его через `DROP INDEX CONCURRENTLY` и построит заново. Если имя занято другим индексом, операция остановится без изменения этого индекса. Одновременные запуски скрипта сериализуются блокировкой PostgreSQL.

## Проверка

До создания индекса запустите замер для крупного проекта и его бота. Команда
выполняет точный запрос итогов активности за 24 часа в транзакции только для
чтения, отдельно для всего проекта и выбранного бота:

```bash
npx tsx --tsconfig tsconfig.node.json tools/measure-bot-messages-index.ts 12 9 before.json
```

После создания индекса повторите на той же базе и с теми же ID:

```bash
npx tsx --tsconfig tsconfig.node.json tools/measure-bot-messages-index.ts 12 9 after.json before.json
```

Последний аргумент включает сравнение времени, числа прочитанных блоков и полных
проходов `bot_messages`. Подставьте ID своей среды. Один блок PostgreSQL обычно
равен 8 КиБ; на горячем кеше `readBlocks` может быть нулём, поэтому учитывайте
также `hitBlocks`. Замер может прогреть кеш, а `EXPLAIN ANALYZE` действительно
выполняет запрос; для сравнения памяти наблюдайте RAM в Railway при обычной
нагрузке несколько дней.

Если локальная копия содержит только старые сообщения, можно зафиксировать
историческое время пятым аргументом. Используйте одинаковое время до и после:

```bash
npx tsx --tsconfig tsconfig.node.json tools/measure-bot-messages-index.ts 12 9 before.json "" 2026-10-31T23:58:04.742Z
npx tsx --tsconfig tsconfig.node.json tools/measure-bot-messages-index.ts 12 9 after.json before.json 2026-10-31T23:58:04.742Z
```

После запуска проверьте готовность индекса:

```sql
SELECT i.indisvalid, i.indisready, pg_get_indexdef(i.indexrelid)
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE c.oid = 'public.idx_bot_messages_project_created_at'::regclass;
```

Сравните `EXPLAIN (ANALYZE, BUFFERS)` для реального запроса активности до и после создания индекса. Планировщик вправе выбрать последовательное чтение, если окно охватывает большую долю таблицы. Отдельно наблюдайте размер индекса, задержку записи сообщений и RAM базы.

## Откат

Если индекс ухудшит работу, удалите его отдельной командой вне транзакции:

```sql
DROP INDEX CONCURRENTLY IF EXISTS public.idx_bot_messages_project_created_at;
```
