/**
 * @fileoverview Однократное безопасное создание индекса сообщений по проекту и времени.
 */
import 'dotenv/config';
import { Client } from 'pg';

/** Имя индекса, проверяемого перед повторным запуском. */
const INDEX_NAME = 'idx_bot_messages_project_created_at';
/** Ключ блокировки, предотвращающей одновременный запуск этого скрипта. */
const LOCK_KEY = 'bot_messages_project_created_at_index_v1';

/** Состояние существующего индекса PostgreSQL. */
interface IndexState {
  /** Определение индекса, возвращённое PostgreSQL. */
  definition: string;
  /** Совпадает ли таблица, метод, порядок и число колонок с ожидаемыми. */
  expected: boolean;
  /** Признак готовности индекса к поиску. */
  ready: boolean;
  /** Признак корректного завершения построения. */
  valid: boolean;
}

/**
 * Получает состояние индекса в схеме public.
 * @param client - Выделенное соединение PostgreSQL.
 * @returns Состояние индекса либо отсутствие индекса.
 */
async function getIndexState(client: Client): Promise<IndexState | undefined> {
  const result = await client.query<IndexState>(`
    SELECT pg_get_indexdef(i.indexrelid) AS definition,
      i.indisready AS ready, i.indisvalid AS valid,
      (tbl_ns.nspname = 'public' AND tbl.relname = 'bot_messages'
        AND am.amname = 'btree' AND NOT i.indisunique
        AND i.indnatts = 2 AND i.indnkeyatts = 2
        AND i.indpred IS NULL AND i.indexprs IS NULL
        AND pg_get_indexdef(i.indexrelid, 1, true) = 'project_id'
        AND pg_get_indexdef(i.indexrelid, 2, true) = 'created_at'
        AND i.indoption[0] = 0 AND i.indoption[1] = 3) AS expected
    FROM pg_index i
    JOIN pg_class idx ON idx.oid = i.indexrelid
    JOIN pg_namespace ns ON ns.oid = idx.relnamespace
    JOIN pg_class tbl ON tbl.oid = i.indrelid
    JOIN pg_namespace tbl_ns ON tbl_ns.oid = tbl.relnamespace
    JOIN pg_am am ON am.oid = idx.relam
    WHERE ns.nspname = 'public' AND idx.relname = $1`, [INDEX_NAME]);
  return result.rows[0];
}

/**
 * Проверяет, что существующее имя принадлежит ожидаемому индексу.
 * @param state - Состояние существующего индекса.
 * @returns Завершение проверки.
 */
function assertExpectedDefinition(state: IndexState): void {
  if (!state.expected) {
    throw new Error(`Имя ${INDEX_NAME} уже занято другим индексом: ${state.definition}`);
  }
}

/**
 * Создаёт индекс без блокировки записи сообщений; повторный запуск возобновляет неудачную попытку.
 * @returns Завершение операции.
 */
async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('Для создания индекса нужен DATABASE_URL');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [LOCK_KEY]);
    const existing = await getIndexState(client);
    if (existing) {
      assertExpectedDefinition(existing);
      if (existing.valid && existing.ready) {
        console.log(`${INDEX_NAME}: индекс уже готов`);
        return;
      }
      console.log(`${INDEX_NAME}: удаляю незавершённый индекс`);
      await client.query(`DROP INDEX CONCURRENTLY public.${INDEX_NAME}`);
    }
    console.log(`${INDEX_NAME}: создаю индекс без блокировки записи`);
    await client.query(`CREATE INDEX CONCURRENTLY ${INDEX_NAME}
      ON public.bot_messages (project_id, created_at DESC)`);
    const created = await getIndexState(client);
    if (!created?.expected || !created.valid || !created.ready) {
      throw new Error('Индекс создан, но PostgreSQL не подтвердил его определение и готовность');
    }
    console.log(`${INDEX_NAME}: индекс готов`);
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [LOCK_KEY]);
    } finally {
      await client.end();
    }
  }
}

main().catch((error: unknown) => {
  console.error('Создание индекса остановлено:', error);
  process.exitCode = 1;
});
