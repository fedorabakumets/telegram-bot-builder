/**
 * @fileoverview Генерация навигации к узлу
 * 
 * Модуль создаёт Python-код для навигации к целевому узлу
 * после переадресации с обработкой различных типов узлов.
 * 
 * @module bot-generator/transitions/navigation/generate-navigation-to-node
 */

import { formatTextForPython } from '../../format';

/**
 * Параметры для генерации навигации
 */
export interface NavigationToNodeParams {
  navTargetNode: any;
  userVars: string;
}

/**
 * Генерирует Python-код для навигации к узлу
 * 
 * @param params - Параметры навигации
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateNavigationToNode(
  params: NavigationToNodeParams,
  indent: string = '        '
): string {
  const { navTargetNode, userVars } = params;
  
  let code = '';
  
  if (navTargetNode.type === 'message') {
    // Проверяем, имеет ли узел множественный выбор
    if (navTargetNode.data?.allowMultipleSelection === true) {
      const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      code += `${indent}# Узел с множественным выбором - вызываем полноценный обработчик\n`;
      code += `${indent}logging.info(f"🔧 Callback навигация к узлу с множественным выбором: ${navTargetNode.id}")\n`;
      code += `${indent}await handle_callback_${safeFunctionName}(callback_query)\n`;
    } else {
      // Проверяем, есть ли условные сообщения
      const hasConditionalMessages = navTargetNode.data?.enableConditionalMessages &&
        navTargetNode.data?.conditionalMessages &&
        navTargetNode.data?.conditionalMessages.length > 0;
      
      if (hasConditionalMessages && navTargetNode.data?.collectUserInput === true) {
        const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `${indent}# Узел с условными сообщениями - вызываем полноценный обработчик\n`;
        code += `${indent}logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: ${navTargetNode.id}")\n`;
        code += `${indent}await handle_node_${safeFunctionName}(callback_query.message)\n`;
      } else {
        // Обычное сообщение
        const messageText = navTargetNode.data?.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `${indent}nav_text = ${formattedText}\n`;
        code += `${indent}# Подставляем переменные пользователя в текст\n`;
        code += `${indent}nav_user_vars = await get_user_from_db(callback_query.from_user.id)\n`;
        code += `${indent}if not nav_user_vars:\n`;
        code += `${indent}    nav_user_vars = ${userVars}.get(callback_query.from_user.id, {})\n`;
        code += `${indent}if not isinstance(nav_user_vars, dict):\n`;
        code += `${indent}    nav_user_vars = {}\n`;
        code += `${indent}# Заменяем переменные в nav_text\n`;
        code += `${indent}for var_name, var_data in nav_user_vars.items():\n`;
        code += `${indent}    placeholder = "{" + var_name + "}"\n`;
        code += `${indent}    if placeholder in nav_text:\n`;
        code += `${indent}        if isinstance(var_data, dict) and "value" in var_data:\n`;
        code += `${indent}            var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n`;
        code += `${indent}        elif var_data is not None:\n`;
        code += `${indent}            var_value = str(var_data)\n`;
        code += `${indent}        else:\n`;
        code += `${indent}            var_value = var_name\n`;
        code += `${indent}        nav_text = nav_text.replace(placeholder, var_value)\n`;
        
        // Проверяем наличие медиа
        const hasAttachedMedia = navTargetNode.data?.attachedMedia && navTargetNode.data.attachedMedia.length > 0;
        
        if (hasAttachedMedia) {
          code += `${indent}# Проверяем наличие прикрепленного медиа\n`;
          code += `${indent}nav_attached_media = None\n`;
          const attachedMedia = navTargetNode.data.attachedMedia;
          code += `${indent}if nav_user_vars and "${attachedMedia[0]}" in nav_user_vars:\n`;
          code += `${indent}    media_data = nav_user_vars["${attachedMedia[0]}"]\n`;
          code += `${indent}    if isinstance(media_data, dict) and "value" in media_data:\n`;
          code += `${indent}        if "photoUrl" in media_data and media_data["photoUrl"]:\n`;
          code += `${indent}            nav_attached_media = media_data["photoUrl"]\n`;
          code += `${indent}        elif "videoUrl" in media_data and media_data["videoUrl"]:\n`;
          code += `${indent}            nav_attached_media = media_data["videoUrl"]\n`;
          code += `${indent}        elif "audioUrl" in media_data and media_data["audioUrl"]:\n`;
          code += `${indent}            nav_attached_media = media_data["audioUrl"]\n`;
          code += `${indent}        elif "documentUrl" in media_data and media_data["documentUrl"]:\n`;
          code += `${indent}            nav_attached_media = media_data["documentUrl"]\n`;
          code += `${indent}        else:\n`;
          code += `${indent}            nav_attached_media = media_data["value"]\n`;
          code += `${indent}    elif isinstance(media_data, str):\n`;
          code += `${indent}        nav_attached_media = media_data\n`;
          code += `${indent}    if nav_attached_media and str(nav_attached_media).strip():\n`;
          code += `${indent}        logging.info(f"📎 Отправка медиа из переменной ${attachedMedia[0]}: {nav_attached_media}")\n`;
          code += `${indent}        if str(nav_attached_media).startswith('/uploads/'):\n`;
          code += `${indent}            nav_attached_media_path = get_upload_file_path(nav_attached_media)\n`;
          code += `${indent}            nav_attached_media_url = FSInputFile(nav_attached_media_path)\n`;
          code += `${indent}            await bot.send_photo(callback_query.from_user.id, nav_attached_media_url, caption=nav_text)\n`;
          code += `${indent}        else:\n`;
          code += `${indent}            await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)\n`;
          code += `${indent}    else:\n`;
          code += `${indent}        logging.info("📝 Медиа не найдено, отправка текстового сообщения")\n`;
          code += `${indent}        nav_text = replace_variables_in_text(nav_text, ${userVars})\n`;
          code += `${indent}        await callback_query.message.edit_text(nav_text)\n`;
        } else {
          code += `${indent}# Проверяем, есть ли reply кнопки\n`;
          code += `${indent}if navTargetNode.data.keyboardType == 'reply' and navTargetNode.data.buttons:\n`;
          code += `${indent}    # Отправка с reply клавиатурой\n`;
          code += `${indent}    pass  # Требуется дополнительная логика\n`;
          code += `${indent}else:\n`;
          code += `${indent}    nav_text = replace_variables_in_text(nav_text, ${userVars})\n`;
          code += `${indent}    await callback_query.message.edit_text(nav_text)\n`;
        }
      }
    }
  } else if (navTargetNode.type === 'command') {
    const commandName = navTargetNode.data?.command?.replace('/', '') || 'unknown';
    const handlerName = `${commandName}_handler`;
    code += `${indent}# Выполняем команду ${navTargetNode.data?.command}\n`;
    code += `${indent}from types import SimpleNamespace\n`;
    code += `${indent}fake_message = SimpleNamespace()\n`;
    code += `${indent}fake_message.from_user = callback_query.from_user\n`;
    code += `${indent}fake_message.chat = callback_query.message.chat\n`;
    code += `${indent}fake_message.date = callback_query.message.date\n`;
    code += `${indent}fake_message.answer = callback_query.message.answer\n`;
    code += `${indent}await ${handlerName}(fake_message)\n`;
  }
  
  return code;
}
