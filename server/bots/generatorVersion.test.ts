/** @fileoverview Проверка инвалидирования сборок при изменении корневых файлов генератора. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGeneratorVersion, resetGeneratorVersionCache } from './generatorVersion';

/**
 * Выполнить проверку с отдельным деревом исходников и восстановить рабочий каталог.
 * @param check - Проверка версии внутри временного каталога.
 * @returns Завершение проверки и удаления только созданной тестовой директории.
 */
async function withGeneratorSources(check: (directory: string) => Promise<void>): Promise<void> {
  const prefix = join(tmpdir(), 'generator-version-');
  const directory = mkdtempSync(prefix);
  const original = process.cwd();
  mkdirSync(join(directory, 'lib', 'bot-generator'), { recursive: true });
  writeFileSync(join(directory, 'lib', 'bot-generator.ts'), '/** @fileoverview Тестовая точка входа генератора. */\n');
  writeFileSync(join(directory, 'lib', 'scaffolding.ts'), '/** @fileoverview Тестовая точка входа каркаса. */\n');
  writeFileSync(join(directory, 'lib', 'bot-generator', 'index.ts'), '/** @fileoverview Тестовый модуль генератора. */\n');
  try {
    process.chdir(directory);
    resetGeneratorVersionCache();
    await check(directory);
  } finally {
    process.chdir(original);
    resetGeneratorVersionCache();
    // Удаление ограничено каталогом, созданным этой фикстурой.
    assert.ok(directory.startsWith(prefix));
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('версия корневых исходников генератора', () => {
  for (const filename of ['bot-generator.ts', 'scaffolding.ts']) {
    it(`изменяется после правки lib/${filename}`, async () => {
      await withGeneratorSources(async directory => {
        const before = await getGeneratorVersion();
        writeFileSync(join(directory, 'lib', filename), '/** @fileoverview Изменённый тестовый исходник. */\n');
        resetGeneratorVersionCache();
        assert.notEqual(await getGeneratorVersion(), before);
      });
    });
  }

  it('сохраняет версию неизменённых исходников и учитывает вложенные модули', async () => {
    await withGeneratorSources(async directory => {
      const before = await getGeneratorVersion();
      resetGeneratorVersionCache();
      assert.equal(await getGeneratorVersion(), before);
      writeFileSync(join(directory, 'lib', 'bot-generator', 'index.ts'), '/** @fileoverview Изменённый вложенный модуль. */\n');
      resetGeneratorVersionCache();
      assert.notEqual(await getGeneratorVersion(), before);
    });
  });
});
