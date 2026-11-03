/**
 * @fileoverview Исполняемая фазовая проверка сгенерированного загрузчика медиа.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateMediaOriginal } from '../templates/media-functions/media-functions.renderer';

/** Временная папка с результатом генерации. */
const directory = mkdtempSync(join(tmpdir(), 'tbb-media-original-'));
try {
  const generated = join(directory, 'media.py');
  writeFileSync(generated, generateMediaOriginal());
  execFileSync('python', ['-m', 'py_compile', generated]);
  const result = execFileSync('python', [join(process.cwd(), 'lib/tests/test-media-original.py'), generated], {
    encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
  console.log(result.trim());
} finally {
  rmSync(directory, { recursive: true, force: true });
}
