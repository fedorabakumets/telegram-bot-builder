/**
 * @fileoverview Генерация проверки skipDataCollection
 * 
 * Модуль создаёт Python-код для проверки перехода через кнопку
 * skipDataCollection и сохранения/пропуска переменной.
 * 
 * @module bot-generator/transitions/skip-data-collection/generate-skip-data-collection-check
 */

/**
 * Генерирует Python-код для проверки skipDataCollection
 * 
 * @param variableName - Имя переменной для сохранения
 * @param variableValue - Значение переменной
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateSkipDataCollectionCheck(
  variableName: string,
  variableValue: string,
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}# Проверяем, был ли переход через кнопку с skipDataCollection\n`;
  code += `${indent}skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)\n`;
  code += `${indent}if not skip_transition_flag:\n`;
  code += `${indent}    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
  code += `${indent}    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
  code += `${indent}else:\n`;
  code += `${indent}    # Сбрасываем флаг\n`;
  code += `${indent}    if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:\n`;
  code += `${indent}        del user_data[user_id]["skipDataCollectionTransition"]\n`;
  code += `${indent}    logging.info(f"Переход через skipDataCollection, переменная ${variableName} не сохраняется (пользователь {user_id})")\n`;
  
  return code;
}
