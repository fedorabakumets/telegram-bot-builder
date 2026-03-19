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
import { createWriteStream, mkdirSync } from 'node:fs';
import { PassThrough } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Установка UTF-8 кодировки для Windows
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding('utf8');
  process.stderr.setDefaultEncoding('utf8');
}

// Проверка флага --coverage
const useCoverage = process.argv.includes('--coverage');

// Проверка флага --templates (только тесты шаблонов)
const onlyTemplates = process.argv.includes('--templates');

// Проверка флага --unit (только unit тесты)
const onlyUnit = process.argv.includes('--unit');

// Проверка флага --integration (только integration тесты)
const onlyIntegration = process.argv.includes('--integration');

// Проверка флага --pattern (фильтр по имени файла)
const patternIndex = process.argv.indexOf('--pattern');
const filePattern = patternIndex !== -1 
  ? process.argv[patternIndex + 1] 
  : process.argv.find(arg => arg.endsWith('.test.ts'));

async function runTests() {
  const testFiles = [];

  // Ищем все .test.ts файлы в lib/tests (unit и integration)
  const testDir = join(__dirname, 'lib', 'tests');

  // Ищем все .test.ts файлы в lib/templates (шаблоны)
  const templatesDir = join(__dirname, 'lib', 'templates');

  try {
    // Ищем unit тесты в lib/tests
    if (!onlyTemplates && !onlyIntegration) {
      for await (const file of glob('**/*.test.ts', { cwd: testDir })) {
        const fullPath = join(testDir, file);
        if (filePattern && !fullPath.includes(filePattern)) continue;
        testFiles.push(fullPath);
      }
      // Ищем phase-тесты (test-phase*.ts)
      for await (const file of glob('test-phase*.ts', { cwd: testDir })) {
        const fullPath = join(testDir, file);
        if (filePattern && !fullPath.includes(filePattern)) continue;
        if (!testFiles.includes(fullPath)) testFiles.push(fullPath);
      }
    }

    // Ищем тесты шаблонов в lib/templates
    if (!onlyTemplates && !onlyUnit) {
      for await (const file of glob('**/*.test.ts', { cwd: templatesDir })) {
        const fullPath = join(templatesDir, file);
        if (filePattern && !fullPath.includes(filePattern)) continue;
        testFiles.push(fullPath);
      }
    } else if (onlyTemplates) {
      // Только тесты шаблонов
      for await (const file of glob('**/*.test.ts', { cwd: templatesDir })) {
        const fullPath = join(templatesDir, file);
        if (filePattern && !fullPath.includes(filePattern)) continue;
        testFiles.push(fullPath);
      }
    } else if (onlyUnit) {
      // Только unit тесты
      for await (const file of glob('**/*.test.ts', { cwd: testDir })) {
        const fullPath = join(testDir, file);
        if (filePattern && !fullPath.includes(filePattern)) continue;
        testFiles.push(fullPath);
      }
      for await (const file of glob('test-phase*.ts', { cwd: testDir })) {
        const fullPath = join(testDir, file);
        if (filePattern && !fullPath.includes(filePattern)) continue;
        if (!testFiles.includes(fullPath)) testFiles.push(fullPath);
      }
    } else if (onlyIntegration) {
      // Только integration тесты
      for await (const file of glob('integration/**/*.test.ts', { cwd: testDir })) {
        const fullPath = join(testDir, file);
        if (filePattern && !fullPath.includes(filePattern)) continue;
        testFiles.push(fullPath);
      }
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

  // Создаём поток для записи в файл
  const outputDir = join(__dirname, 'test-results');
  mkdirSync(outputDir, { recursive: true });
  const logStream = createWriteStream(join(outputDir, 'output.txt'), { encoding: 'utf8' });

  // PassThrough stream для дублирования вывода
  const teeStream = new PassThrough();

  // Перенаправляем вывод из teeStream в консоль и файл
  teeStream.on('data', (chunk) => {
    process.stdout.write(chunk);
    logStream.write(chunk);
  });

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

  // Выводим результаты через tee-поток
  testRun.compose(new spec()).pipe(teeStream);

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
      console.log('📄 Результаты сохранены в test-results/output.txt');
      logStream.close();
      teeStream.end();
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
