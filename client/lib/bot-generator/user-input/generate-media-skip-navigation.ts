/**
 * @fileoverview Генерация навигации после пропуска медиа
 * 
 * Модуль создаёт Python-код для перехода к целевому узлу
 * после нажатия кнопки skipDataCollection на медиа-узле.
 * 
 * @module bot-generator/user-input/generate-media-skip-navigation
 */

/**
 * Генерирует Python-код для создания fake_callback
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код создания fake_callback
 */
export function generateFakeCallbackCreation(
  indent: string = '                    '
): string {
  let code = '';
  code += `${indent}# Переходим к целевому узлу\n`;
  code += `${indent}if skip_target:\n`;
  code += `${indent}    try:\n`;
  code += `${indent}        logging.info(f"🚀 Переходим к узлу skipDataCollection медиа: {skip_target}")\n`;
  code += `${indent}        import types as aiogram_types\n`;
  code += `${indent}        fake_callback = aiogram_types.SimpleNamespace(\n`;
  code += `${indent}            id="skip_media_nav",\n`;
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
export function generateSkipTargetNavigation(
  nodes: any[],
  indent: string = '                        '
): string {
  let code = '';
  
  if (nodes.length > 0) {
    nodes.forEach((mediaSkipNode, mediaSkipIdx) => {
      const mediaSkipCond = mediaSkipIdx === 0 ? 'if' : 'elif';
      const mediaSkipFnName = mediaSkipNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      
      code += `${indent}${mediaSkipCond} skip_target == "${mediaSkipNode.id}":\n`;
      code += `${indent}    await handle_callback_${mediaSkipFnName}(fake_callback)\n`;
    });
    
    code += `${indent}else:\n`;
    code += `${indent}    logging.warning(f"Неизвестный целевой узел skipDataCollection медиа: {skip_target}")\n`;
  }
  
  return code;
}
