/** @fileoverview Полная HTTP-цепочка двух раннеров и профиля с имитацией Telegram. */
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import express from 'express';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';

/** Управляемое состояние только синтетической записи раннера. */
const state = vi.hoisted(() => ({ generation: 1, accountId: 81, desiredStatus: 'running', status: 'running' }));
vi.mock('../../server/database/project-telegram-accounts-store', () => ({
  DuplicateProjectTelegramSessionError: class extends Error {},
  ProjectTelegramSessionReplacementError: class extends Error {},
  getProjectTelegramAccount: vi.fn(async () => ({ id: 81, status: 'connected' })),
  getProjectTelegramAccountSecrets: vi.fn(async () => ({
    session: { apiId: '12345', apiHash: 'synthetic', sessionString: 'synthetic-session-no-telegram-key' }, proxy: null,
  })),
  setProjectTelegramAccountSession: vi.fn(),
  confirmProjectTelegramAccountSession: vi.fn(),
  getProjectTelegramAccountForBot: vi.fn(async (projectId: number, tokenId: number) =>
    projectId === 9 && [5, 62].includes(tokenId) ? {
      accountId: state.accountId, session: { apiId: '12345', apiHash: 'synthetic', sessionString: 'synthetic-session-no-telegram-key' }, proxy: null,
    } : null),
}));
vi.mock('../../server/telegram/auth-middleware', () => ({ getOwnerIdFromRequest: () => 101 }));
vi.mock('../../server/storages/storage', () => ({
  storage: { getBotInstanceByToken: vi.fn(async () => ({ desiredGeneration: state.generation, desiredStatus: state.desiredStatus, status: state.status })) },
}));

import { registerProjectTelegramRunnerRoute } from '../../server/routes/project-telegram-runner-route';
import { projectTelegramRunnerKey } from '../../server/bots/project-telegram-runner-auth';
import { registerProjectTelegramAccountConnectionRoutes } from '../../server/routes/projectTelegramAccounts/project-telegram-account-connection-routes';

/** Выбор подготовленного Python без установки пакетов и изменения рабочего окружения. */
const python = process.env.TBB_TEST_PYTHON || (existsSync('.venv-botcraft/Scripts/python.exe')
  ? resolve('.venv-botcraft/Scripts/python.exe') : 'python3');
let api: Server;
let base: string;
const children = new Set<ChildProcess>();

/**
 * Запускает исключительно изолированный стенд с синтетическим окружением.
 * @param fixture - Тестовый файл Python.
 * @param variables - Только параметры стенда, без пользовательских секретов.
 * @returns Процесс и накопленный вывод.
 */
function launch(fixture: string, variables: Record<string, string> = {}) {
  const child = spawn(python, [resolve('lib/tests/fixtures', fixture)], {
    windowsHide: true, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot,
      TEMP: process.env.TEMP, TMP: process.env.TMP, PYTHONIOENCODING: 'utf-8', ...variables },
  });
  children.add(child);
  const output = { stdout: '', stderr: '' };
  child.stdout.on('data', value => { output.stdout += value; });
  child.stderr.on('data', value => { output.stderr += value; });
  child.once('exit', () => children.delete(child));
  return { child, output };
}

/**
 * Ожидает первую JSON-строку готовности брокера без фиксированной задержки.
 * @param process - Собственный тестовый процесс.
 * @returns Случайный порт настоящего Python HTTP-брокера.
 */
function ready(process: ReturnType<typeof launch>): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const timer = setTimeout(() => reject(new Error(`Брокер не готов: ${process.output.stderr}`)), 10_000);
    process.child.once('error', reject);
    process.child.once('exit', code => { clearTimeout(timer); reject(new Error(`Брокер завершился ${code}: ${process.output.stderr}`)); });
    process.child.stdout.on('data', () => {
      if (!process.output.stdout.includes('\n')) return;
      clearTimeout(timer);
      try { resolvePort(JSON.parse(process.output.stdout.split('\n')[0]).port); } catch (error) { reject(error); }
    });
  });
}

beforeAll(async () => {
  vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '1');
  vi.stubEnv('PROJECT_TELEGRAM_RUNNER_SECRET', 'synthetic_runner_secret_for_chain_test_only');
  vi.stubEnv('TELETHON_BROKER_SECRET', 'synthetic_broker_secret_for_chain_test_only');
  const app = express();
  app.use(express.json());
  registerProjectTelegramRunnerRoute(app);
  registerProjectTelegramAccountConnectionRoutes(app, (_req, _res, next) => next(), (_req, _res, next) => next());
  api = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolveReady => api.once('listening', resolveReady));
  base = `http://127.0.0.1:${(api.address() as { port: number }).port}`;
});

afterAll(async () => {
  /** Windows venv создаёт дочерний Python, поэтому завершаем всё собственное тестовое дерево. */
  for (const child of children) {
    if (process.platform === 'win32' && child.pid) {
      try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch {}
    } else child.kill();
  }
  if (api) await new Promise<void>(resolveClosed => api.close(() => resolveClosed()));
  vi.unstubAllEnvs();
});

it('проводит два актуальных bridge через API и общий брокер, включая перезапуск брокера', async () => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const broker = launch('telegram-chain-broker.py');
    const port = await ready(broker);
    const brokerBase = `http://127.0.0.1:${port}`;
    vi.stubEnv('TELETHON_BROKER_URL', brokerBase);
    const keys = [5, 62].map(token => [token, projectTelegramRunnerKey(9, token, 1, 81)]);
    const consumer = launch('telegram-chain-consumers.py', {
      PROJECT_TELEGRAM_API_BASE: base, PROJECT_ID: '9', CHAIN_KEYS: JSON.stringify(keys), CHAIN_BROKER: brokerBase,
    });
    const code = await new Promise<number | null>((resolveExit, reject) => {
      consumer.child.once('error', reject);
      consumer.child.once('exit', resolveExit);
    });
    expect(consumer.output.stderr).toBe('');
    expect(code, consumer.output.stdout).toBe(0);
    expect(JSON.parse(consumer.output.stdout)).toEqual({ profile: true, stats: { opens: 1, closes: 0, sent: 2, clicked: 1 } });
    const unauthorized = await fetch(`${base}/internal/project-telegram/9/5/execute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer synthetic-invalid-key' },
      body: JSON.stringify({ operation: 'status', args: {} }),
    });
    expect(unauthorized.status).toBe(401);
    /** Старое поколение и прежняя привязка не могут выполнить даже синтетическую отправку. */
    for (const key of [projectTelegramRunnerKey(9, 5, 0, 81), projectTelegramRunnerKey(9, 5, 1, 80)]) {
      const rejected = await fetch(`${base}/internal/project-telegram/9/5/execute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ operation: 'send_message', args: { target: 7, text: 'Не отправлять', parse_mode: null, link_preview: false } }),
      });
      expect(rejected.status).toBe(401);
    }
    state.status = 'stopped';
    const stopped = await fetch(`${base}/internal/project-telegram/9/5/execute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${projectTelegramRunnerKey(9, 5, 1, 81)}` },
      body: JSON.stringify({ operation: 'status', args: {} }),
    });
    expect(stopped.status).toBe(401);
    state.status = 'running';
    /** Оба бота получают точный код отсутствующей кнопки от общего имитатора Telegram. */
    for (const token of [5, 62]) {
      const missing = await fetch(`${base}/internal/project-telegram/9/${token}/execute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json',
          Authorization: `Bearer ${projectTelegramRunnerKey(9, token, 1, 81)}` },
        body: JSON.stringify({ operation: 'click_button', args: {
          target: 7, message_id: 1, data_b64: Buffer.from('missing').toString('base64'),
        } }),
      });
      expect(missing.status).toBe(404);
      expect(await missing.json()).toEqual({ code: 'BUTTON_NOT_FOUND' });
    }
    const stats = await fetch(`${brokerBase}/test/stats`, { headers: {
      Authorization: 'Bearer synthetic_broker_secret_for_chain_test_only',
    } });
    expect(await stats.json()).toEqual({ opens: 1, closes: 0, sent: 2, clicked: 1 });
    const exited = new Promise(resolveExit => broker.child.once('exit', resolveExit));
    await fetch(`${brokerBase}/test/shutdown`, { method: 'POST', headers: {
      Authorization: 'Bearer synthetic_broker_secret_for_chain_test_only',
    } });
    await exited;
    expect(broker.output.stderr).toBe('');
  }
}, 60_000);
