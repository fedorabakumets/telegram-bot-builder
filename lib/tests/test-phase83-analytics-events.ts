/**
 * @fileoverview Фаза 83: исполнение аналитики v2 и компиляция полного сгенерированного бота.
 * @module tests/test-phase83-analytics-events
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generateMessageLoggingCode } from '../templates/middleware/middleware.renderer';
import { generatePythonCode } from '../bot-generator';

/** Временная папка для исполняемого Python и результатов компиляции. */
const directory = mkdtempSync(join(tmpdir(), 'botcraft-analytics-v2-'));
try {
  const middleware = join(directory, 'middleware.py');
  writeFileSync(middleware, generateMessageLoggingCode(true, true, 12, true), 'utf8');
  execFileSync('python', [resolve('lib/tests/analytics-events-runtime.py'), middleware], { stdio: 'inherit' });
  // Последовательность middleware → обёртка сохраняет reply/inline и не удваивает сообщения.
  execFileSync('python', [resolve('lib/tests/analytics-reply-history-runtime.py'), middleware], { stdio: 'inherit' });
  // Настоящий локальный Dispatcher проверяет фильтры и middleware без сети Telegram.
  execFileSync('python', [resolve('lib/tests/analytics-dispatcher-runtime.py'), middleware], { stdio: 'inherit' });
  const project = { nodes: [{ id: 'start', type: 'command_trigger', position: { x: 0, y: 0 }, data: { command: '/start', buttons: [], messageText: '' } }], connections: [] };
  for (const database of [true, false]) {
    const generated = join(directory, `bot-${database}.py`);
    writeFileSync(generated, generatePythonCode(project as never, { botName: 'AnalyticsTest', userDatabaseEnabled: database, projectId: 12 }), 'utf8');
    execFileSync('python', ['-m', 'py_compile', generated], { stdio: 'inherit' });
  }
  console.log('✅ Аналитика v2: исполняемые проверки и компиляция двух конфигураций прошли');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
