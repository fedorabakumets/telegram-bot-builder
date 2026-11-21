/** @fileoverview Настоящий Python-брокер под управлением Node в двух режимах с имитацией Telegram. */
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';

vi.mock('../../server/database/project-telegram-accounts-store', () => ({
  DuplicateProjectTelegramSessionError: class extends Error {}, ProjectTelegramSessionReplacementError: class extends Error {},
  getProjectTelegramAccount: vi.fn(async () => ({ id: 81, status: 'connected' })),
  getProjectTelegramAccountSecrets: vi.fn(async () => ({
    session: { apiId: '12345', apiHash: 'synthetic', sessionString: 'synthetic-session-no-telegram-key' }, proxy: null,
  })),
  setProjectTelegramAccountSession: vi.fn(), confirmProjectTelegramAccountSession: vi.fn(),
  getProjectTelegramAccountForBot: vi.fn(async () => ({ accountId: 81,
    session: { apiId: '12345', apiHash: 'synthetic', sessionString: 'synthetic-session-no-telegram-key' }, proxy: null,
  })),
}));
vi.mock('../../server/telegram/auth-middleware', () => ({ getOwnerIdFromRequest: () => 101 }));
vi.mock('../../server/storages/storage', () => ({ storage: {
  getBotInstanceByToken: vi.fn(async () => ({ desiredGeneration: 1, desiredStatus: 'running', status: 'running' })),
} }));
import { registerProjectTelegramRunnerRoute } from '../../server/routes/project-telegram-runner-route';
import { registerProjectTelegramAccountConnectionRoutes } from '../../server/routes/projectTelegramAccounts/project-telegram-account-connection-routes';
import { projectTelegramRunnerKey } from '../../server/bots/project-telegram-runner-auth';
import { startTelegramBrokerProcess } from '../../server/runner/telegram-broker-process';

/** Используется только заранее установленный Python с тестовыми зависимостями. */
const python = process.env.TBB_TEST_PYTHON || (existsSync('.venv-botcraft/Scripts/python.exe')
  ? resolve('.venv-botcraft/Scripts/python.exe') : 'python3');
const secret = 'synthetic_broker_secret_for_chain_test_only';
const fixture = resolve('lib/tests/fixtures/telegram-embedded-broker.py');
const processes = new Set<ChildProcess>();
let supervisedStarts = 0;
/** Запоминает только дочерние процессы настоящего supervisor для аварийной уборки текущего теста. */
const trackedSpawn = new Proxy(spawn, { apply(target, receiver, args) {
  supervisedStarts += 1;
  const child = Reflect.apply(target, receiver, args) as ChildProcess;
  processes.add(child);
  child.once('exit', () => processes.delete(child));
  return child;
} });
let api: Server;
let apiBase: string;

/** Возвращает незанятый loopback-порт для собственного тестового процесса. */
async function freePort(): Promise<number> {
  const socket = createServer();
  await new Promise<void>(done => socket.listen(0, '127.0.0.1', done));
  const port = (socket.address() as { port: number }).port;
  await new Promise<void>(done => socket.close(() => done()));
  return port;
}

/** Запускает собственный Python без пользовательских секретов и внешних сервисов. */
function launch(script: string, env: NodeJS.ProcessEnv) {
  const process = spawn(python, [script], { windowsHide: true, env });
  processes.add(process);
  const output = { out: '', error: '' };
  process.stdout.on('data', data => { output.out += data; });
  process.stderr.on('data', data => { output.error += data; });
  const exited = new Promise<number | null>((done, reject) => {
    process.once('error', reject);
    process.once('exit', code => { processes.delete(process); done(code); });
  });
  return { process, output, exited };
}

/** Подготавливает только синтетическое окружение и marker владения текущего стенда. */
async function environment() {
  const directory = await mkdtemp(join(tmpdir(), 'telegram-deployment-modes-'));
  const registry = join(directory, 'registry');
  await writeFile(registry, 'unowned');
  const port = await freePort();
  return { directory, registry, env: {
    PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP,
    /** Облачный IPv6 bind обязан одновременно принимать IPv4 healthcheck. */
    PYTHONIOENCODING: 'utf-8', TELETHON_BROKER_MODE: 'embedded', TELETHON_BROKER_HOST: '::', TELETHON_BROKER_ALLOW_PRIVATE_NETWORK: '1',
    TELETHON_BROKER_PORT: String(port), TELETHON_BROKER_URL: `http://127.0.0.1:${port}`,
    TELETHON_BROKER_SECRET: secret, TELETHON_BROKER_SCRIPT: fixture,
    TELETHON_BROKER_LOCK_FILE: join(directory, 'broker.lock'), TELETHON_BROKER_STDIN_CONTROL: '1',
    TELETHON_BROKER_TEST_REGISTRY_FILE: registry, TELETHON_BROKER_TEST_STATS_FILE: join(directory, 'stats.json'), REDIS_URL: 'redis://synthetic.invalid',
  } };
}

/** Ожидает HTTP-готовность без открытия Telegram-клиента. */
async function readiness(base: string) {
  await vi.waitFor(async () => expect((await fetch(`${base}/healthz`)).status).toBe(200), { timeout: 8_000, interval: 50 });
}

beforeAll(async () => {
  vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '1');
  vi.stubEnv('PROJECT_TELEGRAM_RUNNER_SECRET', 'synthetic_runner_secret_for_chain_test_only');
  vi.stubEnv('TELETHON_BROKER_SECRET', secret);
  const app = express();
  app.use(express.json());
  registerProjectTelegramRunnerRoute(app);
  registerProjectTelegramAccountConnectionRoutes(app, (_req, _res, next) => next(), (_req, _res, next) => next());
  api = app.listen(0, '127.0.0.1');
  await new Promise<void>(done => api.once('listening', done));
  apiBase = `http://127.0.0.1:${(api.address() as { port: number }).port}`;
});

afterAll(async () => {
  /** Удаляет только принадлежащие данному тесту деревья процессов при аварии проверки. */
  for (const child of processes) {
    if (process.platform === 'win32' && child.pid) {
      try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch {}
    } else child.kill();
  }
  await new Promise<void>(done => api.close(() => done()));
  vi.unstubAllEnvs();
});

for (const mode of ['external', 'embedded'] as const) {
  it(`${mode}: два раннера используют одну сессию, а штатная остановка освобождает владельца`, async () => {
    const { env, registry } = await environment();
    const unexpected = vi.fn();
    let external: ReturnType<typeof launch> | undefined;
    if (mode === 'external') external = launch(fixture, env);
    const startsBefore = supervisedStarts;
    const supervisor = await startTelegramBrokerProcess({ env: { ...env, TELETHON_BROKER_MODE: mode },
      pythonPath: python, workerScript: '', onUnexpectedExit: unexpected, startupTimeoutMs: 10_000, spawnProcess: trackedSpawn,
    });
    await readiness(env.TELETHON_BROKER_URL);
    expect(supervisedStarts - startsBefore).toBe(mode === 'embedded' ? 1 : 0);
    expect(existsSync(env.TELETHON_BROKER_TEST_STATS_FILE)).toBe(false);
    expect(await readFile(registry, 'utf8')).not.toBe('unowned');
    vi.stubEnv('TELETHON_BROKER_URL', env.TELETHON_BROKER_URL);
    const consumers = launch(resolve('lib/tests/fixtures/telegram-chain-consumers.py'), { ...env,
      PROJECT_TELEGRAM_API_BASE: apiBase, PROJECT_ID: '9', CHAIN_BROKER: env.TELETHON_BROKER_URL,
      CHAIN_KEYS: JSON.stringify([5, 62].map(token => [token, projectTelegramRunnerKey(9, token, 1, 81)])),
    });
    expect(await consumers.exited, consumers.output.error).toBe(0);
    expect(consumers.output.error).toBe('');
    expect(JSON.parse(consumers.output.out).stats).toEqual({ opens: 1, closes: 0, sent: 2, clicked: 1 });
    await supervisor.close();
    if (external) {
      expect((await fetch(`${env.TELETHON_BROKER_URL}/healthz`)).status).toBe(200);
      external.process.stdin.write('shutdown\n');
      expect(await external.exited, external.output.error).toBe(0);
    }
    expect(unexpected).not.toHaveBeenCalled();
    expect(await readFile(registry, 'utf8')).toBe('unowned');
    expect(JSON.parse(await readFile(env.TELETHON_BROKER_TEST_STATS_FILE, 'utf8')).closes).toBe(1);
  });
}

it('embedded: занятый реестр запрещает старт, авария не разрешает автоматический повтор', async () => {
  const { env, registry } = await environment();
  await writeFile(registry, 'another-live-owner');
  await expect(startTelegramBrokerProcess({ env, pythonPath: python, workerScript: '',
    onUnexpectedExit: vi.fn(), startupTimeoutMs: 5_000, spawnProcess: trackedSpawn,
  })).rejects.toThrow();
  expect(await readFile(registry, 'utf8')).toBe('another-live-owner');
  expect(existsSync(env.TELETHON_BROKER_TEST_STATS_FILE)).toBe(false);
  await writeFile(registry, 'unowned');
  const unexpected = vi.fn();
  const supervisor = await startTelegramBrokerProcess({ env, pythonPath: python, workerScript: '',
    onUnexpectedExit: unexpected, startupTimeoutMs: 8_000, spawnProcess: trackedSpawn,
  });
  await fetch(`${env.TELETHON_BROKER_URL}/v1/verify`, { method: 'POST', headers: {
    Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json',
  }, body: JSON.stringify({ accountId: 81, sessionString: 'synthetic-session-no-telegram-key' }) });
  await fetch(`${env.TELETHON_BROKER_URL}/test/crash`, { method: 'POST', headers: { Authorization: `Bearer ${secret}` } });
  const startsAtCrash = supervisedStarts;
  await vi.waitFor(() => expect(unexpected).toHaveBeenCalledTimes(1));
  expect(supervisedStarts).toBe(startsAtCrash);
  expect(await readFile(registry, 'utf8')).not.toBe('unowned');
  await supervisor.close();
  await expect(startTelegramBrokerProcess({ env, pythonPath: python, workerScript: '',
    onUnexpectedExit: vi.fn(), startupTimeoutMs: 5_000, spawnProcess: trackedSpawn,
  })).rejects.toThrow();
  expect(JSON.parse(await readFile(env.TELETHON_BROKER_TEST_STATS_FILE, 'utf8')).opens).toBe(1);
});
