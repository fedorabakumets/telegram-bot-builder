/**
 * @fileoverview Генерация конфигурации бота через шаблоны
 * 
 * Использует Nunjucks шаблоны вместо конкатенации строк
 * 
 * @module bot-generator/templates/generate-config
 */

import { renderPartialTemplate } from './template-renderer.js';

/**
 * Опции для генерации конфигурации
 */
export interface ConfigOptions {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** ID проекта */
  projectId?: number | null;
}

/**
 * Генерирует конфигурацию бота (токен, логирование, бот, диспетчер)
 * 
 * @param options - Опции генерации
 * @returns Строка с конфигурацией
 * 
 * @example
 * const config = generateConfig({ userDatabaseEnabled: true, projectId: 123 });
 */
export function generateConfig(options: ConfigOptions = {}): string {
  return renderPartialTemplate('config.py.jinja2', {
    userDatabaseEnabled: options.userDatabaseEnabled ?? false,
    projectId: options.projectId ?? null,
  });
}
