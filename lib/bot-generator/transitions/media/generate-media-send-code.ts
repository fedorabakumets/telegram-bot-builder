/**
 * @fileoverview Генерация отправки сообщений с медиа
 * 
 * Модуль создаёт Python-код для отправки сообщений с медиафайлами
 * или обычного текста с резервным вариантом отправки.
 * 
 * @module bot-generator/transitions/media/generate-media-send-code
 */

import { generateAttachedMediaSendCode } from '../../MediaHandler';

/**
 * Параметры для генерации отправки медиа
 */
export interface MediaSendCodeParams {
  attachedMedia: string[];
  hasStaticImage: boolean;
  mediaVariablesMap: Map<string, { type: string; variable: string; }>;
  formatMode?: string;
  nodeId: string;
  collectUserInputFlag: boolean;
  targetNodeData: any;
}

/**
 * Генерирует Python-код для отправки сообщений с медиа
 * 
 * @param params - Параметры отправки медиа
 * @param textVar - Имя переменной текста
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMediaSendCode(
  params: MediaSendCodeParams,
  textVar: string = 'text',
  indent: string = '    '
): string {
  const {
    attachedMedia,
    hasStaticImage,
    mediaVariablesMap,
    formatMode,
    nodeId,
    collectUserInputFlag,
    targetNodeData
  } = params;
  
  let code = '';
  
  if (attachedMedia.length > 0 || hasStaticImage) {
    const parseModeStr = formatMode || '';
    const keyboardStr = 'keyboard if keyboard is not None else None';
    
    const mediaCode = generateAttachedMediaSendCode(
      attachedMedia,
      mediaVariablesMap,
      'text',
      parseModeStr,
      keyboardStr,
      nodeId,
      indent,
      undefined,
      collectUserInputFlag,
      targetNodeData
    );

    if (mediaCode) {
      code += `${indent}# Отправляем сообщение (с проверкой прикрепленного медиа)\n`;
      code += mediaCode;
    } else {
      // Резервный вариант если не удалось сгенерировать код медиа
      code += `${indent}# Резервный вариант отправки без медиа\n`;
      code += generateTextSendCode(textVar, indent);
    }
  } else {
    // Обычное сообщение без медиа
    code += `${indent}# Отправляем сообщение с клавиатурой\n`;
    code += generateTextSendCode(textVar, indent);
  }
  
  return code;
}

/**
 * Генерирует Python-код для отправки текста (резервный вариант)
 * 
 * @param textVar - Имя переменной текста
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateTextSendCode(
  textVar: string = 'text',
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}# Заменяем все переменные в тексте\n`;
  code += `${indent}# Получаем фильтры переменных для замены\n`;
  code += `${indent}variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`;
  code += `${indent}${textVar} = replace_variables_in_text(${textVar}, all_user_vars, variable_filters)\n`;
  code += `${indent}try:\n`;
  code += `${indent}    if keyboard:\n`;
  code += `${indent}        await safe_edit_or_send(callback_query, ${textVar}, reply_markup=keyboard)\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        await callback_query.message.answer(${textVar})\n`;
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.debug(f"Ошибка отправки сообщения: {e}")\n`;
  code += `${indent}    if keyboard:\n`;
  code += `${indent}        await callback_query.message.answer(${textVar}, reply_markup=keyboard)\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        await callback_query.message.answer(${textVar})\n`;
  
  return code;
}
