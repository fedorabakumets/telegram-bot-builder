/**
 * @fileoverview Простой скрипт запуска тестов с UTF-8 выводом
 * Запускает тесты и выводит результаты в читаемом формате
 * @module tests/run-simple
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { glob } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Transform } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Устанавливаем UTF-8 кодировку
if (process.platform === 'win32') {
  try {
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
  } catch {}
}

async function runTests() {
  const testFiles: string[] = [];
  const unitTestsDir = join(__dirname, 'unit', 'utils');

  try {
    for await (const file of glob('*.test.ts', { cwd: unitTestsDir })) {
      testFiles.push(join(unitTestsDir, file));
    }
  } catch (error) {
    console.error('❌ Ошибка поиска тестов:', error);
    process.exit(1);
  }

  if (testFiles.length === 0) {
    console.log('⚠️  Unit-тесты не найдены');
    process.exit(0);
  }

  console.log(`\n📝 Найдено файлов с тестами: ${testFiles.length}`);
  console.log('🚀 Запуск тестов...\n');

  // Создаём кастомный стрим для преобразования TAP в читаемый формат
  let passed = 0;
  let failed = 0;

  const testRun = run({
    files: testFiles,
    timeout: 60000,
    execArgv: ['--import', 'tsx/esm']
  });

  // Подписываемся на события
  testRun.on('test:pass', () => passed++);
  testRun.on('test:fail', () => failed++);

  // Выводим TAP-результаты через spec reporter
  testRun.compose(new spec()).pipe(process.stdout);

  return new Promise<void>((resolve, reject) => {
    testRun.on('end', () => {
      const total = passed + failed;
      console.log('\n' + '═'.repeat(60));
      console.log(`📊 Результаты: ${total} тестов`);
      console.log(`   ✅ Прошло: ${passed}`);
      if (failed > 0) {
        console.log(`   ❌ Провалено: ${failed}`);
      }
      console.log('═'.repeat(60) + '\n');

      if (failed > 0) {
        console.log('❌ Тесты не прошли!\n');
        reject(new Error('Tests failed'));
      } else {
        console.log('✅ Все тесты прошли успешно!\n');
        resolve();
      }
    });
  });
}

runTests().catch(() => {
  process.exit(1);
});
