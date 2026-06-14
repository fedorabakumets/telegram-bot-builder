/**
 * @fileoverview Сверочный сценарий «Property 4: Заземлённость содержания» для набора
 * документации по вкладкам конструктора (spec interface-tabs-docs). Проверяет, что
 * ключевые эталонные факты (единый источник истины из design.md «Эталонные данные»)
 * присутствуют на соответствующих страницах документации в виде ожидаемых
 * пользовательских подписей. Скрипт опциональный: запускается через `tsx`, завершается
 * кодом 0 при успехе и кодом 1 при отсутствии любого факта, перечисляя пробелы.
 * @module tools/interface-tabs-docs-checks/property-4-grounding
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Абсолютный путь к каталогу этого скрипта */
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** Корень репозитория (на два уровня выше: tools/interface-tabs-docs-checks → repo) */
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');

/** Базовый каталог страниц документации интерфейса */
const DOCS_BASE = join(REPO_ROOT, 'docs', 'interface');

/**
 * Таблица ожиданий: путь страницы относительно `docs/interface/` → список
 * обязательных подстрок (видимых пользователю подписей/фактов), которые должны
 * присутствовать на странице согласно эталонным данным дизайна.
 */
const EXPECTATIONS: Record<string, string[]> = {
  // Статусы бота и подключение через @BotFather
  'bot.md': ['Активный', 'Готов', 'По умолчанию', '@BotFather'],

  // Фильтры строк терминала и форматы экспорта логов
  'terminal.md': ['Все', 'Вывод', 'Ошибки', 'Текст', 'JSON', 'CSV'],

  // Источники и типы медиа на вкладке «Файлы»
  'files.md': [
    'Входящие',
    'Исходящие',
    'Загруженные',
    'Фото',
    'Видео',
    'GIF',
    'Аудио',
    'Голосовое',
    'Кружок',
    'Документы',
    'Стикеры',
  ],

  // Форматы файлов на вкладке «Код»
  'code.md': [
    'Python код',
    'project.json',
    'Requirements.txt',
    'README.md',
    'Dockerfile',
    '.env',
  ],

  // Перечень системных таблиц (только для чтения)
  'tables/system-tables.md': [
    'Пользователи',
    'Переменные',
    'Сообщения',
    'Группы',
    'Медиафайлы',
    'Токены бота',
    'Рассылки',
    'Логи бота',
    'История запусков',
  ],

  // Цели экспорта таблиц
  'tables/import-export.md': ['Скачать CSV', 'Скачать JSON', 'Скопировать в буфер'],

  // Шаги мастера рассылки и персональные переменные
  'broadcasts/create.md': [
    'Аудитория',
    'Сообщение',
    'Подтверждение',
    '{first_name}',
    '{last_name}',
    '{username}',
    '{user_id}',
  ],

  // Режимы аналитики и типы графика
  'analytics.md': ['За период', 'Накопительно', 'Столбчатый', 'Линейный'],
};

/** Описание одного пробела: какая страница не содержит какого факта */
interface Gap {
  /** Относительный путь страницы */
  page: string;
  /** Отсутствующий факт (подпись/подстрока) */
  fact: string;
}

/**
 * Считывает содержимое страницы документации.
 * @param relativePath - путь страницы относительно `docs/interface/`
 * @returns содержимое файла как строка, либо null если файл недоступен
 */
function readPage(relativePath: string): string | null {
  try {
    return readFileSync(join(DOCS_BASE, relativePath), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Проверяет заземлённость содержания: для каждой страницы из таблицы ожиданий
 * убеждается, что все обязательные факты присутствуют в её тексте.
 * @returns список найденных пробелов (пустой, если всё на месте)
 */
function checkGrounding(): Gap[] {
  const gaps: Gap[] = [];

  for (const [page, facts] of Object.entries(EXPECTATIONS)) {
    const content = readPage(page);

    if (content === null) {
      // Отсутствие самого файла фиксируем как пробел по каждому ожидаемому факту
      gaps.push({ page, fact: '(страница не найдена)' });
      continue;
    }

    for (const fact of facts) {
      if (!content.includes(fact)) {
        gaps.push({ page, fact });
      }
    }
  }

  return gaps;
}

/**
 * Точка входа: запускает проверку, печатает результат и выставляет код выхода.
 */
function main(): void {
  const gaps = checkGrounding();
  const totalFacts = Object.values(EXPECTATIONS).reduce((sum, f) => sum + f.length, 0);

  if (gaps.length === 0) {
    console.log(
      `✅ Property 4 (Заземлённость содержания): все ${totalFacts} ключевых фактов ` +
        `подтверждены на ${Object.keys(EXPECTATIONS).length} страницах.`,
    );
    process.exit(0);
  }

  console.error('❌ Property 4 (Заземлённость содержания): обнаружены пробелы:\n');
  for (const { page, fact } of gaps) {
    console.error(`  • ${page} — отсутствует факт: «${fact}»`);
  }
  console.error(`\nИтого пробелов: ${gaps.length} из ${totalFacts} проверенных фактов.`);
  process.exit(1);
}

main();
