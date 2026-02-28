/**
 * @fileoverview Генерация Python импортов для бота
 * Агрегирует функции генерации импортов
 */

import { generateCommandImports } from './generate-command-imports';
import { generateUrlImageImports, generateDatetimeImports } from './generate-media-imports';
import { generateParseModeImports } from './generate-parse-mode-imports';
import { generateTelegramBadRequestImports } from './generate-exception-imports';

/** Параметры для генерации импортов */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: any[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
}

/**
 * Генерирует все необходимые Python импорты для бота
 * @param options - Параметры генерации
 * @returns {string} Полный код импортов
 */
export const generatePythonImports = (
  options: ImportGeneratorOptions
): string => {
  let imports = '';

  imports += generateCommandImports(options);
  imports += generateUrlImageImports(options);
  imports += generateDatetimeImports(options);
  imports += generateParseModeImports(options);
  imports += generateTelegramBadRequestImports(options);

  // Модуль re требуется для функции replace_variables_in_text
  imports += 'import re\n';

  return imports;
};
