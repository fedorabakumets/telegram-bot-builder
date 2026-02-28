/**
 * @fileoverview Генерация проверки кнопок skipDataCollection
 * 
 * Модуль создаёт Python-код для обработки кнопок пропуска
 * в универсальной системе ожидания ввода.
 * 
 * @module bot-generator/user-input/generate-skip-buttons-check
 */

/**
 * Генерирует Python-код для проверки кнопок skipDataCollection
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код проверки кнопок
 */
export function generateSkipButtonsCheck(
  indent: string = '        '
): string {
  let code = '';
  code += `${indent}# ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true\n`;
  code += `${indent}if isinstance(waiting_config, dict):\n`;
  code += `${indent}    skip_buttons = waiting_config.get("skip_buttons", [])\n`;
  code += `${indent}    for skip_btn in skip_buttons:\n`;
  code += `${indent}        if skip_btn.get("text") == user_text:\n`;
  code += `${indent}            skip_target = skip_btn.get("target")\n`;
  code += `${indent}            logging.info(f"⏭️ Нажата кнопка skipDataCollection в waiting_for_input: {user_text} -> {skip_target}")\n`;
  code += `${indent}            # Очищаем состояние ожидания\n`;
  code += `${indent}            if "waiting_for_input" in user_data[user_id]:\n`;
  code += `${indent}                del user_data[user_id]["waiting_for_input"]\n`;
  return code;
}

/**
 * Генерирует Python-код для создания fake_callback при skip навигации
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код создания fake_callback
 */
export function generateSkipFakeCallbackCreation(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Переходим к целевому узлу\n`;
  code += `${indent}if skip_target:\n`;
  code += `${indent}    try:\n`;
  code += `${indent}        logging.info(f"🚀 Переходим к узлу skipDataCollection: {skip_target}")\n`;
  code += `${indent}        import types as aiogram_types\n`;
  code += `${indent}        fake_callback = aiogram_types.SimpleNamespace(\n`;
  code += `${indent}            id="skip_button_nav",\n`;
  code += `${indent}            from_user=message.from_user,\n`;
  code += `${indent}            chat_instance="",\n`;
  code += `${indent}            data=skip_target,\n`;
  code += `${indent}            message=message,\n`;
  code += `${indent}            answer=lambda *args, **kwargs: asyncio.sleep(0)\n`;
  code += `${indent}        )\n`;
  return code;
}

/**
 * Генерирует Python-код для навигации по skip_target
 * 
 * @param nodes - Массив узлов для генерации навигации
 * @param indent - Отступ для форматирования кода
 * @returns Код навигации
 */
export function generateSkipNavigation(
  nodes: any[],
  indent: string = '                            '
): string {
  let code = '';
  
  if (nodes.length > 0) {
    nodes.forEach((skipNode, skipIdx) => {
      const skipCond = skipIdx === 0 ? 'if' : 'elif';
      const skipFnName = skipNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      
      code += `${indent}${skipCond} skip_target == "${skipNode.id}":\n`;
      code += `${indent}    await handle_callback_${skipFnName}(fake_callback)\n`;
    });
    
    code += `${indent}else:\n`;
    code += `${indent}    logging.warning(f"Неизвестный целевой узел skipDataCollection: {skip_target}")\n`;
  }
  
  return code;
}
