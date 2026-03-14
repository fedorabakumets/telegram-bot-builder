/**
 * @fileoverview Инициализация callback обработчика
 *
 * Модуль генерирует начальный код для обработки callback-запросов от inline кнопок,
 * включая ответ на callback и инициализацию переменных пользователя.
 *
 * @module bot-generator/transitions/callback-handler-init
 */

/**
 * Генерирует код инициализации callback обработчика
 *
 * @param nodeId - ID узла
 * @param shortNodeId - Короткая версия ID для функции
 * @param targetNode - Данные целевого узла
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateCallbackHandlerInit(
  _nodeId: string,
  _shortNodeId: string,
  targetNode: any,
  indent: string = '    '
): string {
  let code = '';

  // Начало обработчика
  code += `${indent}# Проверяем флаг hideAfterClick для кнопок\n`;
  code += `${indent}${generateHideAfterClickMiddleware(targetNode)}\n`;
  code += `${indent}\n`;

  // Ответ на callback
  code += `${indent}# Пытаемся ответить на callback (игнорируем ошибку если уже обработан)\n`;
  code += `${indent}try:\n`;
  code += `${indent}    await callback_query.answer()\n`;
  code += `${indent}except Exception:\n`;
  code += `${indent}    pass  # Игнорируем ошибку если callback уже был обработан\n`;
  code += `${indent}\n`;

  // Инициализация переменных
  code += `${indent}# Инициализируем базовые переменные пользователя\n`;
  code += `${indent}user_name = await init_user_variables(user_id, callback_query.from_user)\n`;
  
  // Сохраняем фильтры переменных из узла для replace_variables_in_text
  if (targetNode.data?.variableFilters && Object.keys(targetNode.data.variableFilters).length > 0) {
    code += `${indent}# Сохраняем фильтры переменных из узла\n`;
    code += `${indent}user_data[user_id]["_variable_filters"] = ${JSON.stringify(targetNode.data.variableFilters)}\n`;
  }

  return code;
}

/**
 * Генерирует middleware для скрытия кнопок после нажатия
 *
 * @param targetNode - Данные целевого узла
 * @returns Python-код для hideAfterClick
 */
function generateHideAfterClickMiddleware(targetNode: any): string {
  const buttons = targetNode.data?.buttons || [];
  const hasHideAfterClick = buttons.some((btn: any) => btn.hideAfterClick === true);

  if (!hasHideAfterClick) {
    return '';
  }

  return 'await callback_query.message.edit_reply_markup(reply_markup=None)';
}
