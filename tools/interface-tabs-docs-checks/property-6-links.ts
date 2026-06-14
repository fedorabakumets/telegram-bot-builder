/**
 * @fileoverview Сверочный сценарий «Property 6: Целостность перелинковки» для
 * набора документации по вкладкам конструктора (спека interface-tabs-docs).
 *
 * Скрипт опциональный и предназначен для запуска через `tsx`. Он проверяет:
 *   1) что каждая относительная markdown-ссылка (цель оканчивается на `.md`,
 *      возможно с префиксом `../`), разрешённая относительно каталога
 *      содержащего файла, ведёт к реально существующему файлу `.md` на диске;
 *      битые ссылки сообщаются в формате `страница -> цель`;
 *   2) что у каждой подстраницы каталога (`tables/` и `broadcasts/`) раздел
 *      «Связанные страницы» содержит хотя бы одну ссылку на другую подстраницу
 *      того же каталога — то есть ссылку на файл вида `имя.md` без `../`.
 *
 * Ссылки на http(s) игнорируются. Якоря (`#...`) у целей отбрасываются.
 * Скрипт завершается с кодом 0 при успехе и ненулевым кодом с понятными
 * сообщениями при наличии нарушений.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, posix } from 'node:path';

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
    const inCode = insideFence || isFence;
    result.push({ text, number: index + 1, inCode });
    if (isFence) {
      insideFence = !insideFence;
    }
  });
  return result;
}

/**
 * Извлекает цели всех markdown-ссылок вида [текст](цель) из строки.
 * @param text - Исходная строка
 * @returns Массив целей ссылок (как записаны в документе)
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
 * Проверяет, что цель ссылки — http(s)-ссылка (такие ссылки игнорируются).
 * @param target - Цель markdown-ссылки
 * @returns true, если ссылка абсолютная http/https (или протокол-относительная)
 */
function isHttpLink(target: string): boolean {
  return /^(https?:)?\/\//i.test(target);
}

/**
 * Отбрасывает якорь (`#...`) у цели ссылки и обрезает пробелы.
 * @param target - Цель markdown-ссылки
 * @returns Путь без якоря
 */
function stripAnchor(target: string): string {
  const hashIndex = target.indexOf('#');
  return (hashIndex === -1 ? target : target.slice(0, hashIndex)).trim();
}

/**
 * Описание одной относительной ссылки на `.md`, найденной в документе.
 */
interface FoundLink {
  /** Цель ссылки без якоря, как записана в документе */
  target: string;
  /** Номер строки документа */
  line: number;
  /** Признак того, что ссылка находится в разделе «Связанные страницы» */
  inRelated: boolean;
}

/**
 * Собирает все относительные ссылки на `.md` из документа с пометкой,
 * находятся ли они в завершающем разделе «Связанные страницы».
 * @param lines - Все строки документа
 * @returns Список найденных относительных `.md`-ссылок
 */
function collectMdLinks(lines: DocLine[]): FoundLink[] {
  const found: FoundLink[] = [];

  // Определяем границу начала раздела «Связанные страницы» (последний H2 с этим заголовком)
  let relatedStart = -1;
  lines.forEach((l, idx) => {
    if (l.inCode) return;
    const match = /^##\s+(.+?)\s*$/.exec(l.text);
    if (match && match[1].trim() === RELATED_HEADING) {
      relatedStart = idx;
    }
  });

  lines.forEach((line, idx) => {
    if (line.inCode) return;
    for (const rawTarget of extractLinkTargets(line.text)) {
      if (isHttpLink(rawTarget)) continue;
      const target = stripAnchor(rawTarget);
      if (!target.toLowerCase().endsWith('.md')) continue;
      found.push({
        target,
        line: line.number,
        inRelated: relatedStart !== -1 && idx >= relatedStart,
      });
    }
  });

  return found;
}

/** Сообщение о нарушении на конкретной странице. */
interface PageReport {
  /** Путь страницы относительно DOCS_DIR */
  page: string;
  /** Список сообщений об ошибках (пустой, если страница корректна) */
  errors: string[];
}

/**
 * Выполняет проверки целостности перелинковки для одной страницы.
 * @param relPath - Путь страницы относительно DOCS_DIR
 * @returns Отчёт со списком ошибок
 */
function checkPage(relPath: string): PageReport {
  const errors: string[] = [];
  const absPath = join(DOCS_DIR, relPath);

  let content: string;
  try {
    content = readFileSync(absPath, 'utf8');
  } catch {
    return { page: relPath, errors: [`не удалось прочитать файл: ${absPath}`] };
  }

  const lines = toDocLines(content);
  const links = collectMdLinks(lines);

  // Каталог содержащего файла (в posix-нотации относительно DOCS_DIR)
  const pageDir = posix.dirname(relPath);

  // Проверка 1: каждая относительная .md-ссылка ведёт к существующему файлу
  for (const link of links) {
    // Разрешаем цель относительно каталога страницы
    const resolvedRel = posix.normalize(posix.join(pageDir, link.target));
    const resolvedAbs = join(DOCS_DIR, resolvedRel);
    if (!existsSync(resolvedAbs)) {
      errors.push(
        `битая ссылка (строка ${link.line}): ${relPath} -> ${link.target} ` +
          `(ожидался файл ${resolvedRel})`,
      );
    }
  }

  // Проверка 2: подстраница каталога ссылается хотя бы на одну другую
  // подстраницу того же каталога (bare-имя .md без `../`).
  const isSubpage = pageDir !== '.' && pageDir.length > 0;
  if (isSubpage) {
    const selfName = posix.basename(relPath);
    const hasSiblingLink = links.some((link) => {
      if (!link.inRelated) return false;
      // Ссылка на соседа — без префикса `../` и без вложенного каталога
      if (link.target.includes('/')) return false;
      if (link.target.startsWith('..')) return false;
      // Не ссылка на саму себя
      return link.target !== selfName;
    });
    if (!hasSiblingLink) {
      errors.push(
        `в разделе «${RELATED_HEADING}» нет ссылки на другую подстраницу каталога ` +
          `«${pageDir}/» (ожидается ссылка вида имя.md без «../»)`,
      );
    }
  }

  return { page: relPath, errors };
}

/**
 * Точка входа: проверяет все страницы и печатает отчёт.
 * @returns Код завершения процесса (0 — успех, 1 — есть нарушения)
 */
function main(): number {
  let failed = 0;
  const out: string[] = [];

  for (const page of PAGES) {
    const report = checkPage(page);
    if (report.errors.length === 0) {
      out.push(`✅ ${page}`);
    } else {
      failed += 1;
      out.push(`❌ ${page}`);
      for (const err of report.errors) {
        out.push(`     - ${err}`);
      }
    }
  }

  console.log('Property 6: Целостность перелинковки — проверка набора документации\n');
  console.log(out.join('\n'));
  console.log('');

  if (failed === 0) {
    console.log(`Итог: все ${PAGES.length} страниц прошли проверку перелинковки.`);
    return 0;
  }
  console.log(`Итог: проблемы на ${failed} из ${PAGES.length} страниц.`);
  return 1;
}

process.exit(main());
