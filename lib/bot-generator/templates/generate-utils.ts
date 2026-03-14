/**
 * @fileoverview Генерация утилит через шаблоны
 * 
 * Использует Nunjucks шаблоны вместо конкатенации строк
 * 
 * @module bot-generator/templates/generate-utils
 */

import { renderPartialTemplate } from './template-renderer.js';

/**
 * Опции для генерации утилит
 */
export interface UtilsOptions {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
}

/**
 * Генерирует утилитарные функции (is_admin, check_auth, get_user_variables)
 * 
 * @param options - Опции генерации
 * @returns Строка с утилитами
 * 
 * @example
 * const utils = generateUtils({ userDatabaseEnabled: true });
 */
export function generateUtils(options: UtilsOptions = {}): string {
  return renderPartialTemplate('utils.py.jinja2', {
    userDatabaseEnabled: options.userDatabaseEnabled ?? false,
  });
}
