/**
 * @fileoverview Точка входа для запуска всех unit-тестов dialog
 * Автоматически находит и запускает все .test.ts файлы
 * @module tests/run-unit-tests
 */

import { run } from 'node:test';
import { glob } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Устанавливаем UTF-8 кодировку для вывода в Windows
if (process.platform === 'win32') {
  try {
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
  } catch {
    // Игнорируем ошибки установки кодировки
  }
}

async function runTests() {
  const testFiles: string[] = [];
  const unitTestsDir = join(__dirname, 'unit');

  try {
    // Ищем все .test.ts файлы в unit-тестах
    for await (const file of glob('**/*.test.ts', { cwd: unitTestsDir })) {
      const fullPath = join(unitTestsDir, file);
      testFiles.push(fullPath);
    }
  } catch (error) {
    console.error('Ошибка поиска тестов:', error);
    process.exit(1);
  }

  if (testFiles.length === 0) {
    console.log('Unit-тесты не найдены');
    process.exit(0);
  }

  console.log(`\n📝 Найдено unit-тестов: ${testFiles.length}`);
  console.log('Запуск тестов...\n');

  // Запускаем тесты через tsx для поддержки TypeScript
  const testRun = run({
    files: testFiles,
    timeout: 60000,
    execArgv: ['--import', 'tsx/esm'],
    // Используем спецификацию для более читаемого вывода
    reporter: {
      write: (data: string) => {
        // Преобразуем TAP-вывод в читаемый формат
        process.stdout.write(data);
      }
    }
  });

  // Ждём завершения
  return new Promise<void>((resolve, reject) => {
    testRun.on('test:fail', () => {
      console.error('\n❌ Некоторые тесты не прошли');
      reject(new Error('Tests failed'));
    });

    testRun.on('test:pass', () => {
      // Тест прошёл
    });

    testRun.on('end', () => {
      console.log('\n✅ Все тесты завершены');
      resolve();
    });
  });
}

runTests().catch((error) => {
  console.error('Ошибка выполнения тестов:', error);
  process.exit(1);
});
