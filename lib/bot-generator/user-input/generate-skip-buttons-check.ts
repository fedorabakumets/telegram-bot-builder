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
 * @param indent - Отступ для форматирования кода (уровень внутри if isinstance)
 * @returns Код проверки кнопок
 */
export function generateSkipButtonsCheck(
  indent: string = '        '
): string {
  let code = '';
  
  code += `${indent}# ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true\n`;
  code += `${indent}skip_buttons = waiting_config.get("skip_buttons", [])\n`;
  code += `${indent}logging.info(f"DEBUG: skip_buttons = {skip_buttons}")\n`;
  code += `${indent}skip_target = None\n`;
  code += `${indent}for skip_btn in skip_buttons:\n`;
  code += `${indent}    if skip_btn.get("text") == user_text:\n`;
  code += `${indent}        skip_target = skip_btn.get("target")\n`;
  code += `${indent}        logging.info(f"⏭️ Нажата кнопка skipDataCollection в waiting_for_input: {user_text} -> {skip_target}")\n`;
  code += `${indent}        # Очищаем состояние ожидания\n`;
  code += `${indent}        if "waiting_for_input" in user_data[user_id]:\n`;
  code += `${indent}            del user_data[user_id]["waiting_for_input"]\n`;
  code += `${indent}        break\n`;
  return code;
}

/**
 * Генерирует Python-код для создания fake_callback при skip навигации
 *
 * @param indent - Отступ для форматирования кода (уровень try/except)
 * @returns Код создания fake_callback
 */
export function generateSkipFakeCallbackCreation(
  indent: string = '        '
): string {
  let code = '';
  code += `${indent}# Переходим к целевому узлу если skip_target найден\n`;
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
 * Генерирует завершение блока try/except для skip навигации
 *
 * @param ifIndent - Отступ для if блока (8 пробелов)
 * @returns Код завершения try/except
 */
export function generateSkipFakeCallbackCompletion(
  ifIndent: string = '        '
): string {
  let code = '';
  const tryIndent = ifIndent + '    '; // try на уровне ifIndent + 4

  code += `${tryIndent}except Exception as e:\n`;
  code += `${tryIndent}    logging.error(f"Ошибка при переходе skipDataCollection к узлу {skip_target}: {e}")\n`;
  // return убран - код должен продолжиться до processUserInputWithValidationAndSave
  return code;
}

/**
 * Генерирует Python-код для навигации по skip_target
 *
 * @param nodes - Массив узлов для генерации навигации
 * @param ifIndent - Отступ для if блока (12 пробелов)
 * @returns Код навигации
 */
export function generateSkipNavigation(
  nodes: any[],
  ifIndent: string = '            '
): string {
  let code = '';
  const tryIndent = ifIndent + '    '; // try на уровне if + 4
  const bodyIndent = tryIndent + '    '; // код внутри try на уровне try + 4

  if (nodes.length > 0) {
    code += `${bodyIndent}# Вызываем обработчик целевого узла\n`;
    code += `${bodyIndent}await call_skip_target_handler(fake_callback, skip_target)\n`;
    code += `${bodyIndent}logging.info(f"✅ Переход skipDataCollection выполнен: {skip_target}")\n`;
    code += `${bodyIndent}return  # Завершаем обработку после skip навигации\n`;
  }

  return code;
}
