/**
 * @fileoverview Безопасное фоновое построение индекса времени сообщений.
 */
import { Client } from 'pg';

/** Имя управляемого индекса. */
const INDEX_NAME = 'idx_bot_messages_project_created_at';
/** Ключ блокировки между экземплярами сервера. */
const LOCK_KEY = 'bot_messages_project_created_at_index_v1';

/** Состояние существующего индекса. */
interface IndexState {
  /** SQL-определение для сообщения об ошибке. */
  definition: string;
  /** Совпадает ли определение с ожидаемым. */
  expected: boolean;
  /** Готов ли индекс к изменениям. */
  ready: boolean;
  /** Доступен ли индекс планировщику. */
  valid: boolean;
}

/**
 * Читает каталог PostgreSQL и сверяет определение индекса.
 * @param client - Выделенное соединение.
 * @returns Состояние индекса или его отсутствие.
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
 * Создаёт индекс вне транзакции, если он отсутствует или невалиден.
 * @returns Готовность индекса или занятость другим экземпляром.
 */
export async function ensureBotMessagesTimeIndex(): Promise<'ready' | 'busy'> {
  if (!process.env.DATABASE_URL) throw new Error('Для индекса сообщений нужен DATABASE_URL');
  /** TLS-настройки совпадают с основным пулом приложения. */
  const ssl = process.env.NODE_ENV === 'production'
    && process.env.PGSSLMODE !== 'disable'
    && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false, require: true } : false;
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl });
  await client.connect();
  let locked = false;
  try {
    const lock = await client.query<{ acquired: boolean }>(
      'SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS acquired', [LOCK_KEY],
    );
    locked = lock.rows[0]?.acquired === true;
    if (!locked) return 'busy';
    const existing = await getIndexState(client);
    if (existing && !existing.expected) {
      throw new Error(`Имя ${INDEX_NAME} занято другим индексом: ${existing.definition}`);
    }
    if (existing?.valid && existing.ready) return 'ready';
    if (existing) await client.query(`DROP INDEX CONCURRENTLY public.${INDEX_NAME}`);
    await client.query(`CREATE INDEX CONCURRENTLY ${INDEX_NAME}
      ON public.bot_messages (project_id, created_at DESC)`);
    const created = await getIndexState(client);
    if (!created?.expected || !created.valid || !created.ready) {
      throw new Error('PostgreSQL не подтвердил готовность индекса сообщений');
    }
    return 'ready';
  } finally {
    try {
      if (locked) await client.query(
        'SELECT pg_advisory_unlock(hashtextextended($1, 0))', [LOCK_KEY],
      );
    } finally {
      await client.end();
    }
  }
}
