/**
 * Генерирует обработчик callback-запросов для множественного выбора
 * Создает Python функцию для обработки inline кнопок множественного выбора, включая кнопки "Готово"
 */
export function generateMultiSelectCallbackDispatcherHandle(
  multiSelectNodes: any[],
  code: string,
  generateMultiSelectDataPersistenceAndCleanupCode: (multiSelectNodes: any[], code: string) => string,
  generateTransitionLogicForMultiSelectCompletion: (
    multiSelectNodes: any[],
    nodes: any[],
    connections: any[],
    allNodeIds: string[],
    isLoggingEnabled: () => boolean,
    generateInlineKeyboardCode: (buttons: any[], prefix: string, nodeId: string, nodeData: any, allNodeIds: string[]) => string,
    code: string
  ) => string
) {
  if (multiSelectNodes.length > 0) {
    code += '\n# Обработчики для множественного выбора\n';

    // Обработчик для inline кнопок множественного выбора
    code += '@dp.callback_query(lambda c: c.data.startswith("ms_") or c.data.startswith("multi_select_"))\n';
    code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
    code += '    await callback_query.answer()\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
    code += '    \n';
    code += '    callback_data = callback_query.data\n';
    code += '    \n';
    code += '    # Обработка кнопки "Готово"\n';
    code += '    if callback_data.startswith("done_"):\n';
    code += '        # Завершение множественного выбора (новый формат)\n';
    code += '        logging.info(f"🏁 Обработка кнопки Готово: {callback_data}")\n';
    code += '        short_node_id = callback_data.replace("done_", "")\n';
    code += '        # Находим полный node_id по короткому суффиксу\n';
    code += '        node_id = None\n';
    multiSelectNodes.forEach((node: any) => {
      const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
      code += `        if short_node_id == "${shortNodeId}":\n`;
      code += `            node_id = "${node.id}"\n`;
      code += `            logging.info(f"✅ Найден узел: ${node.id}")\n`;
    });
    code += '    elif callback_data.startswith("multi_select_done_"):\n';
    code += '        # Завершение множественного выбора (старый формат)\n';
    code += '        node_id = callback_data.replace("multi_select_done_", "")\n';
    code += '        selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n';
    code += '        \n';
    code += '        # Сохраняем выбранные опции в базу данных\n';
    code += '        if selected_options:\n';
    code += '            selected_text = ", ".join(selected_options)\n';

    // Генерируем сохранение для каждого узла с его переменной
    code = generateMultiSelectDataPersistenceAndCleanupCode(multiSelectNodes, code);

    // Добавим переходы для узлов с множественным выбором
    code = generateTransitionLogicForMultiSelectCompletion(
      multiSelectNodes,
      [],
      [],
      [],
      () => false,
      () => '',
      code
    );
  }
  
  return code;
}