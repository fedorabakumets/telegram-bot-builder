/**
 * @fileoverview Проверка независимого освобождения ресурсов настоящего шаблона main.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generateMain } from '../templates/main/main.renderer';

/** Временный каталог содержит только сгенерированный шаблон теста. */
const directory = mkdtempSync(join(tmpdir(), 'botcraft-main-cleanup-'));
try {
  const generated = join(directory, 'main.py');
  writeFileSync(generated, generateMain({ userDatabaseEnabled: true, hasScheduleTrigger: true, hasUserbotNodes: true }), 'utf8');
  execFileSync('python', [resolve('lib/tests/main-cleanup-resources-runtime.py'), generated], { stdio: 'inherit' });
} finally {
  rmSync(directory, { recursive: true, force: true });
}
