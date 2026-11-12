/**
 * @fileoverview Чтение локального состояния тестовых ботов без секретов и изменений.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import pg from 'pg';
import Redis from 'ioredis';

/** Проверяет, что соединение направлено только на локальный компьютер. */
function assertLocal(raw) {
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(raw).hostname)) {
    throw new Error('Разрешена только локальная диагностика');
  }
}

/** Собирает типы нод без содержимого сообщений и пользовательских данных. */
function nodeTypes(data) {
  const counts = {};
  const compatibility = { delays: [], inputs: [], backgroundTimers: false,
    scheduleTrigger: false, apiTrigger: false, userbot: false };
  /** Обходит структуру проекта, считая только типы нод. */
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.nodes)) {
      for (const node of value.nodes) {
        counts[node.type] = (counts[node.type] ?? 0) + 1;
        const data = node.data || {};
        if (node.type === 'delay') compatibility.delays.push({ id: node.id,
          mode: data.mode || 'blocking', seconds: data.seconds, unit: data.unit });
        if (node.type === 'input') compatibility.inputs.push({ id: node.id,
          inputTimeout: data.inputTimeout ?? null });
        if (Number(data.inputTimeout) > 0 || (node.type === 'delay' && data.mode === 'background')
            || (node.type === 'parallel_split' && !data.awaitAll)) compatibility.backgroundTimers = true;
        if (node.type === 'schedule_trigger' && data.autoTransitionTo) compatibility.scheduleTrigger = true;
        if (node.type === 'api_trigger' && data.autoTransitionTo) compatibility.apiTrigger = true;
        if (node.type?.startsWith('userbot')) compatibility.userbot = true;
      }
    }
    for (const [key, child] of Object.entries(value)) if (key !== 'nodes') visit(child);
  };
  visit(data);
  return { counts, compatibility };
}

/** Выполняет только SELECT в PostgreSQL и PING в Redis. */
async function main() {
  const env = dotenv.parse(readFileSync('.env'));
  assertLocal(env.DATABASE_URL);
  const redisUrl = env.REDIS_URL || 'redis://127.0.0.1:6379';
  assertLocal(redisUrl);
  const db = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  const redis = new Redis(redisUrl, { lazyConnect: true, connectTimeout: 3000,
    commandTimeout: 3000, maxRetriesPerRequest: 0, retryStrategy: () => null });
  redis.on('error', () => {});
  try {
    await db.connect();
    await db.query('BEGIN READ ONLY');
    const instances = await db.query(`SELECT token_id, status, desired_status,
      desired_generation, process_id FROM bot_instances WHERE project_id=40 ORDER BY token_id`);
    const builds = await db.query(`SELECT DISTINCT ON (token_id) token_id, storage_config_id,
      size, generator_version, created_at FROM bot_builds WHERE project_id=40
      ORDER BY token_id, created_at DESC, id DESC`);
    const variables = await db.query(`SELECT id, key, is_secret FROM bot_env_variables WHERE token_id=31`);
    const project = await db.query('SELECT data FROM bot_projects WHERE id=40');
    await db.query('ROLLBACK');
    await redis.connect();
    let processes = [];
    if (process.platform === 'win32') {
      const command = "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'server[\\\\/]python[\\\\/]worker.py' -or $_.CommandLine -match 'server[\\\\/]runner' } | ForEach-Object { $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; if ($p) { [pscustomobject]@{ pid=$p.Id; parent=$_.ParentProcessId; name=$p.ProcessName; rssMiB=[math]::Round($p.WorkingSet64/1MB,2); privateMiB=[math]::Round($p.PrivateMemorySize64/1MB,2) } } } | ConvertTo-Json -Compress";
      processes = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { encoding: 'utf8' }) || '[]');
    }
    console.log(JSON.stringify({ capturedAt: new Date().toISOString(), projectId: 40,
      targetTokenId: 31, redis: await redis.ping(), instances: instances.rows,
      builds: builds.rows, variableKeys: variables.rows,
      nodeTypes: nodeTypes(project.rows[0]?.data), processes }, null, 2));
  } finally {
    redis.disconnect();
    await db.end();
  }
}

main().catch(() => { console.error('Локальная диагностика не завершена; секретные подробности скрыты'); process.exitCode = 1; });
