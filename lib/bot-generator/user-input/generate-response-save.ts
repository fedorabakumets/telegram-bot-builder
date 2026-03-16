/**
 * @fileoverview Генерация сохранения ответа пользователя
 *
 * Модуль создаёт Python-код для сохранения введённых данных
 * в базу данных (в соответствующую таблицу или user_data).
 *
 * @module bot-generator/user-input/generate-response-save
 */

import { renderPartialTemplate } from '../../templates/template-renderer';

/**
 * Генерирует Python-код для сохранения ответа
 *
 * @param variableName - Имя переменной
 * @param valueExpression - Python-выражение значения
 * @param appendMode - Режим добавления (boolean или Python-выражение)
 * @param indent - Отступ для форматирования кода
 * @returns Код сохранения ответа
 */
export function generateResponseSave(
  variableName: string,
  valueExpression: string,
  appendMode: boolean | string,
  indent: string = '            '
): string {
  const appendExpr = typeof appendMode === 'boolean'
    ? (appendMode ? 'True' : 'False')
    : appendMode;

  const effectiveAppendMode = appendExpr === 'True' || appendExpr === 'true';

  // Используем универсальную функцию для runtime определения таблицы
  return renderPartialTemplate('database/save-to-bot-users.py.jinja2', {
    variableName,
    valueExpression,
    appendMode: effectiveAppendMode,
    indentLevel: indent,
  });
}
