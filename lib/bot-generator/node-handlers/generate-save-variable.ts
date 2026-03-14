/**
 * @fileoverview Обработка узлов с действием save_variable
 * 
 * Модуль создаёт Python-код для сохранения переменных в user_data
 * и базу данных при нажатии на кнопку.
 * 
 * @module bot-generator/node-handlers/generate-save-variable
 */

/**
 * Генерирует Python-код для сохранения переменной
 * 
 * @param targetNode - Целевой узел с данными переменной
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateSaveVariableHandler(
  targetNode: any,
  indent: string = '    '
): string {
  const action = targetNode.data.action || 'none';
  const variableName = targetNode.data.variableName || '';
  const variableValue = targetNode.data.variableValue || '';
  const successMessage = targetNode.data.successMessage || 'Успешно сохранено!';

  if (action !== 'save_variable' || !variableName || !variableValue) {
    return '';
  }

  let code = '';
  code += `${indent}# Сохраняем переменную "${variableName}" = "${variableValue}"\n`;
  code += `${indent}user_data[user_id]["${variableName}"] = "${variableValue}"\n`;
  code += `${indent}await update_user_variable_in_db(user_id, "${variableName}", "${variableValue}")\n`;
  code += `${indent}logging.info(f"Переменная сохранена: ${variableName} = ${variableValue} (пользователь {user_id})")\n`;
  code += `${indent}\n`;

  // Форматируем сообщение об успехе
  if (successMessage.includes('\n')) {
    code += `${indent}success_text = """${successMessage}"""\n`;
  } else {
    const escapedMessage = successMessage.replace(/"/g, '\\"');
    code += `${indent}success_text = "${escapedMessage}"\n`;
  }

  // Добавляем замену переменных
  code += `${indent}# Подставляем значения переменных в текст сообщения\n`;
  code += `${indent}if "{${variableName}}" in success_text:\n`;
  code += `${indent}    success_text = success_text.replace("{${variableName}}", "${variableValue}")\n`;
  code += `${indent}await callback_query.message.edit_text(success_text)\n`;

  return code;
}
