/**
 * @fileoverview Сверочный сценарий «Property 3: Структура страниц» для набора
 * документации по вкладкам конструктора (спека interface-tabs-docs).
 *
 * Скрипт опциональный и предназначен для запуска через `tsx`. Он проверяет, что
 * каждая страница набора:
 *   1) начинается ровно с одного заголовка `# ` (H1) в первой непустой строке,
 *      и нигде больше в документе нет заголовков уровня 1;
 *   2) содержит ровно один непустой вводный абзац между H1 и первым `## `;
 *   3) завершается разделом `## Связанные страницы`, тело которого содержит
 *      от 1 до 5 markdown-ссылок с относительными путями (не http/https);
 *   4) использует для всех тематических заголовков уровень H2 или ниже.
 *
 * Заголовки внутри огороженных блоков кода (```), не считаются заголовками.
 * Скрипт завершается с кодом 0 при успехе и ненулевым кодом с понятными
 * сообщениями по каждому проблемному файлу при неудаче.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/** Корень репозитория относительно расположения этого скрипта (tools/<dir>/file.ts). */
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
/** Базовый каталог с проверяемыми страницами. */
const DOCS_DIR = join(REPO_ROOT, 'docs', 'interface');

/** Список относительных путей страниц набора (относительно DOCS_DIR). */
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

/** Заголовок завершающего раздела перелинковки. */
const RELATED_HEADING = 'Связанные страницы';

/**
 * Структурированное представление строки документа с пометкой о том,
 * находится ли строка внутри огороженного блока кода.
 */
interface DocLine {
  /** Текст строки без завершающего перевода строки */
  text: string;
  /** Номер строки (с единицы) для сообщений об ошибках */
  number: number;
  /** Признак нахождения внутри блока кода ``` */
  inCode: boolean;
}

/**
 * Разбивает содержимое файла на строки и помечает строки внутри
 * огороженных блоков кода (открываются/закрываются строкой, начинающейся с ```).
 * @param content - Полное содержимое markdown-файла
 * @returns Массив строк с признаком блока кода
 */
function toDocLines(content: string): DocLine[] {
  const rawLines = content.split(/\r?\n/);
  const result: DocLine[] = [];
  let insideFence = false;
  rawLines.forEach((text, index) => {
    const isFence = /^\s*```/.test(text);
    // Строка-ограничитель сама по себе относится к блоку кода
    const inCode = insideFence || isFence;
    result.push({ text, number: index + 1, inCode });
    if (isFence) {
      insideFence = !insideFence;
    }
  });
  return result;
}

/**
 * Определяет уровень markdown-заголовка вне блоков кода.
 * @param line - Строка документа
 * @returns Уровень заголовка (1, 2, 3, ...) или 0, если строка не заголовок
 */
function headingLevel(line: DocLine): number {
  if (line.inCode) return 0;
  const match = /^(#{1,6})\s+\S/.exec(line.text);
  return match ? match[1].length : 0;
}

/**
 * Извлекает цели всех markdown-ссылок вида [текст](цель) из строки.
 * @param text - Исходная строка
 * @returns Массив целей ссылок
 */
function extractLinkTargets(text: string): string[] {
  const targets: string[] = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    targets.push(m[1].trim());
  }
  return targets;
}

/**
 * Проверяет, что цель ссылки — относительный путь (не http/https и не mailto).
 * @param target - Цель markdown-ссылки
 * @returns true, если ссылка относительная
 */
function isRelativeLink(target: string): boolean {
  return !/^(https?:)?\/\//i.test(target) && !/^[a-z]+:/i.test(target);
}

/**
 * Выполняет все проверки структуры для одной страницы.
 * @param relPath - Путь страницы относительно DOCS_DIR
 * @returns Список сообщений об ошибках (пустой, если страница корректна)
 */
function checkPage(relPath: string): string[] {
  const errors: string[] = [];
  const absPath = join(DOCS_DIR, relPath);

  let content: string;
  try {
    content = readFileSync(absPath, 'utf8');
  } catch {
    return [`не удалось прочитать файл: ${absPath}`];
  }

  const lines = toDocLines(content);
  const nonEmpty = lines.filter((l) => l.text.trim().length > 0);

  // Проверка 1: первая непустая строка — H1
  const first = nonEmpty[0];
  if (!first || headingLevel(first) !== 1) {
    errors.push('первая непустая строка не является заголовком уровня 1 (`# `)');
  }

  // Проверка 1/4: единственный H1 и отсутствие других заголовков уровня 1
  const h1Lines = lines.filter((l) => headingLevel(l) === 1);
  if (h1Lines.length === 0) {
    errors.push('в документе нет ни одного заголовка уровня 1 (`# `)');
  } else if (h1Lines.length > 1) {
    const extra = h1Lines.slice(1).map((l) => `строка ${l.number}`).join(', ');
    errors.push(`найдено несколько заголовков уровня 1 — допустим только один (лишние: ${extra})`);
  }
  // Если первая строка не H1, но H1 есть ниже — это тоже нарушение уровня заголовков
  if (h1Lines.length >= 1 && first && headingLevel(first) !== 1) {
    errors.push(`заголовок уровня 1 расположен не в первой непустой строке (строка ${h1Lines[0].number})`);
  }

  // Индекс первого H2 (для проверки вводного абзаца)
  const firstH2Index = lines.findIndex((l) => headingLevel(l) === 2);
  const h1Index = lines.findIndex((l) => headingLevel(l) === 1);

  // Проверка 2: ровно один непустой вводный абзац между H1 и первым H2
  if (h1Index !== -1) {
    const endIndex = firstH2Index === -1 ? lines.length : firstH2Index;
    const between = lines.slice(h1Index + 1, endIndex);
    const paragraphs = countParagraphs(between);
    if (firstH2Index === -1) {
      errors.push('не найден ни один заголовок уровня 2 (`## `) — страница не имеет тематических секций');
    }
    if (paragraphs !== 1) {
      errors.push(`между H1 и первым H2 должен быть ровно один вводный абзац, найдено: ${paragraphs}`);
    }
  }

  // Проверка 3: завершающий раздел «Связанные страницы» с 1–5 относительными ссылками
  const relatedErrors = checkRelatedSection(lines);
  errors.push(...relatedErrors);

  return errors;
}

/**
 * Подсчитывает количество непустых абзацев в наборе строк (вне блоков кода
 * абзацы разделяются пустыми строками). Заголовки в диапазоне не ожидаются.
 * @param block - Строки между H1 и первым H2
 * @returns Число непустых абзацев
 */
function countParagraphs(block: DocLine[]): number {
  let count = 0;
  let inParagraph = false;
  for (const line of block) {
    const isBlank = line.text.trim().length === 0;
    if (isBlank) {
      inParagraph = false;
    } else if (!inParagraph) {
      count += 1;
      inParagraph = true;
    }
  }
  return count;
}

/**
 * Проверяет наличие и корректность завершающего раздела «Связанные страницы».
 * @param lines - Все строки документа
 * @returns Список сообщений об ошибках для этого раздела
 */
function checkRelatedSection(lines: DocLine[]): string[] {
  const errors: string[] = [];

  // Найти последний заголовок уровня 2 и убедиться, что это «Связанные страницы»
  const h2Lines = lines.filter((l) => headingLevel(l) === 2);
  const lastH2 = h2Lines[h2Lines.length - 1];
  if (!lastH2) {
    errors.push('отсутствует завершающий раздел «## Связанные страницы»');
    return errors;
  }

  const lastH2Title = lastH2.text.replace(/^#{2}\s+/, '').trim();
  if (lastH2Title !== RELATED_HEADING) {
    errors.push(
      `последний раздел уровня 2 — «${lastH2Title}», ожидается «${RELATED_HEADING}» как завершающий`,
    );
    return errors;
  }

  // Тело раздела — строки после последнего H2 до конца документа
  const bodyStart = lines.indexOf(lastH2) + 1;
  const body = lines.slice(bodyStart);

  let relativeLinks = 0;
  let httpLinks = 0;
  for (const line of body) {
    if (line.inCode) continue;
    for (const target of extractLinkTargets(line.text)) {
      if (isRelativeLink(target)) {
        relativeLinks += 1;
      } else {
        httpLinks += 1;
      }
    }
  }

  if (relativeLinks < 1 || relativeLinks > 5) {
    errors.push(
      `в разделе «${RELATED_HEADING}» должно быть от 1 до 5 относительных ссылок, найдено: ${relativeLinks}`,
    );
  }
  if (httpLinks > 0) {
    errors.push(
      `в разделе «${RELATED_HEADING}» найдены абсолютные (http/https) ссылки (${httpLinks}) — ожидаются только относительные`,
    );
  }

  return errors;
}

/**
 * Точка входа: проверяет все страницы и печатает отчёт.
 * @returns Код завершения процесса (0 — успех, 1 — есть нарушения)
 */
function main(): number {
  let failed = 0;
  const lines: string[] = [];

  for (const page of PAGES) {
    const errors = checkPage(page);
    if (errors.length === 0) {
      lines.push(`✅ ${page}`);
    } else {
      failed += 1;
      lines.push(`❌ ${page}`);
      for (const err of errors) {
        lines.push(`     - ${err}`);
      }
    }
  }

  console.log('Property 3: Структура страниц — проверка набора документации\n');
  console.log(lines.join('\n'));
  console.log('');

  if (failed === 0) {
    console.log(`Итог: все ${PAGES.length} страниц прошли проверку структуры.`);
    return 0;
  }
  console.log(`Итог: проблемы на ${failed} из ${PAGES.length} страниц.`);
  return 1;
}

process.exit(main());
