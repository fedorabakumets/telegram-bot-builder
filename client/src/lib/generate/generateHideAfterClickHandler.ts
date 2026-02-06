import { Node, Button } from '@shared/schema';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует код для обработки флага hideAfterClick (скрытие сообщения после нажатия кнопки)
 *
 * @param node - узел, содержащий кнопки
 * @returns строка с Python-кодом для обработки флага hideAfterClick
 */
export function generateHideAfterClickHandler(node: Node): string {
  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];
  
  // Проверяем, есть ли у узла кнопки с флагом hideAfterClick
  if (node.data.buttons && Array.isArray(node.data.buttons)) {
    const hideAfterClickButtons = node.data.buttons.filter((button: Button) => button.hideAfterClick === true);
    
    if (hideAfterClickButtons.length > 0) {
      // Добавляем обработку для каждой кнопки с флагом hideAfterClick
      hideAfterClickButtons.forEach((button: Button) => {
        codeLines.push(`    # Обработка флага hideAfterClick для кнопки "${button.text}"`);
        codeLines.push(`    if callback_query and callback_query.message and callback_data == "${button.id || button.target || 'unknown'}":`);
        codeLines.push(`        try:`);
        codeLines.push(`            # Удаляем сообщение, в котором была нажата кнопка`);
        codeLines.push(`            await bot.delete_message(chat_id=callback_query.message.chat.id, message_id=callback_query.message.message_id)`);
        codeLines.push(`            logging.info(f"🗑️ Сообщение удалено после нажатия кнопки с флагом hideAfterClick: {button.text}")`);
        codeLines.push(`        except Exception as e:`);
        codeLines.push(`            logging.warning(f"⚠️ Не удалось удалить сообщение после нажатия кнопки: {e}")`);
        codeLines.push(`            # Если не удалось удалить сообщение, просто отвечаем на callback`);
        codeLines.push(`            try:`);
        codeLines.push(`                await callback_query.answer()`);
        codeLines.push(`            except:`);
        codeLines.push(`                pass`);
        codeLines.push(`        return  # Прерываем дальнейшую обработку, так как сообщение уже удалено`);
        codeLines.push('');
      });
    }
  }
  
  // Применяем автоматическое добавление комментариев ко всему коду
  // Функция автоматически определяет имя файла
  const processedCode = processCodeWithAutoComments(codeLines, 'generateHideAfterClickHandler.ts');
  
  return processedCode.join('\n');
}

/**
 * Генерирует общий обработчик для всех кнопок с флагом hideAfterClick в callback-обработчике
 *
 * @param node - узел, содержащий кнопки
 * @returns строка с Python-кодом для проверки и обработки флага hideAfterClick
 */
export function generateHideAfterClickMiddleware(node: Node): string {
  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  // Проверяем, есть ли у узла кнопки с флагом hideAfterClick
  if (node.data.buttons && Array.isArray(node.data.buttons)) {
    const hideAfterClickButtons = node.data.buttons.filter((button: Button) => button.hideAfterClick === true);

    if (hideAfterClickButtons.length > 0) {
      codeLines.push('    # Проверяем, содержит ли callback_data кнопку с флагом hideAfterClick');

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
        codeLines.push('    hide_after_click_buttons = [' + hideAfterClickCallbackData.map(id => `"${id}"`).join(', ') + ']');
        codeLines.push('');
        codeLines.push('    # Проверяем, совпадает ли callback_data с одной из кнопок с флагом hideAfterClick');
        codeLines.push('    if callback_data in hide_after_click_buttons:');
        codeLines.push('        try:');
        codeLines.push('            # Удаляем сообщение, в котором была нажата кнопка');
        codeLines.push('            await bot.delete_message(chat_id=callback_query.message.chat.id, message_id=callback_query.message.message_id)');
        codeLines.push('            logging.info(f"🗑️ Сообщение удалено после нажатия кнопки с флагом hideAfterClick: {callback_data}")');
        codeLines.push('        except Exception as e:');
        codeLines.push('            logging.warning(f"⚠️ Не удалось удалить сообщение после нажатия кнопки: {e}")');
        codeLines.push('            # Если не удалось удалить сообщение, просто отвечаем на callback');
        codeLines.push('            try:');
        codeLines.push('                await callback_query.answer()');
        codeLines.push('            except:');
        codeLines.push('                pass');
        codeLines.push('        return  # Прерываем дальнейшую обработку, так как сообщение уже удалено');
        codeLines.push('');

        // Также проверяем формат callback_data вида nodeId_btn_index для кнопок с флагом hideAfterClick
        const hideAfterClickButtonIds = hideAfterClickButtons.map((button: Button) => button.id).filter(Boolean);
        if (hideAfterClickButtonIds.length > 0) {
          codeLines.push('    # Проверяем формат callback_data вида nodeId_btn_index для кнопок с флагом hideAfterClick');
          codeLines.push('    # Извлекаем индекс кнопки из callback_data и проверяем, соответствует ли она hideAfterClick кнопке');
          codeLines.push('    if "_" in callback_data:');
          codeLines.push('        parts = callback_data.split("_btn_")');
          codeLines.push('        if len(parts) == 2:');
          codeLines.push('            node_part, index_part = parts');
          codeLines.push('            # Проверяем, является ли node_part одним из ID кнопок с флагом hideAfterClick');

          hideAfterClickButtonIds.forEach((buttonId: string, index: number) => {
            if (index === 0) {
              codeLines.push(`            if node_part == "${buttonId}":`);
            } else {
              codeLines.push(`            elif node_part == "${buttonId}":`);
            }
            codeLines.push('                try:');
            codeLines.push('                    # Удаляем сообщение, в котором была нажата кнопка');
            codeLines.push('                    await bot.delete_message(chat_id=callback_query.message.chat.id, message_id=callback_query.message.message_id)');
            codeLines.push('                    logging.info(f"🗑️ Сообщение удалено после нажатия кнопки с флагом hideAfterClick: {callback_data}")');
            codeLines.push('                except Exception as e:');
            codeLines.push('                    logging.warning(f"⚠️ Не удалось удалить сообщение после нажатия кнопки: {e}")');
            codeLines.push('                    try:');
            codeLines.push('                        await callback_query.answer()');
            codeLines.push('                    except:');
            codeLines.push('                        pass');
            codeLines.push('                return  # Прерываем дальнейшую обработку');
          });
          codeLines.push('');
        }
      }
    }
  }

  // Применяем автоматическое добавление комментариев ко всему коду
  // Функция автоматически определяет имя файла
  const processedCode = processCodeWithAutoComments(codeLines, 'generateHideAfterClickHandler.ts');
  
  return processedCode.join('\n');
}