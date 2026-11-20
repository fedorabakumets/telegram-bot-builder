/** @fileoverview Атомарное резервирование проверок ботов и владение арендой worker. */
import type { Pool } from 'pg';
import { pool } from '../../database/db';
import { readBotHistoryRun } from './telegram-bot-history-reader';
import { createBotHistoryWriter } from './telegram-bot-history-writer';
import { BOT_HISTORY_LEASE_SECONDS, BotHistoryConflictError, type CreateBotHistoryRun } from './telegram-bot-history-types';
export { BotHistoryConflictError, type BotHistoryRun } from './telegram-bot-history-types';
/** Изолируемый репозиторий; таблицы подготавливает миграция. @param database - Пул разрешённой базы. @returns Методы записи и восстановления. */
export function createTelegramBotHistoryStore(database: Pool = pool) {
  /** Помечает только реально просроченные аренды, сохраняя уже полученные результаты. */
  async function interruptExpired(projectId: number): Promise<void> {
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      const expired = await client.query(`UPDATE telegram_bot_check_runs SET status='failed',failure_reason='server_interrupted',
        finished_at=now(),updated_at=now(),lease_until=NULL WHERE project_id=$1 AND status='running' AND lease_until<now() RETURNING id`, [projectId]);
      if (expired.rowCount) await client.query(`UPDATE telegram_bot_check_items SET status='error',reason='error'
        WHERE project_id=$1 AND run_id=ANY($2::integer[]) AND status IN ('pending','running')`, [projectId, expired.rows.map(row => row.id)]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  /** Создаёт запуск и все ожидающие строки до любых запросов Telegram; пересечения областей запрещены. */
  async function create(input: CreateBotHistoryRun) {
    await interruptExpired(input.projectId);
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1,-732)', [input.projectId]);
      const active = await client.query(`SELECT id,scope_token_id FROM telegram_bot_check_runs
        WHERE project_id=$1 AND status='running' ORDER BY id`, [input.projectId]);
      const same = active.rows.find(row => row.scope_token_id === input.scopeTokenId);
      if (same) {
        const run = await readBotHistoryRun(client, input.projectId, same.id);
        await client.query('COMMIT'); return { run: run!, created: false };
      }
      const collision = await client.query(`SELECT 1 FROM telegram_bot_check_items i JOIN telegram_bot_check_runs r ON r.id=i.run_id
        WHERE i.project_id=$1 AND i.token_id=ANY($2::integer[]) AND r.status='running' LIMIT 1`, [input.projectId, input.tokens.map(token => token.id)]);
      if (collision.rowCount) throw new BotHistoryConflictError();
      const row = (await client.query(`INSERT INTO telegram_bot_check_runs(project_id,project_name,scope_token_id,scope_name,status,
        total_count,worker_id,lease_until,started_at) VALUES($1,COALESCE($2,(SELECT name FROM bot_projects WHERE id=$1)),$3,$4,'running',$5,$6,now()+$7*interval '1 second',now()) RETURNING id`,
      [input.projectId, input.projectName ?? null, input.scopeTokenId, input.scopeName ?? null, input.tokens.length, input.workerId, BOT_HISTORY_LEASE_SECONDS])).rows[0];
      for (const token of input.tokens) await client.query(`INSERT INTO telegram_bot_check_items(run_id,project_id,token_id,name,username,status)
        VALUES($1,$2,$3,$4,$5,'pending')`, [row.id, input.projectId, token.id, token.name, token.botUsername ?? null]);
      const run = await readBotHistoryRun(client, input.projectId, row.id);
      await client.query('COMMIT'); return { run: run!, created: true };
    } catch (error) {
      await client.query('ROLLBACK');
      if ((error as { /** Код PostgreSQL. */ code?: string }).code === '23505') throw new BotHistoryConflictError();
      throw error;
    } finally { client.release(); }
  }
  /** Читает активную проверку без изменения аренды или запуска внешних действий. */
  async function getActive(projectId: number, tokenId: number | null = null) {
    const row = (await database.query(`SELECT r.id FROM telegram_bot_check_runs r WHERE r.project_id=$1 AND r.status='running' AND r.lease_until>now()
      AND ($2::integer IS NULL OR EXISTS(SELECT 1 FROM telegram_bot_check_items i WHERE i.run_id=r.id AND i.token_id=$2))
      ORDER BY r.id DESC LIMIT 1`, [projectId, tokenId])).rows[0];
    return row ? readBotHistoryRun(database, projectId, row.id) : null;
  }
  /** Продлевает только непросроченную аренду указанного владельца. */
  async function heartbeat(projectId: number, runId: number, workerId: string): Promise<boolean> {
    const result = await database.query(`UPDATE telegram_bot_check_runs SET lease_until=now()+$4*interval '1 second'
      WHERE project_id=$1 AND id=$2 AND worker_id=$3 AND status='running' AND lease_until>now()`, [projectId, runId, workerId, BOT_HISTORY_LEASE_SECONDS]);
    return !!result.rowCount;
  }
  return { create, getActive, heartbeat, interruptExpired, ...createBotHistoryWriter(database),
    get: (projectId: number, id: number) => readBotHistoryRun(database, projectId, id) };
}
/** Общий репозиторий процесса. */
export const telegramBotHistoryStore = createTelegramBotHistoryStore();
