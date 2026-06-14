/**
 * @fileoverview Сверочный сценарий «Property 1: Состав набора страниц» для спецификации
 * interface-tabs-docs. Проверяет, что в каталоге `docs/interface/` присутствуют все
 * ожидаемые страницы документации вкладок (7 плоских страниц, подстраницы каталогов
 * `tables/` и `broadcasts/`), а служебные файлы `tables/_meta.json` и
 * `broadcasts/_meta.json` существуют и содержат валидный JSON с полями `title` и `order`.
 * Сценарий завершается кодом 0 при успехе и ненулевым кодом со списком проблем при сбое.
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5
 * @module tools/interface-tabs-docs-checks/property-1-page-set
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/** Абсолютный путь к каталогу текущего скрипта (для устойчивости к месту запуска). */
const scriptDir = dirname(fileURLToPath(import.meta.url));

/** Корень репозитория: на два уровня выше `tools/interface-tabs-docs-checks/`. */
const repoRoot = resolve(scriptDir, '..', '..');

/** Базовый каталог документации вкладок. */
const interfaceDir = join(repoRoot, 'docs', 'interface');

/**
 * Список ожидаемых markdown-страниц относительно `docs/interface/`.
 * Включает 7 плоских страниц и подстраницы каталогов `tables/` и `broadcasts/`.
 */
const expectedPages: string[] = [
  'bot.md',
  'terminal.md',
  'users.md',
  'dialogs.md',
  'analytics.md',
  'files.md',
  'code.md',
  'tables/overview.md',
  'tables/editing.md',
  'tables/import-export.md',
  'tables/system-tables.md',
  'broadcasts/overview.md',
  'broadcasts/create.md',
  'broadcasts/id-database.md',
];

/** Список служебных файлов `_meta.json`, которые должны содержать валидный JSON. */
const expectedMetaFiles: string[] = [
  'tables/_meta.json',
  'broadcasts/_meta.json',
];

/** Накопитель сообщений об обнаруженных проблемах. */
const problems: string[] = [];

/**
 * Проверяет существование всех ожидаемых markdown-страниц.
 * @returns Количество подтверждённых страниц
 */
function checkPages(): number {
  let found = 0;
  for (const relativePath of expectedPages) {
    const absolutePath = join(interfaceDir, relativePath);
    if (existsSync(absolutePath)) {
      found += 1;
    } else {
      problems.push(`Отсутствует страница: docs/interface/${relativePath}`);
    }
  }
  return found;
}

/**
 * Проверяет существование `_meta.json` и наличие в них валидного JSON
 * с непустыми полями `title` (строка) и `order` (число).
 * @returns Количество корректных служебных файлов
 */
function checkMetaFiles(): number {
  let valid = 0;
  for (const relativePath of expectedMetaFiles) {
    const absolutePath = join(interfaceDir, relativePath);
    if (!existsSync(absolutePath)) {
      problems.push(`Отсутствует служебный файл: docs/interface/${relativePath}`);
      continue;
    }
    try {
      const raw = readFileSync(absolutePath, 'utf-8');
      const parsed = JSON.parse(raw) as { title?: unknown; order?: unknown };
      const hasTitle = typeof parsed.title === 'string' && parsed.title.trim().length > 0;
      const hasOrder = typeof parsed.order === 'number' && Number.isFinite(parsed.order);
      if (!hasTitle) {
        problems.push(`В docs/interface/${relativePath} отсутствует строковое поле "title"`);
      }
      if (!hasOrder) {
        problems.push(`В docs/interface/${relativePath} отсутствует числовое поле "order"`);
      }
      if (hasTitle && hasOrder) {
        valid += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      problems.push(`Не удалось разобрать JSON в docs/interface/${relativePath}: ${message}`);
    }
  }
  return valid;
}

/**
 * Точка входа сценария: выполняет проверки и завершает процесс с нужным кодом.
 */
function main(): void {
  const foundPages = checkPages();
  const validMeta = checkMetaFiles();

  if (problems.length === 0) {
    console.log(
      `✅ Property 1 пройдено: найдены все ${foundPages}/${expectedPages.length} страниц ` +
        `и ${validMeta}/${expectedMetaFiles.length} служебных файла _meta.json.`,
    );
    process.exit(0);
  }

  console.error('❌ Property 1 не пройдено. Обнаруженные проблемы:');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

main();
