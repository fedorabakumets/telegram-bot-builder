/**
 * @fileoverview Локальный снимок статусов и памяти Python без изменения ботов.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';

/** Адрес намеренно ограничен локальным стендом. */
const base = 'http://127.0.0.1:5000';
const env = dotenv.parse(readFileSync('.env'));
const headers = { Authorization: `Bearer ${env.MCP_AGENT_TOKEN}` };

/** Читает локальный API, не выводя авторизацию или исходные токены. */
async function get(path) {
  const response = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`API ${response.status}: ${path}`);
  return response.json();
}

/** Оставляет только идентификаторы и признаки состояния экземпляров. */
function statuses(value) {
  const rows = Array.isArray(value) ? value : value.statuses ?? value.bots ?? [];
  const list = Array.isArray(rows) ? rows : Object.entries(rows).map(([id, row]) => ({ tokenId: Number(id), ...row }));
  return list.map(row => ({ tokenId: row.tokenId, status: row.status,
    desiredStatus: row.desiredStatus, processId: row.processId,
    mode: row.pollingMode, handlerPid: row.handlerPid }));
}

/** Читает текущие Windows Working Set и Private Bytes без командной строки процессов. */
function pythonMemory() {
  if (process.platform !== 'win32') return { unavailable: 'Снимок рассчитан на Windows' };
  const command = 'Get-Process | Where-Object {$_.ProcessName -in @("python","python3")} | '
    + 'Select-Object Id,@{n="workingSetMiB";e={[math]::Round($_.WorkingSet64/1MB,2)}},'
    + '@{n="privateMiB";e={[math]::Round($_.PrivateMemorySize64/1MB,2)}} | ConvertTo-Json -Compress';
  const output = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8' }).trim();
  return output ? JSON.parse(output) : [];
}

const [bots, workers] = await Promise.all([get('/api/projects/40/bot/statuses'), get('/api/workers/stats')]);
console.log(JSON.stringify({ at: new Date().toISOString(), projectId: 40,
  bots: statuses(bots), workers, python: pythonMemory() }, null, 2));
