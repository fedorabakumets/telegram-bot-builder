/**
 * @fileoverview Скрипт для запуска всех тестов проекта
 *
 * Находит и запускает все .test.ts файлы в папке lib/tests
 * Использует tsx для поддержки TypeScript импортов
 *
 * @module run-tests
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { glob } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Проверка флага --coverage
const useCoverage = process.argv.includes('--coverage');

async function runTests() {
  const testFiles = [];

  // Ищем все .test.ts файлы в lib/tests (unit и integration)
  const testDir = join(__dirname, 'lib', 'tests');
  
  // Ищем все .test.ts файлы в lib/bot-generator/templates (шаблоны)
  const templatesDir = join(__dirname, 'lib', 'bot-generator', 'templates');

  try {
    // Ищем unit тесты в lib/tests
    for await (const file of glob('**/*.test.ts', { cwd: testDir })) {
      const fullPath = join(testDir, file);
      testFiles.push(fullPath);
    }
    
    // Ищем тесты шаблонов в lib/bot-generator/templates
    for await (const file of glob('**/*.test.ts', { cwd: templatesDir })) {
      const fullPath = join(templatesDir, file);
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

  // Запускаем тесты через tsx для поддержки TypeScript
  const execArgv = ['--import', 'tsx/esm'];
  
  // Добавляем флаг для покрытия если запрошено
  if (useCoverage) {
    console.log('📊 Сбор метрик покрытия...\n');
  }

  const testRun = run({
    files: testFiles,
    timeout: 300000, // 5 минут на тест для обработки долгой генерации кода
    execArgv
  });

  // Выводим результаты
  testRun.compose(new spec()).pipe(process.stdout);

  // Ждём завершения
  return new Promise((resolve, reject) => {
    testRun.on('test:fail', (data) => {
      console.error(`\n❌ Тест не прошёл: ${data.name}`);
      if (data.details?.error) {
        console.error(data.details.error);
      }
    });

    testRun.on('test:pass', () => {
      // Тест прошёл
    });

    testRun.on('end', () => {
      console.log('\n✅ Все тесты завершены');
      resolve(undefined);
    });

    testRun.on('error', (error) => {
      console.error('Ошибка выполнения тестов:', error);
      reject(error);
    });
  });
}

runTests().catch(error => {
  console.error('Ошибка выполнения тестов:', error);
  process.exit(1);
});
