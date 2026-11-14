/**
 * @fileoverview Проверка независимого освобождения ресурсов настоящего шаблона main.
 */
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generateMain } from '../templates/main/main.renderer';

/** Временный каталог содержит только сгенерированный шаблон теста. */
const directory = mkdtempSync(join(tmpdir(), 'botcraft-main-cleanup-'));
try {
  const generated = join(directory, 'main.py');
  /** Исполняемая конфигурация обязана содержать реальную ветку закрытия Telethon. */
  const source = generateMain({ userDatabaseEnabled: true, hasScheduleTrigger: true, hasUserbotNodes: true });
  assert.ok(source.includes('userbot_client.disconnect'), 'Включённый userbot должен генерировать закрытие Telethon');
  assert.ok(!generateMain({ hasUserbotNodes: false }).includes('userbot_client.disconnect'), 'Отключённый userbot не должен генерировать закрытие Telethon');
  writeFileSync(generated, source, 'utf8');
  execFileSync('python', [resolve('lib/tests/main-cleanup-resources-runtime.py'), generated], { stdio: 'inherit' });
  /** Настоящий polling не должен регистрировать loop signal handles отдельных ботов. */
  const polling = join(directory, 'polling.py');
  assert.ok(readFileSync(resolve('server/python/worker.py'), 'utf8').includes('module._worker_manages_signals = True'),
    'Воркер обязан передать владение сигналами до запуска main');
  writeFileSync(polling, generateMain({ userDatabaseEnabled: false, menuCommands: [] }), 'utf8');
  execFileSync('python', [resolve('lib/tests/main-polling-signals-runtime.py'), polling], { stdio: 'inherit' });
} finally {
  rmSync(directory, { recursive: true, force: true });
}
