/**
 * @fileoverview Агрегатор функций генерации Python импортов
 * Объединяет все функции генерации импортов в одну
 *
 * @module bot-generator/imports/generate-python-imports
 */

import { generateBaseImports } from './generate-base-imports';
import { generateCommandImports } from './generate-command-imports';
import { generateUrlImageImports, generateDatetimeImports, generateMediaGroupImports } from './generate-media-imports';
import { generateParseModeImports } from './generate-parse-mode-imports';
import { generateTelegramBadRequestImports } from './generate-exception-imports';

/** Параметры для генерации импортов */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: any[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** Есть ли inline кнопки */
  hasInlineButtons?: boolean;
}

/**
 * Генерирует все необходимые Python импорты для бота
 * @param options - Параметры генерации
 * @returns {string} Полный код импортов
 *
 * @example
 * generatePythonImports({ nodes: [...], userDatabaseEnabled: true })
 */
export const generatePythonImports = (
  options: ImportGeneratorOptions
): string => {
  let imports = '';

  // Базовые импорты - всегда генерируются
  imports += generateBaseImports({
    userDatabaseEnabled: options.userDatabaseEnabled,
    hasInlineButtons: options.hasInlineButtons
  });

  // Специфичные импорты на основе узлов
  imports += generateCommandImports(options);
  imports += generateUrlImageImports(options);
  imports += generateDatetimeImports(options);
  imports += generateMediaGroupImports(options);
  imports += generateParseModeImports(options);
  imports += generateTelegramBadRequestImports(options);

  // Модуль re требуется для функции replace_variables_in_text
  imports += 'import re\n';

  // Удаляем дубликаты импортов
  return removeDuplicateImports(imports);
};

/**
 * Удаляет дублирующиеся импорты из сгенерированного кода
 * @param {string} code - Код с импортами
 * @returns {string} Код без дубликатов
 */
function removeDuplicateImports(code: string): string {
  const lines = code.split('\n');
  const seenImports = new Set<string>();
  const uniqueLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Проверяем только строки с импортами
    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      if (!seenImports.has(trimmed)) {
        seenImports.add(trimmed);
        uniqueLines.push(line);
      }
    } else {
      uniqueLines.push(line);
    }
  }

  return uniqueLines.join('\n');
}
