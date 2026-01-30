import { Node, Button } from '@shared/schema';

/**
 * Генерирует код для обработки флага hideAfterClick для reply-кнопок
 * 
 * @param nodes - массив всех узлов для поиска кнопок с флагом hideAfterClick
 * @returns строка с Python-кодом для проверки и обработки флага hideAfterClick у reply-кнопок
 */
export function generateReplyHideAfterClickHandler(nodes: Node[]): string {
  let code = '';

  // Собираем все reply-кнопки с флагом hideAfterClick из всех узлов
  const allHideAfterClickButtons: {text: string, nodeId: string}[] = [];

  nodes.forEach(node => {
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      const hideAfterClickButtons = node.data.buttons.filter((button: Button) =>
        button.hideAfterClick === true &&
        (button.text || button.id)
      );

      hideAfterClickButtons.forEach(button => {
        allHideAfterClickButtons.push({
          text: button.text || button.id,
          nodeId: node.id
        });
      });
    }
  });

  if (allHideAfterClickButtons.length > 0) {
    code += '    # Проверяем, является ли сообщение нажатием на reply-кнопку с флагом hideAfterClick\n';
    code += '    # Используем message.text напрямую, так как user_text может быть не определен в этом месте\n';
    code += '    message_text_lower = message.text.lower() if message.text else ""\n';
    code += '    \n';
    code += '    # Список текстов кнопок с флагом hideAfterClick\n';
    code += '    hide_after_click_texts = [' + allHideAfterClickButtons.map(btn =>
      `"${btn.text.toLowerCase()}"`
    ).join(', ') + ']\n';
    code += '    \n';
    code += '    if message_text_lower in hide_after_click_texts:\n';
    code += '        try:\n';
    code += '            # Удаляем сообщение пользователя, которое содержит нажатие на кнопку\n';
    code += '            await bot.delete_message(chat_id=message.chat.id, message_id=message.message_id)\n';
    code += '            logging.info(f"🗑️ Сообщение пользователя удалено после нажатия reply-кнопки с флагом hideAfterClick: {message.text}")\n';
    code += '        except Exception as e:\n';
    code += '            logging.warning(f"⚠️ Не удалось удалить сообщение пользователя с reply-кнопкой hideAfterClick: {e}")\n';
    code += '        return  # Прерываем дальнейшую обработку, так как сообщение уже удалено\n';
    code += '    \n';

    // Также добавим проверку для кнопок "Пропустить" и других стандартных кнопок с флагом hideAfterClick
    const skipButtons = allHideAfterClickButtons.filter(btn =>
      btn.text.toLowerCase().includes('пропуст') ||
      btn.text.toLowerCase().includes('skip') ||
      btn.text.toLowerCase().includes('cancel')
    );

    if (skipButtons.length > 0) {
      code += '    # Дополнительная проверка для специфических кнопок с флагом hideAfterClick\n';
      code += '    if any(skip_text in message_text_lower for skip_text in [' +
        skipButtons.map(btn => `"${btn.text.toLowerCase()}"`).join(', ') +
      ']):\n';
      code += '        try:\n';
      code += '            await bot.delete_message(chat_id=message.chat.id, message_id=message.message_id)\n';
      code += '            logging.info(f"🗑️ Сообщение пользователя удалено для кнопки skip с флагом hideAfterClick: {message.text}")\n';
      code += '        except Exception as e:\n';
      code += '            logging.warning(f"⚠️ Не удалось удалить сообщение для skip кнопки: {e}")\n';
      code += '        return\n';
      code += '    \n';
    }
  }

  return code;
}