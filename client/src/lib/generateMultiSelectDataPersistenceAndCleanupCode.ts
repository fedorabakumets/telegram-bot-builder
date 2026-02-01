/**
 * Генерирует код сохранения данных множественного выбора и очистки состояния
 * Создает Python код для сохранения выбранных опций множественного выбора в базу данных
 * и очистки временных данных пользователя после завершения операции
 */
export function generateMultiSelectDataPersistenceAndCleanupCode(multiSelectNodes: any[], code: string) {
  multiSelectNodes.forEach((node: any) => {
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    code += `            if node_id == "${node.id}":\n`;
    code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
  });

  code += '            # Резервное сохранение если узел не найден\n';
  code += '            if not any(node_id == node for node in [' + multiSelectNodes.map(n => `"${n.id}"`).join(', ') + ']):\n';
  code += '                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)\n';
  code += '        \n';
  code += '        # Очищаем состояние множественного выбора\n';
  code += '        if user_id in user_data:\n';
  code += '            user_data[user_id].pop(f"multi_select_{node_id}", None)\n';
  code += '            user_data[user_id].pop("multi_select_node", None)\n';
  code += '        \n';
  code += '        # Переходим к следующему узлу, если указан\n';

  return code;
}