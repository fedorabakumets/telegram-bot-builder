/**
 * @fileoverview Безопасный локальный замер памяти процессов и последних профилей без изменения их состояния.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const execute = promisify(execFile);

/** Читает именованный аргумент; параметры не передаются в командную оболочку. */
function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
}

/** Проверяет список идентификаторов процессов, исключая произвольный код. */
function processIds(value) {
  if (!/^\d+(,\d+)*$/.test(value ?? '')) throw new Error('Нужен --pids 123,456');
  return value.split(',').map(Number);
}

/** Получает рабочий набор и приватный коммит Windows без чтения командных строк и переменных среды. */
async function sample(ids) {
  const script = `@(Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | ForEach-Object { [PSCustomObject]@{ pid=$_.Id; name=$_.ProcessName; rssBytes=$_.WorkingSet64; privateCommitBytes=$_.PrivateMemorySize64; startedAt=$_.StartTime.ToUniversalTime().ToString('o') } }) | ConvertTo-Json -Compress`;
  const { stdout } = await execute('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);
  const parsed = stdout.trim() ? JSON.parse(stdout) : [];
  const processes = Array.isArray(parsed) ? parsed : [parsed];
  return { timestamp: new Date().toISOString(), processes,
    totalRssBytes: processes.reduce((sum, item) => sum + item.rssBytes, 0),
    totalPrivateCommitBytes: processes.reduce((sum, item) => sum + item.privateCommitBytes, 0),
    missingPids: ids.filter(id => !processes.some(item => item.pid === id)) };
}

/** Извлекает только диагностические JSON-события; прочие строки журнала не сохраняются. */
async function profiles(path, ids) {
  const events = (await readFile(path, 'utf8')).split(/\r?\n/).flatMap(line => {
    try {
      const event = JSON.parse(line);
      return ['runner_memory', 'worker_memory_profile'].includes(event.type) ? [event] : [];
    } catch { return []; }
  });
  const python = events.filter(event => event.type === 'worker_memory_profile' && ids.includes(event.pid));
  const runner = events.filter(event => event.type === 'runner_memory' && ids.includes(event.pid));
  const latest = python.at(-1);
  return {
    pythonProfileCount: python.length, runnerSampleCount: runner.length,
    latestPython: latest ?? null, latestRunner: runner.at(-1) ?? null,
    recentPythonTrend: python.slice(-10).map(event => ({ timestamp: event.timestamp,
      pid: event.pid, tracedCurrentBytes: event.tracedCurrentBytes,
      tracerOverheadBytes: event.tracerOverheadBytes, durationMs: event.durationMs })),
    observedTopAllocationBytes: latest ? {
      namespaceCopies: latest.topAllocations.filter(item => item.file.endsWith('lazy_aiogram.py')).reduce((sum, item) => sum + item.bytes, 0),
      compiledCodeCache: latest.topAllocations.filter(item => item.file.endsWith('bot_code_cache.py')).reduce((sum, item) => sum + item.bytes, 0),
    } : null,
  };
}

/** Создаёт воспроизводимый артефакт; измерение не вызывает сборку мусора и не управляет процессами. */
async function main() {
  if (process.platform !== 'win32') throw new Error('Этот сборщик предназначен для Windows');
  const ids = processIds(argument('pids'));
  const count = Number(argument('samples', '3'));
  const interval = Number(argument('interval-ms', '2000'));
  if (!Number.isInteger(count) || count < 1 || count > 10 || !Number.isFinite(interval)
      || interval < 0 || interval * (count - 1) > 15000) throw new Error('Недопустимая длительность замера');
  const samples = [];
  for (let index = 0; index < count; index++) {
    if (index) await new Promise(done => setTimeout(done, interval));
    samples.push(await sample(ids));
  }
  const log = resolve(argument('log', 'output/local-runtime/memory-runtime.log'));
  const report = { schemaVersion: 1, label: argument('label', 'measurement'),
    capturedAt: new Date().toISOString(), platform: process.platform, requestedPids: ids,
    notes: ['RSS — текущий рабочий набор Windows, может снижаться при вытеснении страниц ОС.',
      'PrivateCommit — приватная зарезервированная память, не синоним RSS и не добавляется к нему.',
      'RSS процессов может содержать общие страницы; сумма не равна уникальной физической памяти.',
      'tracemalloc не покрывает все нативные выделения; его накладные расходы учитываются отдельно.',
      'Сводка строк относится к topAllocations, а не ко всем выделениям соответствующего файла.',
      'Сравнивать нужно одинаковые режимы, нагрузку, длительность прогрева и настройки диагностики.'],
    samples, diagnostics: await profiles(log, ids) };
  const destination = resolve(argument('output', 'output/local-runtime/memory-measurement.json'));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ destination, samples: samples.map(item => ({ timestamp: item.timestamp,
    rssMiB: +(item.totalRssBytes / 1048576).toFixed(2),
    privateCommitMiB: +(item.totalPrivateCommitBytes / 1048576).toFixed(2), missingPids: item.missingPids })),
    allocations: report.diagnostics.observedTopAllocationBytes }));
}
await main();
