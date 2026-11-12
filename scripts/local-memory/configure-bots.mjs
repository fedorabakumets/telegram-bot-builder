/** @fileoverview Локальная настройка и проверка шести тестовых ботов без вывода секретов. */
import 'dotenv/config';
import pg from 'pg';
import Redis from 'ioredis';

/** Проверяет локальный адрес, чтобы исключить запись в production. */
function assertLocal(raw) {
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(raw).hostname)) {
    throw new Error('Разрешены только локальные подключения');
  }
}

/** Выполняет локальную команду, скрывая тело ответа при ошибке. */
async function api(path, method = 'GET', body) {
  const response = await fetch(`http://127.0.0.1:5001/api/projects/40/${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.MCP_AGENT_TOKEN}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`Локальная операция ${method} ${path}: HTTP ${response.status}`);
  return response.json();
}

/** Читает состояние; изменения выполняются только по явному флагу запуска. */
async function main() {
  assertLocal(process.env.DATABASE_URL);
  assertLocal(process.env.REDIS_URL);
  /** Режим проверяется до любых изменений состояния ботов. */
  const modeIndex = process.argv.indexOf('--mode');
  const mode = modeIndex < 0 ? 'ondemand' : process.argv[modeIndex + 1];
  if (!['direct', 'ondemand', 'process'].includes(mode)) throw new Error('Некорректный режим ботов');
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await db.connect();
    const { rows } = await db.query('SELECT id, name, launch_mode FROM bot_tokens WHERE project_id=40 AND id BETWEEN 30 AND 35 ORDER BY id');
    if (rows.length !== 6 || rows.some((row) => row.launch_mode === 'webhook')) {
      throw new Error('Состав или транспорт локальных тестовых ботов изменился');
    }
    for (const row of rows) {
      if (process.argv.includes('--stop-all')) await api('bot/stop', 'POST', { tokenId: row.id });
      if (process.argv.includes('--configure')) await api(`tokens/${row.id}/runtime-settings`, 'PUT', { mode });
      if (process.argv.includes('--restart')) await api('bot/restart', 'POST', { tokenId: row.id });
      if (process.argv.includes('--start-all')) await api('bot/start', 'POST', { tokenId: row.id });
      const settings = await api(`tokens/${row.id}/runtime-settings`);
      console.log(JSON.stringify({ tokenId: row.id, name: row.name, mode: settings.mode, launchMode: settings.launchMode }));
    }
    if (process.argv.includes('--recover-32')) {
      await api('bot/stop', 'POST', { tokenId: 32 });
      const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, commandTimeout: 5000 });
      try {
        const { rows: [token] } = await db.query('SELECT token FROM bot_tokens WHERE id=32 AND project_id=40');
        const key = `bot:lock:${token.token.slice(-10)}`;
        const deadline = Date.now() + 75000;
        while (await redis.exists(key)) {
          if (Date.now() >= deadline) throw new Error('Блокировка ещё удерживается; повторный polling не запущен');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } finally { redis.disconnect(); }
      await api('bot/start', 'POST', { tokenId: 32 });
      console.log(JSON.stringify({ tokenId: 32, recovered: true }));
    }
    const instances = await db.query(`SELECT token_id,status,desired_status FROM bot_instances
      WHERE project_id=40 AND token_id BETWEEN 30 AND 35 ORDER BY token_id`);
    console.log(JSON.stringify({ projectId: 40, instances: instances.rows }));
  } finally { await db.end(); }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
