/**
 * @fileoverview Генерация начала callback обработчика
 *
 * Модуль создаёт Python-код для начала функции обработчика
 * callback-запросов с безопасным получением данных.
 *
 * @module bot-generator/transitions/callback-handler/generate-callback-handler-start
 */

/**
 * Генерирует Python-код для начала callback обработчика
 *
 * @param nodeId - ID узла для генерации обработчика
 * @param shortNodeIdForDone - Короткий ID для кнопки "Готово"
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateCallbackHandlerStart(
  nodeId: string,
  shortNodeIdForDone: string,
  indent: string = '  '
): string {
  const safeFunctionName = String(nodeId).replace(/[^a-zA-Z0-9_]/g, '_');

  let code = '';
  code += `\n${indent}@dp.callback_query(lambda c: c.data == "${nodeId}" or c.data.startsWith("${nodeId}_btn_") or c.data == "done_${shortNodeIdForDone}")\n`;
  code += `${indent}async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
  code += `${indent}    # Проверяем что это не fake callback (для автопереходов)\n`;
  code += `${indent}    if hasattr(callback_query, '_is_fake') and callback_query._is_fake:\n`;
  code += `${indent}        logging.debug(f"⚡ Fake callback для узла ${nodeId}, пропускаем декоратор")\n`;
  code += `${indent}    \n`;
  code += `${indent}    # Безопасное получение данных из callback_query\n`;
  code += `${indent}    callback_data = None  # Инициализируем переменную\n`;
  code += `${indent}    try:\n`;
  code += `${indent}        user_id = callback_query.from_user.id\n`;
  code += `${indent}        callback_data = callback_query.data\n`;
  code += `${indent}        logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
  code += `${indent}    except Exception as e:\n`;
  code += `${indent}        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_${safeFunctionName}: {e}")\n`;
  code += `${indent}        return\n`;

  return code;
}
