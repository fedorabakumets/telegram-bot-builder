/** @fileoverview Генерация и адресное исполнение фоновых fixtures без production и сети Telegram. */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateBackgroundSources } from './runtime_background_fixture';

/** Каталог содержит только обезличенный сгенерированный код данной проверки. */
const directory = mkdtempSync(join(tmpdir(), 'tbb-background-fixture-test-'));
try {
  const generated = join(directory, 'sources.json');
  writeFileSync(generated, JSON.stringify(generateBackgroundSources(987654321)), 'utf8');
  const python = existsSync('.venv/Scripts/python.exe') ? '.venv/Scripts/python.exe' : 'python3';
  execFileSync(python, ['tools/test_runtime_background_fixture.py', generated], { stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
} finally {
  rmSync(directory, { recursive: true, force: true });
}
