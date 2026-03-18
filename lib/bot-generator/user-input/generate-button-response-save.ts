/**
 * @fileoverview Генерация сохранения ответа кнопки в БД
 *
 * Модуль создаёт Python-код для сохранения выбранного
 * пользователем значения кнопки в базу данных.
 *
 * @module bot-generator/user-input/generate-button-response-save
 */

import { generateSaveToDatabaseTable } from '../../templates/database/save-to-database-table.renderer';

/**
 * Генерирует Python-код для сохранения ответа кнопки в БД
 *
 * @param indent - Отступ для форматирования кода
 * @returns Код сохранения в БД
 */
export function generateButtonResponseSave(
  indent: string = '            '
): string {
  const codeLines: string[] = [];
  
  codeLines.push(`${indent}# Сохраняем в базу данных если включено`);
  codeLines.push(`${indent}if config.get("save_to_database"):`);
  
  // Генерируем код сохранения с динамическим appendMode и динамическим variableName
  const saveCode = generateSaveToDatabaseTable({
    variableName: 'variable_name',  // Python-переменная, не строка
    valueExpression: 'response_data',
    appendExpression: 'config.get("appendVariable")',
    indent: indent + '    ',
    isVariableNameDynamic: true
  });
  codeLines.push(saveCode);
  codeLines.push('');  // Добавляем пустую строку после saveCode

  codeLines.push(`${indent}    logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")`);
  
  return codeLines.join('\n');
}
