/**
 * @fileoverview Скрипт для запуска всех тестов проекта
 *
 * Находит и запускает все .test.js файлы в папке client/lib/tests
 *
 * @module run-tests
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { glob } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runTests() {
  const testFiles = [];
  
  // Ищем все .test.js файлы в client/lib/tests
  const testDir = join(__dirname, 'client', 'lib', 'tests');
  
  try {
    for await (const file of glob('**/*.test.js', { cwd: testDir })) {
      const fullPath = join(testDir, file);
      testFiles.push(fullPath);
    }
  } catch (error) {
    console.error('Ошибка поиска тестов:', error.message);
    process.exit(1);
  }
  
  if (testFiles.length === 0) {
    console.log('Тесты не найдены');
    process.exit(0);
  }
  
  console.log(`Найдено тестов: ${testFiles.length}`);
  console.log('Запуск тестов...\n');
  
  // Запускаем тесты
  const testRun = run({
    files: testFiles,
    timeout: 60000, // Увеличенный timeout
  });
  
  // Выводим результаты
  testRun.compose(new spec()).pipe(process.stdout);
  
  // Ждём завершения
  testRun.on('test:fail', () => {
    process.exit(1);
  });
  
  testRun.on('test:pass', () => {
    // Тест прошёл
  });
}

runTests().catch(error => {
  console.error('Ошибка выполнения тестов:', error);
  process.exit(1);
});
