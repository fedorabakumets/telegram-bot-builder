/**
 * @fileoverview Явное переключение шести локальных тестовых ботов со сменой общего воркера.
 */
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import dotenv from 'dotenv';

/** Локальный стенд и фиксированный набор разрешённых записей токенов. */
const base = 'http://127.0.0.1:5000';
const projectId = 40;
const tokenIds = [30, 31, 32, 33, 34, 35];
const env = dotenv.parse(readFileSync('.env'));
const args = process.argv.slice(2);
const execute = args.includes('--execute');
const mode = args.find(arg => arg.startsWith('--mode='))?.slice(7) ?? 'process';
if (args.some(arg => arg !== '--execute' && !arg.startsWith('--mode='))) throw new Error('Неизвестный аргумент');
if (!['process', 'ondemand', 'direct'].includes(mode)) throw new Error('Недопустимый режим');
const database = new URL(env.DATABASE_URL ?? 'invalid:');
if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) {
  throw new Error('Операция разрешена только при локальном DATABASE_URL');
}
if (!env.MCP_AGENT_TOKEN) throw new Error('Не задан локальный MCP_AGENT_TOKEN');
const headers = { Authorization: `Bearer ${env.MCP_AGENT_TOKEN}`, 'Content-Type': 'application/json' };

/** Выполняет локальный запрос, не выводя тело ошибки с потенциальными секретами. */
async function api(path, method = 'GET', body) {
  try {
    const response = await fetch(`${base}${path}`, { method, headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.success === false) throw new Error('Операция отклонена');
    return result;
  } catch (error) {
    const reason = /^HTTP \d+$/.test(error.message) ? error.message : 'запрос не завершён успешно';
    throw new Error(`${method} ${path.split('?')[0]}: ${reason}`);
  }
}

/** Ожидает подтверждения состояния с ограниченным общим временем. */
async function waitFor(label, predicate, timeout = 90000) {
  const until = Date.now() + timeout;
  do {
    if (await predicate()) return;
    await delay(1000);
  } while (Date.now() < until);
  throw new Error(`Таймаут: ${label}`);
}

/** Читает только локальные статусы фиксированного проекта. */
async function statuses() {
  return (await api(`/api/projects/${projectId}/bot/statuses`)).statuses;
}

/** Создаёт либо меняет только три несекретные настройки выбранного токена. */
async function configure(tokenId) {
  const suffix = '?telegram_id=1612141295';
  const path = `/api/bot/tokens/${tokenId}/env`;
  const { items } = await api(path + suffix);
  const values = { BOT_POLLING_MODE: mode, BOT_ON_DEMAND_IDLE_SECONDS: '30', BOT_ON_DEMAND_MAX_ACTIVE: '4' };
  for (const [key, value] of Object.entries(values)) {
    const existing = items.find(item => item.key === key);
    await api(existing ? `/api/bot/env/${existing.id}${suffix}` : path + suffix,
      existing ? 'PATCH' : 'POST', { key, value, isSecret: 0 });
  }
}

/** Сохраняет очереди и снимки; при частичной ошибке не делает рискованный автооткат. */
async function run() {
  const before = await statuses();
  if (!Array.isArray(before) || tokenIds.some(id => !before.some(row => row.tokenId === id))) {
    throw new Error('Фиксированный набор ботов отсутствует в локальном проекте 40');
  }
  console.log(JSON.stringify({ execute, projectId, tokenIds, mode,
    plan: 'stop-all → подтверждение остановки и выхода воркера → env upsert → последовательный start → running' }));
  if (!execute) return;
  for (const tokenId of tokenIds) {
    await api(`/api/projects/${projectId}/bot/stop`, 'POST', { tokenId });
    console.log(`Остановка подтверждена API: ${tokenId}`);
  }
  await waitFor('все боты остановлены и общий воркер завершён', async () => {
    const [rows, workers] = await Promise.all([statuses(), api('/api/workers/stats')]);
    return tokenIds.every(id => rows.some(row => row.tokenId === id && row.status === 'stopped'))
      && !workers.details.some(row => row.projectId === projectId);
  });
  for (const tokenId of tokenIds) await configure(tokenId);
  for (const tokenId of tokenIds) {
    await api(`/api/projects/${projectId}/bot/start`, 'POST', { tokenId });
    console.log(`Запуск подтверждён API: ${tokenId}`);
  }
  await waitFor('все шесть ботов running', async () => {
    const rows = await statuses();
    return tokenIds.every(id => rows.some(row => row.tokenId === id && row.status === 'running'));
  }, 120000);
  console.log(JSON.stringify({ complete: true, mode, projectId, tokenIds }));
}

run().catch(error => { console.error(error.message); process.exitCode = 1; });
