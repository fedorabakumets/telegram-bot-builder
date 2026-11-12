/**
 * @fileoverview Изолированная проверка приёмника Test01; по умолчанию только план.
 */
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';
import pg from 'pg';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

/** Выполняет разрешённую локальную команду API, скрывая тело ошибки. */
async function api(env, action) {
  const response = await fetch(`http://127.0.0.1:5000/api/projects/40/bot/${action}`, {
    method: 'POST', headers: { Authorization: `Bearer ${env.MCP_AGENT_TOKEN}`,
      'Content-Type': 'application/json' }, body: JSON.stringify({ tokenId: 31 }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`Локальная команда ${action}: HTTP ${response.status}`);
}

/** Проверяет сборку до остановки и всегда восстанавливает обычный запуск. */
async function main() {
  const execute = process.argv.includes('--execute');
  if (!execute) {
    console.log('План: прочитать S3 и проверить протокол; остановить только token31; поднять отдельный worker; проверить arm/status; shutdown; восстановить token31 через API. Нет инъекций updates и Telegram сообщений. Для запуска требуется --execute.');
    return;
  }
  const env = dotenv.parse(readFileSync('.env'));
  if ((env.BOT_POLLING_MODE || 'direct') !== 'direct') {
    throw new Error('Разрешены только исходные настройки direct для восстановления');
  }
  if (!['127.0.0.1', 'localhost'].includes(new URL(env.DATABASE_URL).hostname)
      || !['127.0.0.1', 'localhost'].includes(new URL(env.REDIS_URL).hostname)) {
    throw new Error('Разрешены только локальные PostgreSQL и Redis');
  }
  const db = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  let directory;
  let worker;
  let stopped = false;
  try {
    await db.connect();
    await db.query('BEGIN READ ONLY');
    const { rows: [row] } = await db.query(`SELECT t.token, b.sha256, b.object_key,
      b.storage_config_id, s.config, s.secrets_enc FROM bot_tokens t
      JOIN bot_builds b ON b.token_id=t.id JOIN storage_configs s ON s.id=b.storage_config_id
      WHERE t.id=31 AND t.project_id=40 ORDER BY b.created_at DESC,b.id DESC LIMIT 1`);
    const overrides = await db.query(`SELECT value FROM bot_env_variables
      WHERE token_id=31 AND key='BOT_POLLING_MODE'`);
    await db.query('ROLLBACK');
    if (overrides.rows.some((item) => item.value !== 'direct')) {
      throw new Error('Разрешены только исходные настройки direct для восстановления');
    }
    if (!row || row.storage_config_id !== 'silo-bot-builds-local') throw new Error('Не найдена тестовая сборка S3');
    process.env.STORAGE_ENCRYPTION_KEY = env.STORAGE_ENCRYPTION_KEY;
    const { decryptCredentials } = await import('../../server/storage/storage-secrets.ts');
    const s3 = new S3Client({ endpoint: row.config.endpointUrl, region: row.config.region || 'us-east-1',
      forcePathStyle: row.config.forcePathStyle === true, credentials: decryptCredentials(row.secrets_enc) });
    let source;
    try {
      const object = await s3.send(new GetObjectCommand({ Bucket: row.config.bucket, Key: row.object_key }));
      source = gunzipSync(await object.Body.transformToByteArray());
    } finally { s3.destroy(); }
    if (createHash('sha256').update(source).digest('hex') !== row.sha256) throw new Error('SHA сборки не совпал');
    if (!/^_WORKER_EXTERNAL_UPDATES_PROTOCOL\s*=\s*(?:True|1)/m.test(source.toString())
        || !/^_WORKER_EXTERNAL_UPDATES_SAFE\s*=\s*(?:True|1)/m.test(source.toString())) {
      throw new Error('Сборка S3 не поддерживает безопасный ondemand: сначала регенерация');
    }
    directory = mkdtempSync(join(tmpdir(), 'tbb-local-demand-'));
    const file = join(directory, 'bot.py');
    writeFileSync(file, source);
    await api(env, 'stop');
    stopped = true;
    worker = spawn(resolve('.venv/Scripts/python.exe'), ['-u', resolve('server/python/worker.py')], {
      env: { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT,
        PYTHONIOENCODING: 'utf-8', REDIS_URL: env.REDIS_URL }, stdio: ['pipe', 'pipe', 'pipe'],
    });
    let observed = '';
    worker.stdout.on('data', (chunk) => { observed += chunk.toString(); });
    worker.stderr.on('data', () => {});
    worker.stdin.write(JSON.stringify({ cmd: 'start_bot', token_id: 31, token: row.token,
      bot_file: file, env: { REDIS_URL: env.REDIS_URL, BOT_POLLING_MODE: 'ondemand',
        BOT_ON_DEMAND_TOKEN_IDS: '31', BOT_ON_DEMAND_IDLE_SECONDS: '1' } }) + '\n');
    await new Promise((finish) => setTimeout(finish, 5000));
    worker.stdin.write('{"cmd":"status"}\n');
    await new Promise((finish) => setTimeout(finish, 1000));
    console.log(JSON.stringify({ targetTokenId: 31, s3Integrity: true,
      receiverReady: observed.includes('bot_started:31'),
      handlerAwoke: observed.includes('Пробуждение обработчика'),
      note: 'Содержимое логов скрыто; отсутствие wake ожидается только при пустой очереди' }));
  } finally {
    if (worker && worker.exitCode === null) {
      worker.stdin.write('{"cmd":"shutdown"}\n');
      await Promise.race([new Promise((finish) => worker.once('exit', finish)),
        new Promise((finish) => setTimeout(finish, 20000))]);
      if (worker.exitCode === null) throw new Error('Изолированный worker не остановлен: восстановление запрещено до освобождения lease');
    }
    if (stopped) await api(env, 'start');
    if (directory) rmSync(directory, { recursive: true, force: true });
    await db.end();
  }
}

main().catch((error) => {
  const safe = /^(Сборка S3|Изолированный worker|Локальная команда|Разрешены|Не найдена|SHA сборки)/.test(error.message);
  console.error(safe ? error.message : 'Проверка остановлена; подробности с секретами скрыты');
  process.exitCode = 1;
});
