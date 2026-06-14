/**
 * @fileoverview Сверочный сценарий «Property 7: Согласованность с обзором» для спецификации
 * interface-tabs-docs. Проверяет, что в таблице «Вкладки приложения» файла
 * `docs/interface/overview.md` каждая из девяти вкладок оформлена как относительная
 * markdown-ссылка на свою страницу, причём «Таблицы» ведёт на `tables/overview.md`,
 * а «Рассылки» — на `broadcasts/overview.md`. Дополнительно проверяет, что все целевые
 * файлы реально существуют под `docs/interface/`, и что из обзора удалено предупреждение
 * о том, что описания вкладок будут добавлены позже.
 *
 * Запуск: `npx tsx tools/interface-tabs-docs-checks/property-7-overview.ts`
 * Код возврата 0 — успех; ненулевой код и понятные сообщения — при нарушении.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4 (Correctness Property 7).
 * @module tools/interface-tabs-docs-checks/property-7-overview
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Абсолютный путь к каталогу текущего скрипта (для устойчивости к месту запуска). */
const scriptDir = dirname(fileURLToPath(import.meta.url));

/** Корень репозитория: на два уровня выше `tools/interface-tabs-docs-checks/`. */
const repoRoot = resolve(scriptDir, '..', '..');

/** Базовый каталог документации вкладок. */
const interfaceDir = join(repoRoot, 'docs', 'interface');

/** Путь к проверяемому файлу обзора интерфейса. */
const overviewPath = join(interfaceDir, 'overview.md');

/**
 * Ожидаемое соответствие «название вкладки → относительная ссылка на её страницу».
 * Порядок и состав соответствуют дизайну (девять вкладок, кроме «Редактора»).
 */
const expectedLinks: ReadonlyArray<{ tab: string; target: string }> = [
  { tab: 'Бот', target: 'bot.md' },
  { tab: 'Терминал', target: 'terminal.md' },
  { tab: 'Пользователи', target: 'users.md' },
  { tab: 'Диалоги', target: 'dialogs.md' },
  { tab: 'Рассылки', target: 'broadcasts/overview.md' },
  { tab: 'Аналитика', target: 'analytics.md' },
  { tab: 'Таблицы', target: 'tables/overview.md' },
  { tab: 'Файлы', target: 'files.md' },
  { tab: 'Код', target: 'code.md' },
];

/**
 * Регулярные выражения, выявляющие предупреждение о том, что описания вкладок
 * будут добавлены позже. Регистронезависимы; покрывают типовые формулировки.
 */
const removedWarningPatterns: ReadonlyArray<RegExp> = [
  /будут\s+добавлены\s+позже/i,
  /будет\s+добавлено\s+позже/i,
  /описани[ея][^\n]{0,60}поздн/i,
];

/** Накопитель сообщений об обнаруженных проблемах. */
const problems: string[] = [];

/**
 * Находит в тексте markdown-ссылку для конкретной вкладки.
 * Ищет фрагмент вида `[<tab>](<target>)` в любом месте файла (таблица — это
 * обычный markdown). Возвращает фактический путь ссылки или `null`, если ссылки нет.
 * @param text - Полный текст overview.md
 * @param tab - Название вкладки (текст ссылки)
 * @returns Найденный относительный путь ссылки либо `null`
 */
function findLinkTarget(text: string, tab: string): string | null {
  // Экранируем спецсимволы названия вкладки для безопасной подстановки в regex.
  const escapedTab = tab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linkRegex = new RegExp(`\\[\\s*${escapedTab}\\s*\\]\\(([^)]+)\\)`);
  const match = text.match(linkRegex);
  return match ? match[1].trim() : null;
}

/**
 * Проверка 1 и 2: каждая вкладка оформлена ссылкой на верный целевой файл,
 * и этот файл существует под `docs/interface/`.
 */
function checkTabLinks(text: string): void {
  for (const { tab, target } of expectedLinks) {
    const actual = findLinkTarget(text, tab);
    if (actual === null) {
      problems.push(`Вкладка «${tab}»: в overview.md не найдена относительная ссылка [${tab}](...)`);
      continue;
    }
    if (actual !== target) {
      problems.push(
        `Вкладка «${tab}»: ссылка ведёт на «${actual}», ожидалось «${target}»`,
      );
      continue;
    }
    // Целевой путь разрешается относительно каталога overview.md (docs/interface/).
    const absoluteTarget = resolve(interfaceDir, actual);
    if (!existsSync(absoluteTarget)) {
      problems.push(
        `Вкладка «${tab}»: целевой файл не существует — docs/interface/${actual}`,
      );
    }
  }
}

/**
 * Проверка 3: из обзора удалено предупреждение об отсутствии описаний вкладок.
 * @param text - Полный текст overview.md
 */
function checkWarningRemoved(text: string): void {
  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const pattern of removedWarningPatterns) {
      if (pattern.test(line)) {
        problems.push(
          `Предупреждение об отсутствии описаний не удалено (строка ${idx + 1}): ${line.trim()}`,
        );
      }
    }
  });
}

/**
 * Точка входа сценария: выполняет все проверки и завершает процесс с нужным кодом.
 */
function main(): void {
  if (!existsSync(overviewPath)) {
    console.error(`❌ Property 7 не пройдено: отсутствует файл docs/interface/overview.md`);
    process.exit(1);
  }

  const text = readFileSync(overviewPath, 'utf-8');
  checkTabLinks(text);
  checkWarningRemoved(text);

  if (problems.length === 0) {
    console.log(
      `✅ Property 7 пройдено: все ${expectedLinks.length} вкладок в таблице обзора ` +
        `оформлены как ссылки на существующие файлы; предупреждение об отсутствии описаний удалено.`,
    );
    process.exit(0);
  }

  console.error('❌ Property 7 (Согласованность с обзором) не пройдено. Обнаруженные проблемы:');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

main();
