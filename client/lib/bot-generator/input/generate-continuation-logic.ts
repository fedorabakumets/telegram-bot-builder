/**
 * @fileoverview Логика продолжения для кнопочного ввода
 * Функция генерации кода для обработки переходов после ввода через кнопки
 */

/**
 * Генерирует Python-код для логики продолжения обработки пользовательского ввода через кнопки
 * @param nodes - Массив узлов бота
 * @param formatTextFn - Функция форматирования текста
 * @param generateVarReplaceFn - Функция замены переменных
 * @param generateInlineKbFn - Функция генерации inline клавиатур
 * @param allNodeIds - Все идентификаторы узлов
 * @param generateNodeNavFn - Функция генерации навигации
 * @returns {string} Python код логики продолжения
 */
export const generateContinuationLogicForButtonBasedInput = (
  nodes: any[],
  formatTextFn: Function,
  generateVarReplaceFn: Function,
  generateInlineKbFn: Function,
  allNodeIds: string[],
  generateNodeNavFn: Function
): string => {
  let code = '';
  
  nodes.forEach((targetNode) => {
    code += `            if input_target_node_id == "${targetNode.id}":\n`;
    if (targetNode.type === 'message') {
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextFn(messageText);
      code += `                # Переход к узлу ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;

      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      const universalVarCodeLines: string[] = [];
      generateVarReplaceFn(universalVarCodeLines, '                ');
      code += universalVarCodeLines.join('\n');

      // Отправляем сообщение с кнопками если есть
      if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKbFn(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"🔄 Переход к узлу ${targetNode.id} выполнен")\n`;
    } else if (targetNode.data.allowMultipleSelection) {
      // Для узлов с множественным выбором создаем прямую навигацию
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextFn(messageText);
      code += `                # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;

      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      const universalVarCodeLines: string[] = [];
      generateVarReplaceFn(universalVarCodeLines, '                ');
      code += universalVarCodeLines.join('\n');

      // Инициализируем состояние множественного выбора
      code += `                # Инициализируем состояние множественного выбора\n`;
      code += `                user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
      code += `                user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
      code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
      if (targetNode.data.multiSelectVariable) {
        code += `                user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
      }

      // Создаем inline клавиатуру с кнопками выбора
      if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKbFn(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
    } else {
      // Для обычных узлов отправляем простое сообщение
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextFn(messageText);
      code += `                # Обычный узел - отправляем сообщение ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;

      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      const universalVarCodeLines: string[] = [];
      generateVarReplaceFn(universalVarCodeLines, '                ');
      code += universalVarCodeLines.join('\n');

      if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKbFn(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"✅ Навигация к обычному узлу ${targetNode.id} выполнена")\n`;
    }
  });
  
  code += '            return\n';
  code += '        else:\n';
  code += '            # Это дополнительный комментарий (нет целевого узла)\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            response_data = user_text\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][f"{input_variable}_additional"] = response_data\n';
  code += '            \n';
  code += '            # Уведомляем пользователя\n';
  code += '            await message.answer("✅ Дополнительный комментарий сохранен!")\n';
  code += '            \n';
  code += '            logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Если нет активного ожидания ввода, игнорируем сообщение\n';
  code += '    return\n';

  const navigationCode = generateNodeNavFn(nodes, '            ', 'next_node_id', 'message', 'user_vars');
  return navigationCode;
};
