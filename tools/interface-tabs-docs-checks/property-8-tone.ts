/**
 * @fileoverview Сверочный сценарий «Property 8: Пользовательский тон» для набора
 * документации по вкладкам конструктора (спека interface-tabs-docs).
 *
 * Скрипт опциональный и запускается через `tsx`. Он эвристически ищет в
 * пояснительном тексте страниц жаргон исходного кода: имена компонентов,
 * хуков, файлов исходников и внутренние идентификаторы. Такой текст не должен
 * встречаться в пользовательской документации (Requirements 6.1–6.4).
 *
 * Что проверяется (только вне огороженных блоков ``` и вне инлайн-кода в
 * обратных кавычках — содержимое кавычек разрешено как видимые пользователю
 * подписи вроде `project.json`, `file_id`, `{first_name}`):
 *   1. Идентификаторы в стиле camelCase/PascalCase — токены с внутренней
 *      сменой регистра (строчная сразу перед заглавной), например `BotControl`,
 *      `useTerminalFilter`, `CodePanel`, а также хуки вида `use[A-Z]...`.
 *   2. Расширения файлов исходного кода `.ts` / `.tsx` (и `.js` / `.jsx`),
 *      встретившиеся в прозе.
 *   3. Ссылки на пути исходников вроде `client/components/...`,
 *      `server/...`, `shared/...`, `lib/...` вне обратных кавычек.
 *
 * Легитимные видимые пользователю латинские подписи (Python, JSON, CSV, GIF,
 * Premium, Username, BotFather, Telegram, Dockerfile и т.п.) занесены в
 * allowlist, чтобы не давать ложных срабатываний.
 *
 * Скрипт печатает каждое подозрение в формате `страница:строка` для ручной
 * проверки человеком. Код возврата 0 — нарушений нет (после allowlist),
 * ненулевой — есть подозрения.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4 (Correctness Property 8).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

/** Корень репозитория относительно расположения скрипта (tools/<dir>/file.ts). */
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
/** Базовый каталог проверяемых страниц. */
const DOCS_DIR = join(REPO_ROOT, 'docs', 'interface');

/** Полный набор из 14 страниц набора (относительно DOCS_DIR). */
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
 * Разрешённые видимые пользователю латинские подписи (в нижнем регистре).
 * Это названия продуктов, форматов и пользовательских меток, которые
 * легитимно встречаются в русской прозе как подписи элементов интерфейса.
 */
const ALLOWLIST = new Set<string>([
  // продукты и сервисы
  'telegram', 'botfather', 'userinfobot', 'github', 'wikinest',
  // языки и форматы
  'python', 'json', 'csv', 'gif', 'pdf', 'txt', 'html', 'markdown',
  'javascript', 'typescript',
  // пользовательские метки/файлы как видимые подписи
  'premium', 'username', 'dockerfile', 'readme', 'requirements',
  'readme.md', 'requirements.txt', '.env', 'id',
]);

/**
 * Корни путей исходного кода, упоминание которых в прозе считается жаргоном.
 */
const SOURCE_ROOTS = ['client', 'server', 'shared', 'lib', 'tools', 'src'];

/** Одно подозрительное совпадение жаргона. */
interface Finding {
  /** Номер строки (с единицы) */
  line: number;
  /** Категория нарушения */
  kind: string;
  /** Найденный фрагмент */
  token: string;
  /** Текст строки целиком (для контекста) */
  text: string;
}

/**
 * Удаляет из строки содержимое инлайн-кода в обратных кавычках и цели
 * markdown-ссылок (URL), оставляя видимый пользователю текст. Заменяет
 * вырезанные участки пробелами, чтобы сохранить позиции остального текста.
 * @param text - Исходная строка прозы
 * @returns Строка без инлайн-кода и без URL ссылок
 */
function stripAllowedSpans(text: string): string {
  // Вырезать URL markdown-ссылок: ](...) -> ]   (пути и .md в ссылках легитимны)
  let result = text.replace(/\]\(([^)]*)\)/g, (m) => ']' + ' '.repeat(m.length - 1));
  // Вырезать инлайн-код в обратных кавычках
  result = result.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
  return result;
}

/**
 * Ищет в очищенной строке идентификаторы camelCase/PascalCase
 * (внутренняя смена «строчная → заглавная»), отфильтровывая allowlist.
 * @param clean - Очищенная строка
 * @param lineNo - Номер строки
 * @returns Список находок
 */
function findCamelCase(clean: string, lineNo: number, raw: string): Finding[] {
  const out: Finding[] = [];
  // Латинский токен, содержащий хотя бы один переход «строчная -> заглавная»
  const re = /\b[A-Za-z]*[a-z][A-Z][A-Za-z]*\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const token = m[0];
    if (ALLOWLIST.has(token.toLowerCase())) continue;
    const kind = /^use[A-Z]/.test(token) ? 'хук (use…)' : 'идентификатор camelCase/PascalCase';
    out.push({ line: lineNo, kind, token, text: raw.trim() });
  }
  return out;
}

/**
 * Ищет расширения файлов исходного кода (.ts/.tsx/.js/.jsx) в прозе.
 * @param clean - Очищенная строка
 * @param lineNo - Номер строки
 * @returns Список находок
 */
function findSourceExtensions(clean: string, lineNo: number, raw: string): Finding[] {
  const out: Finding[] = [];
  const re = /\b[\w-]+\.(tsx|ts|jsx|js)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const token = m[0];
    if (ALLOWLIST.has(token.toLowerCase())) continue;
    out.push({ line: lineNo, kind: 'расширение файла исходника', token, text: raw.trim() });
  }
  return out;
}

/**
 * Ищет ссылки на пути исходного кода вида `client/components/...`.
 * @param clean - Очищенная строка
 * @param lineNo - Номер строки
 * @returns Список находок
 */
function findSourcePaths(clean: string, lineNo: number, raw: string): Finding[] {
  const out: Finding[] = [];
  const re = new RegExp(`\\b(${SOURCE_ROOTS.join('|')})\\/[\\w.-]+(?:\\/[\\w.-]+)*`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    out.push({ line: lineNo, kind: 'путь исходного кода', token: m[0], text: raw.trim() });
  }
  return out;
}

/**
 * Проверяет одну страницу: разбивает на строки, пропускает огороженные блоки
 * кода и собирает все подозрения по трём категориям.
 * @param relPath - Путь страницы относительно DOCS_DIR
 * @returns Список находок (пустой, если страница чистая)
 */
function checkPage(relPath: string): Finding[] {
  const absPath = join(DOCS_DIR, relPath);
  const content = readFileSync(absPath, 'utf8');
  const rawLines = content.split(/\r?\n/);

  const findings: Finding[] = [];
  let insideFence = false;

  rawLines.forEach((raw, index) => {
    const lineNo = index + 1;
    if (/^\s*```/.test(raw)) {
      insideFence = !insideFence;
      return; // строка-ограничитель блока кода
    }
    if (insideFence) return; // содержимое блока кода — это код, пропускаем

    const clean = stripAllowedSpans(raw);
    findings.push(...findCamelCase(clean, lineNo, raw));
    findings.push(...findSourceExtensions(clean, lineNo, raw));
    findings.push(...findSourcePaths(clean, lineNo, raw));
  });

  return findings;
}

/**
 * Точка входа: проверяет все страницы и печатает отчёт с page:line.
 * @returns Код завершения процесса (0 — чисто, 1 — есть подозрения)
 */
function main(): number {
  console.log('Property 8: Пользовательский тон — поиск жаргона кода в прозе\n');

  let totalFindings = 0;
  let failedPages = 0;

  for (const page of PAGES) {
    let findings: Finding[];
    try {
      findings = checkPage(page);
    } catch {
      console.log(`❌ ${page}: не удалось прочитать файл`);
      failedPages += 1;
      continue;
    }

    if (findings.length === 0) {
      console.log(`✅ ${page}`);
      continue;
    }

    failedPages += 1;
    totalFindings += findings.length;
    console.log(`❌ ${page}`);
    for (const f of findings) {
      console.log(`     ${page}:${f.line}: [${f.kind}] «${f.token}»`);
      console.log(`        ↳ ${f.text}`);
    }
  }

  console.log('');
  if (totalFindings === 0) {
    console.log(`Итог: жаргон кода не найден на всех ${PAGES.length} страницах (с учётом allowlist).`);
    return 0;
  }
  console.log(
    `Итог: найдено ${totalFindings} подозрений на ${failedPages} из ${PAGES.length} страниц — требуется ручная проверка.`,
  );
  return 1;
}

process.exit(main());
