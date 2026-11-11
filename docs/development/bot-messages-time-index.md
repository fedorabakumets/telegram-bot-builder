# Индекс сообщений по проекту и времени

Индекс `idx_bot_messages_project_created_at` поддерживает выборки активности по проекту и временному окну. Он создаётся отдельной операцией, а не миграцией при старте сервера: PostgreSQL строит его с `CONCURRENTLY`, сохраняя запись новых сообщений.

## Запуск

Задайте `DATABASE_URL` нужной среды и выполните из корня проекта:

```bash
npx tsx --tsconfig tsconfig.node.json tools/create-bot-messages-time-index.ts
```

Скрипт повторяемый. Он проверяет состав и готовность существующего индекса. Если предыдущее построение оставило невалидный индекс, скрипт удалит его через `DROP INDEX CONCURRENTLY` и построит заново. Если имя занято другим индексом, операция остановится без изменения этого индекса. Одновременные запуски скрипта сериализуются блокировкой PostgreSQL.

## Проверка

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
