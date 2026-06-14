/**
 * @fileoverview Сверочный сценарий (Property 2): сохранность страниц вкладки «Редактор».
 *
 * Проверяет, что множество файлов, созданных или изменённых функцией
 * `interface-tabs-docs`, не пересекается со страницами вкладки «Редактор»
 * (`docs/interface/editor.md` и каталог `docs/interface/editor/`).
 * Файл `docs/interface/overview.md` — разрешённое исключение (он намеренно
 * обновляется этой функцией).
 *
 * Подход: получить набор изменённых файлов через git (`git status --porcelain`
 * и при наличии базы — `git diff --name-only <base>...HEAD`), оставить только
 * пути под `docs/interface/` и убедиться, что среди них нет страниц «Редактора».
 *
 * Запуск: `npx tsx tools/interface-tabs-docs-checks/property-2-editor-preserved.ts`
 * Необязательный аргумент — git-база для diff (например, `origin/main`).
 *
 * Validates: Requirements 1.4 (Property 2).
 */
import { execFileSync } from 'node:child_process';

/** Префикс каталога документации интерфейса, относительно корня репозитория. */
const INTERFACE_PREFIX = 'docs/interface/';
/** Страница вкладки «Редактор» (одиночный файл). */
const EDITOR_PAGE = 'docs/interface/editor.md';
/** Каталог подстраниц вкладки «Редактор». */
const EDITOR_DIR_PREFIX = 'docs/interface/editor/';
/** Разрешённое исключение — обзорная страница, которую функция обновляет намеренно. */
const ALLOWED_EXCEPTION = 'docs/interface/overview.md';

/**
 * Выполнить git-команду и вернуть stdout как строку (пустую при ошибке).
 * @param args - Аргументы git-команды
 * @returns Текст вывода команды или пустая строка
 */
function runGit(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf8' });
  } catch {
    return '';
  }
}

/**
 * Нормализовать путь из git к виду со слешами `/` без кавычек и статуса.
 * @param raw - Сырой путь из вывода git
 * @returns Нормализованный относительный путь
 */
function normalize(raw: string): string {
  let p = raw.trim();
  // git может заключать пути с не-ASCII символами в кавычки
  if (p.startsWith('"') && p.endsWith('"')) {
    p = p.slice(1, -1);
  }
  return p.replace(/\\/g, '/');
}

/**
 * Собрать множество созданных/изменённых файлов из git.
 * Учитывает рабочую копию (`status --porcelain`) и, если задана база,
 * диапазон коммитов (`diff --name-only base...HEAD`).
 * @param base - Необязательная git-база для diff
 * @returns Множество относительных путей изменённых файлов
 */
function collectChangedFiles(base?: string): Set<string> {
  const files = new Set<string>();

  // 1) Рабочая копия: staged + unstaged + untracked
  const status = runGit(['status', '--porcelain', '--untracked-files=all']);
  for (const line of status.split('\n')) {
    if (!line.trim()) continue;
    // Формат: XY <path> либо XY <old> -> <new> при переименовании
    const rest = line.slice(3);
    const arrow = rest.indexOf(' -> ');
    if (arrow !== -1) {
      files.add(normalize(rest.slice(0, arrow)));
      files.add(normalize(rest.slice(arrow + 4)));
    } else {
      files.add(normalize(rest));
    }
  }

  // 2) Диапазон коммитов относительно базы (если указана и доступна)
  if (base) {
    const diff = runGit(['diff', '--name-only', `${base}...HEAD`]);
    for (const line of diff.split('\n')) {
      if (line.trim()) files.add(normalize(line));
    }
  }

  return files;
}

/**
 * Определить, относится ли путь к страницам вкладки «Редактор».
 * @param file - Нормализованный относительный путь
 * @returns true, если файл является страницей «Редактора»
 */
function isEditorPage(file: string): boolean {
  return file === EDITOR_PAGE || file.startsWith(EDITOR_DIR_PREFIX);
}

/**
 * Точка входа: запускает проверку и завершает процесс кодом 0/1.
 */
function main(): void {
  const base = process.argv[2];
  const changed = collectChangedFiles(base);

  const interfaceChanges = [...changed].filter((f) => f.startsWith(INTERFACE_PREFIX));
  const violations = interfaceChanges
    .filter((f) => f !== ALLOWED_EXCEPTION)
    .filter(isEditorPage);

  console.log('Property 2 — Сохранность страниц «Редактора»');
  console.log(`  База diff: ${base ?? '(не задана, проверяется только рабочая копия)'}`);
  console.log(`  Изменённых файлов под ${INTERFACE_PREFIX}: ${interfaceChanges.length}`);
  for (const f of interfaceChanges) {
    console.log(`    - ${f}${f === ALLOWED_EXCEPTION ? '  (разрешённое исключение)' : ''}`);
  }

  if (violations.length > 0) {
    console.error('\n❌ НАРУШЕНИЕ: затронуты страницы вкладки «Редактор»:');
    for (const f of violations) console.error(`    - ${f}`);
    console.error('\nФункция interface-tabs-docs не должна изменять editor.md или каталог editor/.');
    process.exit(1);
  }

  console.log('\n✅ OK: страницы вкладки «Редактор» не затронуты.');
  process.exit(0);
}

main();
