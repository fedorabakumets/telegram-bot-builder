/**
 * @fileoverview Сверочный сценарий «Property 5: Границы достоверности» для набора
 * документации по вкладкам конструктора (`docs/interface/`).
 *
 * Проверяет два инварианта дизайна:
 *  1. Ни одна из 14 страниц набора не описывает экспорт данных в Google Таблицы
 *     как доступную возможность (поиск упоминаний «Google Таблиц» / «Google Sheets» /
 *     «Гугл Таблиц» без учёта регистра).
 *  2. Страница `broadcasts/overview.md` содержит описание видимого баннера
 *     «Устаревшая вкладка» и упоминание, что рассылка теперь доступна в панели диалога.
 *
 * Запуск: `npx tsx tools/interface-tabs-docs-checks/property-5-boundaries.ts`
 * Код возврата 0 — успех; ненулевой код и понятные сообщения — при нарушении.
 *
 * Validates: Requirements 3.2, 3.4, 14.6, 15.2 (Correctness Property 5).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Абсолютный путь к каталогу этого скрипта */
const __dirname = dirname(fileURLToPath(import.meta.url));
/** Корень репозитория (на два уровня выше: tools/interface-tabs-docs-checks/) */
const REPO_ROOT = join(__dirname, '..', '..');
/** Каталог набора страниц документации */
const INTERFACE_DIR = join(REPO_ROOT, 'docs', 'interface');

/**
 * Полный набор из 14 страниц: 7 плоских + 4 в `tables/` + 3 в `broadcasts/`.
 * Пути указаны относительно `docs/interface/`.
 */
const PAGES: string[] = [
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

/**
 * Регулярные выражения для обнаружения запрещённого упоминания экспорта
 * в Google Таблицы. Регистронезависимы; покрывают латиницу и кириллицу.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /google\s+таблиц/i,
  /google\s+sheets/i,
  /гугл\s+таблиц/i,
];

/**
 * Считывает содержимое страницы по относительному пути.
 * @param relPath - Путь относительно `docs/interface/`
 * @returns Текст файла
 */
function readPage(relPath: string): string {
  return readFileSync(join(INTERFACE_DIR, relPath), 'utf8');
}

/**
 * Проверка 1: ни одна страница не упоминает Google Таблицы / Google Sheets.
 * @returns Список найденных нарушений с именем страницы, номером строки и текстом
 */
function checkNoGoogleSheets(): string[] {
  const violations: string[] = [];
  for (const page of PAGES) {
    const lines = readPage(page).split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(line)) {
          violations.push(`${page}:${idx + 1}: ${line.trim()}`);
        }
      }
    });
  }
  return violations;
}

/**
 * Проверка 2: на `broadcasts/overview.md` описан баннер об устаревании вкладки.
 * @returns Список выявленных проблем (пустой — если описание присутствует)
 */
function checkDeprecationBanner(): string[] {
  const problems: string[] = [];
  const text = readPage('broadcasts/overview.md');
  if (!/Устаревшая вкладка/i.test(text)) {
    problems.push(
      'broadcasts/overview.md: отсутствует описание баннера «Устаревшая вкладка»',
    );
  }
  // Дополнительно: упоминание, что рассылка теперь доступна в панели диалога.
  if (!/панел[иья].{0,40}диалог|диалог.{0,40}панел[иья]/i.test(text)) {
    problems.push(
      'broadcasts/overview.md: нет упоминания, что рассылка доступна в панели диалога',
    );
  }
  return problems;
}

/**
 * Точка входа: запускает обе проверки и формирует итоговый отчёт.
 */
function main(): void {
  const googleViolations = checkNoGoogleSheets();
  const bannerProblems = checkDeprecationBanner();

  let failed = false;

  if (googleViolations.length > 0) {
    failed = true;
    console.error('❌ Проверка 1 (нет экспорта в Google Таблицы) провалена:');
    for (const v of googleViolations) console.error(`   - ${v}`);
  } else {
    console.log('✅ Проверка 1: упоминаний экспорта в Google Таблицы не найдено.');
  }

  if (bannerProblems.length > 0) {
    failed = true;
    console.error('❌ Проверка 2 (баннер об устаревании «Рассылки») провалена:');
    for (const p of bannerProblems) console.error(`   - ${p}`);
  } else {
    console.log('✅ Проверка 2: баннер «Устаревшая вкладка» описан на broadcasts/overview.md.');
  }

  if (failed) {
    console.error('\nProperty 5 (Границы достоверности): НАРУШЕНА.');
    process.exit(1);
  }

  console.log('\nProperty 5 (Границы достоверности): соблюдена для всех 14 страниц.');
  process.exit(0);
}

main();
