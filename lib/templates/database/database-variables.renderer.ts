/**
 * @fileoverview Renderer для получения переменных из таблиц БД
 * Вычисляет какие таблицы нужны и передаёт в Jinja2 шаблон
 * @module templates/database/database-variables.renderer
 */

import { SYSTEM_VARIABLE_SOURCES } from '@shared/system-variables-config';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python код для получения переменных из таблиц БД
 * @param indent - Отступ для кода
 * @param usedVariables - Список используемых переменных (опционально, undefined = все)
 * @param botRuntimeRole - Сессию Telegram брать из USERBOT_* этого токена
 * @returns Сгенерированный Python код
 */
export function generateDatabaseVariablesCode(
  indent: string = '        ',
  usedVariables?: string[],
  botRuntimeRole = false,
): string {
  const sources = SYSTEM_VARIABLE_SOURCES.map(source => {
    const tableVariables = source.fields.map(f => f.variableName);
    const needed = !usedVariables || usedVariables.some(v => tableVariables.includes(v));
    return { ...source, needed };
  });

  return renderPartialTemplate('database/database-variables.py.jinja2', { indent, sources, botRuntimeRole });
}
