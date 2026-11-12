/** @fileoverview Чтение безопасной диагностики локального тестового бота без его перезапуска. */
import 'dotenv/config';
import pg from 'pg';
import Redis from 'ioredis';

/** Скрывает секреты подключения и токены из диагностических сообщений. */
function redact(value) {
  return String(value ?? '').replace(/\d{5,}:[A-Za-z0-9_-]{20,}/g, '[токен скрыт]')
    .replace(/(?:postgres(?:ql)?|redis|https?):\/\/\S+/g, '[адрес скрыт]').slice(0, 2400);
}

/** Читает статус и последние ошибки только из локальной базы. */
async function main() {
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname)) throw new Error('Только локальная БД');
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const redis = new Redis(process.env.REDIS_URL, { commandTimeout: 5000, maxRetriesPerRequest: 1 });
  try {
    await db.connect();
    const instance = await db.query(`SELECT id,status,desired_status,desired_generation,error_message,
      started_at,stopped_at FROM bot_instances WHERE token_id=30 AND project_id=40`);
    const logs = await db.query(`SELECT type,content,timestamp FROM bot_logs WHERE token_id=30 AND project_id=40
      AND ($1::boolean OR type='stderr') ORDER BY id DESC LIMIT 30`, [process.argv.includes('--recent')]);
    const { rows: [token] } = await db.query('SELECT token FROM bot_tokens WHERE id=30 AND project_id=40');
    let identity;
    if (process.argv.includes('--identity')) {
      const telegram = await fetch(`https://api.telegram.org/bot${token.token}/getMe`, { signal: AbortSignal.timeout(15000) });
      const result = await telegram.json();
      identity = { ok: result.ok, id: result.result?.id, username: result.result?.username };
    }
    const prefix = `tbb:demand:{${token.token.split(':')[0]}}`;
    const pending = await redis.zcard(`${prefix}:pending`);
    const head = await redis.zrange(`${prefix}:pending`, 0, 0);
    const payload = head[0] && await redis.hget(`${prefix}:payloads`, head[0]);
    const update = payload ? JSON.parse(payload) : null;
    const response = await fetch('http://127.0.0.1:5001/api/projects/40/bot/statuses', {
      headers: { Authorization: `Bearer ${process.env.MCP_AGENT_TOKEN}` }, signal: AbortSignal.timeout(10000) });
    const api = await response.json();
    console.log(JSON.stringify({ identity, api: api.statuses?.find((row) => row.tokenId === 30),
      queue: { pending, offset: await redis.get(`${prefix}:offset`),
        pollingLeaseTtlMs: await redis.pttl(`bot:lock:${token.token.slice(-10)}`),
        firstUpdate: update && { id: update.update_id, kinds: Object.keys(update).filter(key => key !== 'update_id'),
          date: update.message?.date ?? update.callback_query?.message?.date } },
      instance: instance.rows.map((row) => ({ ...row, error_message: redact(row.error_message) })),
      errors: logs.rows.map((row) => ({ ...row, content: redact(row.content) })) }, null, 2));
  } finally { redis.disconnect(); await db.end(); }
}
main().catch((error) => { console.error(redact(error.message)); process.exitCode = 1; });
