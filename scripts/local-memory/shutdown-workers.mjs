/** @fileoverview Штатное завершение локальных Python-воркеров перед обновлением исполнителя. */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import pg from 'pg';

/** Запрещает управление production и завершение при работающих ботах. */
async function main() {
  for (const value of [process.env.REDIS_URL, process.env.DATABASE_URL]) {
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(value).hostname)) throw new Error('Только локальное окружение');
  }
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const redis = new Redis(process.env.REDIS_URL, { commandTimeout: 5000, maxRetriesPerRequest: 1 });
  try {
    await db.connect();
    const { rows } = await db.query("SELECT id FROM bot_instances WHERE desired_status='running'");
    if (rows.length) throw new Error('Сначала штатно остановите ботов через API');
    const q = randomUUID();
    await redis.xadd('tbb:runner:default:cmd', '*', 'k', 'inspect', 'q', q);
    let snapshot;
    for (let attempt = 0; attempt < 30 && !snapshot; attempt++) {
      const entries = await redis.xrevrange('tbb:runner:default:ev', '+', '-', 'COUNT', 100);
      for (const [, values] of entries) {
        const fields = {};
        for (let i = 0; i < values.length; i += 2) fields[values[i]] = values[i + 1];
        if (fields.k === 'snapshot' && fields.q === q) snapshot = JSON.parse(fields.d);
      }
      if (!snapshot) await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!snapshot) throw new Error('Исполнитель не подтвердил состав процессов');
    for (const worker of snapshot.workers) {
      await redis.xadd('tbb:runner:default:cmd', '*', 'k', 'line', 'w', String(worker.workerKey),
        'i', worker.instance, 'l', JSON.stringify({ cmd: 'shutdown' }));
    }
    console.log(JSON.stringify({ shutdownRequested: snapshot.workers.length }));
  } finally { redis.disconnect(); await db.end(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
