/** @fileoverview Генерирует полный сценарий для локальной проверки PostgreSQL, Redis и сна. */
import { generatePythonCode } from '../lib/bot-generator';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { generateBackgroundSources } from './runtime_background_fixture';

/** Минимальный настоящий граф с командой и ответом без внешних узлов. */
const graph = { nodes: [{ id: 'start', type: 'command_trigger', position: { x: 0, y: 0 },
  data: { command: '/start', description: 'Запуск проверки', messageText: 'Проверка ресурсов',
    buttons: [], keyboardType: 'none', showInMenu: false, autoTransitionTo: 'reply' } },
  { id: 'reply', type: 'message', position: { x: 200, y: 0 },
    data: { messageText: 'Проверка ресурсов', buttons: [], keyboardType: 'none' } }], connections: [] };
/** Полная генерация сохраняет настоящую инициализацию, аналитику и завершение. */
const code = generatePythonCode(graph as any, { botName: 'Ресурсная проверка', userDatabaseEnabled: true,
  projectId: 987654321, botRuntimeRole: true });
/** Сохраняет неизменяемые исходники всех ролей для длительного запуска без последующей генерации. */
if (process.argv.includes('--generate-payload-only')) {
  process.stdout.write(JSON.stringify({ main: code, background: generateBackgroundSources(987654321) }));
  process.exit(0);
}
/** Экспорт кода позволяет исполнить тот же граф в отдельном локальном Linux без Node.js. */
if (process.argv.includes('--generate-only')) {
  process.stdout.write(code);
  process.exit(0);
}
/** Интерпретатор можно задать отдельно для изолированного Linux-окружения. */
const python = process.env.PROBE_PYTHON ?? (existsSync('.venv/Scripts/python.exe') ? '.venv/Scripts/python.exe' : 'python3');
/** Потоковый вывод сохраняет контрольные точки даже при прерывании длинного прогона. */
const child = spawn(python, ['tools/runtime_full_resources_probe.py', ...process.argv.slice(2)], {
  stdio: ['pipe', 'inherit', 'inherit'], timeout: Number(process.env.PROBE_TIMEOUT_MS ?? 600_000),
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
});
/** Фоновые роли подключаются явно, сохраняя прежний минимальный CI-сценарий по умолчанию. */
child.stdin.end(process.argv.includes('--background-fixture')
  ? JSON.stringify({ main: code, background: generateBackgroundSources(987654321) }) : code, 'utf8');
/** Ошибка запуска интерпретатора делает результат проверки отрицательным. */
child.once('error', error => { console.error(error); process.exitCode = 1; });
/** Код завершения Python передаётся вызывающему CI без подмены успешным результатом. */
child.once('exit', status => { process.exitCode = status ?? 1; });
