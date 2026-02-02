import { Node, Button } from '@shared/schema';

/**
 * Генерирует код для обработки флага hideAfterClick (скрытие сообщения после нажатия кнопки)
 * 
 * @param node - узел, содержащий кнопки
 * @returns строка с Python-кодом для обработки флага hideAfterClick
 */
export function generateHideAfterClickHandler(node: Node): string {
  let code = '';
  
  // Проверяем, есть ли у узла кнопки с флагом hideAfterClick
  if (node.data.buttons && Array.isArray(node.data.buttons)) {
    const hideAfterClickButtons = node.data.buttons.filter((button: Button) => button.hideAfterClick === true);
    
    if (hideAfterClickButtons.length > 0) {
      // Добавляем обработку для каждой кнопки с флагом hideAfterClick
      hideAfterClickButtons.forEach((button: Button) => {
        code += `    # Обработка флага hideAfterClick для кнопки "${button.text}"\n`;
        code += `    if callback_query and callback_query.message and callback_data == "${button.id || button.target || 'unknown'}":\n`;
        code += `        try:\n`;
        code += `            # Удаляем сообщение, в котором была нажата кнопка\n`;
        code += `            await bot.delete_message(chat_id=callback_query.message.chat.id, message_id=callback_query.message.message_id)\n`;
        code += `            logging.info(f"🗑️ Сообщение удалено после нажатия кнопки с флагом hideAfterClick: {button.text}")\n`;
        code += `        except Exception as e:\n`;
        code += `            logging.warning(f"⚠️ Не удалось удалить сообщение после нажатия кнопки: {e}")\n`;
        code += `            # Если не удалось удалить сообщение, просто отвечаем на callback\n`;
        code += `            try:\n`;
        code += `                await callback_query.answer()\n`;
        code += `            except:\n`;
        code += `                pass\n`;
        code += `        return  # Прерываем дальнейшую обработку, так как сообщение уже удалено\n`;
        code += '\n';
      });
    }
  }
  
  return code;
}

/**
 * Генерирует общий обработчик для всех кнопок с флагом hideAfterClick в callback-обработчике
 *
 * @param node - узел, содержащий кнопки
 * @returns строка с Python-кодом для проверки и обработки флага hideAfterClick
 */
export function generateHideAfterClickMiddleware(node: Node): string {
  let code = '';

  // Проверяем, есть ли у узла кнопки с флагом hideAfterClick
  if (node.data.buttons && Array.isArray(node.data.buttons)) {
    const hideAfterClickButtons = node.data.buttons.filter((button: Button) => button.hideAfterClick === true);

    if (hideAfterClickButtons.length > 0) {
      code += '    # Проверяем, содержит ли callback_data кнопку с флагом hideAfterClick\n';

      // Создаем список возможных callback_data для кнопок с флагом hideAfterClick
      const hideAfterClickCallbackData: string[] = [];
      hideAfterClickButtons.forEach((button: Button) => {
        // Добавляем ID кнопки, если он есть
        if (button.id) {
          hideAfterClickCallbackData.push(button.id);
        }
        // Добавляем target, если он есть (для кнопок с action='goto')
        if (button.target) {
          hideAfterClickCallbackData.push(button.target);
        }
        // Также добавляем формат callback_data для кнопок с action='goto' в формате nodeId_btn_index
        // Но для этого нам нужно знать индекс кнопки, что сложно сделать в этом месте
      });

      if (hideAfterClickCallbackData.length > 0) {
        code += '    hide_after_click_buttons = [' + hideAfterClickCallbackData.map(id => `"${id}"`).join(', ') + ']\n';
        code += '    \n';
        code += '    # Проверяем, совпадает ли callback_data с одной из кнопок с флагом hideAfterClick\n';
        code += '    if callback_data in hide_after_click_buttons:\n';
        code += '        try:\n';
        code += '            # Удаляем сообщение, в котором была нажата кнопка\n';
        code += '            await bot.delete_message(chat_id=callback_query.message.chat.id, message_id=callback_query.message.message_id)\n';
        code += '            logging.info(f"🗑️ Сообщение удалено после нажатия кнопки с флагом hideAfterClick: {callback_data}")\n';
        code += '        except Exception as e:\n';
        code += '            logging.warning(f"⚠️ Не удалось удалить сообщение после нажатия кнопки: {e}")\n';
        code += '            # Если не удалось удалить сообщение, просто отвечаем на callback\n';
        code += '            try:\n';
        code += '                await callback_query.answer()\n';
        code += '            except:\n';
        code += '                pass\n';
        code += '        return  # Прерываем дальнейшую обработку, так как сообщение уже удалено\n';
        code += '    \n';

        // Также проверяем формат callback_data вида nodeId_btn_index для кнопок с флагом hideAfterClick
        const hideAfterClickButtonIds = hideAfterClickButtons.map((button: Button) => button.id).filter(Boolean);
        if (hideAfterClickButtonIds.length > 0) {
          code += '    # Проверяем формат callback_data вида nodeId_btn_index для кнопок с флагом hideAfterClick\n';
          code += '    # Извлекаем индекс кнопки из callback_data и проверяем, соответствует ли она hideAfterClick кнопке\n';
          code += '    if "_" in callback_data:\n';
          code += '        parts = callback_data.split("_btn_")\n';
          code += '        if len(parts) == 2:\n';
          code += '            node_part, index_part = parts\n';
          code += '            # Проверяем, является ли node_part одним из ID кнопок с флагом hideAfterClick\n';

          hideAfterClickButtonIds.forEach((buttonId: string, index: number) => {
            if (index === 0) {
              code += `            if node_part == "${buttonId}":\n`;
            } else {
              code += `            elif node_part == "${buttonId}":\n`;
            }
            code += '                try:\n';
            code += '                    # Удаляем сообщение, в котором была нажата кнопка\n';
            code += '                    await bot.delete_message(chat_id=callback_query.message.chat.id, message_id=callback_query.message.message_id)\n';
            code += '                    logging.info(f"🗑️ Сообщение удалено после нажатия кнопки с флагом hideAfterClick: {callback_data}")\n';
            code += '                except Exception as e:\n';
            code += '                    logging.warning(f"⚠️ Не удалось удалить сообщение после нажатия кнопки: {e}")\n';
            code += '                    try:\n';
            code += '                        await callback_query.answer()\n';
            code += '                    except:\n';
            code += '                        pass\n';
            code += '                return  # Прерываем дальнейшую обработку\n';
          });
          code += '    \n';
        }
      }
    }
  }

  return code;
}