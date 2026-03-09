/**
 * @fileoverview Генерация навигации к узлу (goto)
 * 
 * Модуль создаёт Python-код для перехода к целевому узлу
 * через вызов handle_callback функции.
 * 
 * @module bot-generator/user-input/generate-goto-navigation
 */

/**
 * Генерирует Python-код для обработки goto действия
 * 
 * @param nodes - Массив узлов для генерации навигации
 * @param indent - Отступ для форматирования кода
 * @param targetVar - Имя переменной target_node_id или next_node_id
 * @returns Код обработки goto
 */
export function generateGotoNavigation(
  nodes: any[],
  indent: string = '                    ',
  targetVar: string = 'target_node_id'
): string {
  let code = '';
  
  if (nodes.length > 0) {
    nodes.forEach((btnNode, btnIndex) => {
      const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      const condition = btnIndex === 0 ? 'if' : 'elif';
      const targetExists = nodes.some(n => n.id === btnNode.id);
      
      code += `${indent}${condition} ${targetVar} == "${btnNode.id}":\n`;
      
      if (targetExists) {
        code += `${indent}    await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=${targetVar}, message=message))\n`;
      } else {
        code += `${indent}    logging.warning(f"⚠️ Целевой узел не найден: {btnNode.id}, завершаем переход")\n`;
        code += `${indent}    await message.answer("Переход завершен")\n`;
      }
    });
    
    code += `${indent}else:\n`;
    code += `${indent}    logging.warning(f"Неизвестный целевой узел: {${targetVar}}")\n`;
  } else {
    code += `${indent}pass  # No nodes to handle\n`;
  }
  
  return code;
}
