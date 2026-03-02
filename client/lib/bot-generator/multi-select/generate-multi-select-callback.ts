/**
 * @fileoverview Обработчики множественного выбора
 * Функции для генерации callback-обработчиков multi-select кнопок
 */

import { Node } from '@shared/schema';

/**
 * Генерирует обработчик callback-запросов для множественного выбора
 * @param multiSelectNodes - Узлы с множественным выбором
 * @param nodes - Все узлы бота
 * @param allNodeIds - Все идентификаторы узлов
 * @param isLoggingEnabled - Флаг включения логирования
 * @param generateTransitionLogic - Функция генерации логики переходов
 * @param generateInlineKeyboardCode - Функция генерации inline клавиатур
 * @param formatTextForPython - Функция форматирования текста
 * @returns {string} Python код обработчика
 */
export const generateMultiSelectCallbackHandler = (
  multiSelectNodes: Node[],
  nodes: any[],
  allNodeIds: string[],
  isLoggingEnabled: boolean,
  generateTransitionLogic: Function,
  generateInlineKeyboardCode: Function,
  formatTextForPython: Function
): string => {
  if (multiSelectNodes.length === 0) {
    return '';
  }

  let code = '\n# Обработчики для множественного выбора\n';
  code += '@dp.callback_query(lambda c: c.data.startswith("ms_") or c.data.startswith("multi_select_"))\n';
  code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
  code += '    await callback_query.answer()\n';
  code += '    user_id = callback_query.from_user.id\n';
  code += '    # Инициализируем базовые переменные пользователя\n';
  code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
  code += '    \n';
  code += '    callback_data = callback_query.data  # Получаем данные callback\n';
  code += '    \n';
  code += '    # Обработка кнопки "Готово"\n';
  code += '    if callback_data.startswith("done_"):\n';
  code += '        # Завершение множественного выбора (новый формат)\n';
  code += '        logging.info(f"✅ Обработка кнопки Готово: {callback_data}")\n';
  code += '        short_node_id = callback_data.replace("done_", "")\n';
  code += '        # Находим полный node_id по короткому суффиксу\n';
  code += '        node_id = None\n';
  
  multiSelectNodes.forEach((node: Node) => {
    const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
    code += `        if short_node_id == "${shortNodeId}":\n`;
    code += `            node_id = "${node.id}"\n`;
    code += `            logging.info(f"🎯 Найден узел: ${node.id}")\n`;
  });
  
  code += '    elif callback_data.startswith("multi_select_done_"):\n';
  code += '        # Завершение множественного выбора (старый формат)\n';
  code += '        node_id = callback_data.replace("multi_select_done_", "")\n';
  code += '        selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n';
  code += '        \n';
  code += '        # Сохраняем выбранные опции в базу данных\n';
  code += '        if selected_options:\n';
  code += '            selected_text = ", ".join(selected_options)\n';

  // Генерируем сохранение для каждого узла
  code += generateMultiSelectPersistence(multiSelectNodes);
  code += generateMultiSelectCleanup();
  code += '        # Переходим к следующему узлу, если указан\n';

  // Добавляем переходы для узлов с множественным выбором
  code = generateTransitionLogic(
    code,
    multiSelectNodes,
    nodes,
    [],
    allNodeIds,
    isLoggingEnabled,
    generateInlineKeyboardCode,
    formatTextForPython
  );

  return code;
};

/**
 * Генерирует код сохранения данных множественного выбора
 * @param multiSelectNodes - Узлы с множественным выбором
 * @returns {string} Python код сохранения
 */
export const generateMultiSelectPersistence = (multiSelectNodes: Node[]): string => {
  let code = '';
  
  multiSelectNodes.forEach((node: Node) => {
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    code += `            if node_id == "${node.id}":\n`;
    code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
  });

  code += '            # Резервное сохранение если узел не найден\n';
  const nodeIds = multiSelectNodes.map(n => `"${n.id}"`).join(', ');
  code += `            if not any(node_id == node for node in [${nodeIds}]):\n`;
  code += '                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)\n';
  
  return code;
};

/**
 * Генерирует код очистки состояния множественного выбора
 * @returns {string} Python код очистки
 */
export const generateMultiSelectCleanup = (): string => {
  let code = '        \n';
  code += '        # Очищаем состояние множественного выбора\n';
  code += '        if user_id in user_data:\n';
  code += '            user_data[user_id].pop(f"multi_select_{node_id}", None)\n';
  code += '            user_data[user_id].pop("multi_select_node", None)\n';
  return code;
};
