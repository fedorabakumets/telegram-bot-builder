/**
 * @fileoverview Обработчики пользовательского ввода
 * Функции для генерации универсальных обработчиков ввода
 */

/**
 * Генерирует обработчики кнопочных ответов для сбора пользовательского ввода
 * @param nodes - Массив узлов бота
 * @param generateButtonResponseHandlers - Функция генерации обработчиков
 * @param code - Текущий Python код
 * @returns {string} Обновлённый Python код
 */
export const generateButtonResponseHandlersForInput = (
  nodes: any[],
  generateButtonResponseHandlers: Function,
  code: string
): string => {
  const userInputNodes = nodes.filter(
    (node) =>
      node.type === 'message' &&
      node.data.responseType === 'buttons' &&
      Array.isArray(node.data.responseOptions) &&
      node.data.responseOptions.length > 0
  );

  if (userInputNodes.length > 0) {
    code += '\n# Обработчики кнопочных ответов для сбора пользовательского ввода\n';
    code = generateButtonResponseHandlers(code, userInputNodes, nodes);
  }

  return code;
};

/**
 * Генерирует универсальный обработчик пользовательского ввода
 * @param nodes - Массив узлов бота
 * @param allNodeIds - Все идентификаторы узлов
 * @param generateAdHocHandler - Функция генерации ad-hoc обработчика
 * @param generateContinuationHandler - Функция генерации логики продолжения
 * @param generateValidationHandler - Функция генерации валидации
 * @param generateTransitionHandler - Функция генерации переходов
 * @returns {string} Python код обработчика
 */
export const generateUniversalUserInputHandler = (
  nodes: any[],
  allNodeIds: string[],
  generateAdHocHandler: Function,
  generateContinuationHandler: Function,
  generateValidationHandler: Function,
  generateTransitionHandler: Function
): string => {
  // Здесь будет генерация универсального обработчика
  // с использованием переданных функций
  return '';
};

/**
 * Генерирует ad-hoc обработчик для сбора пользовательского ввода
 * @returns {string} Python код обработчика
 */
export const generateAdHocInputHandler = (): string => {
  let code = '        \n';
  code += '        # Если узел не найден\n';
  code += '        logging.warning(f"Узел для сбора ввода не найден: {waiting_node_id}")\n';
  code += '        del user_data[user_id]["waiting_for_input"]\n';
  code += '        return\n';
  code += '    \n';
  code += '    # НОВАЯ ЛОГИКА: Проверяем, включен ли дополнительный сбор ответов\n';
  code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
  code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
  code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
  code += '        input_target_node_id = user_data[user_id].get("input_target_node_id")\n';
  code += '        user_text = message.text\n';
  return code;
};
