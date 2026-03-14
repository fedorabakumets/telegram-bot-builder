/**
 * @fileoverview Генерация установки флага collectUserInput
 * 
 * Модуль создаёт Python-код для установки флага сбора
 * пользовательского ввода для конкретного узла.
 * 
 * @module bot-generator/transitions/callback-handler/generate-collect-user-input-flag
 */

import { toPythonBoolean } from '../../format';

/**
 * Типы ввода данных пользователем
 */
export type InputType = 'text' | 'photo' | 'video' | 'audio' | 'document';

/**
 * Генерирует Python-код для установки флага collectUserInput
 * 
 * @param nodeId - ID узла
 * @param nodeData - Данные узла
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateCollectUserInputFlag(
  nodeId: string,
  nodeData: any,
  indent: string = '    '
): string {
  const collectUserInputFlag = nodeData?.collectUserInput === true ||
    nodeData?.enableTextInput === true ||
    nodeData?.enablePhotoInput === true ||
    nodeData?.enableVideoInput === true ||
    nodeData?.enableAudioInput === true ||
    nodeData?.enableDocumentInput === true;
  
  let code = '';
  code += `${indent}# Устанавливаем флаг collectUserInput для узла ${nodeId}\n`;
  code += `${indent}if user_id not in user_data:\n`;
  code += `${indent}    user_data[user_id] = {}\n`;
  code += `${indent}user_data[user_id]["collectUserInput_${nodeId}"] = ${toPythonBoolean(collectUserInputFlag)}\n`;
  code += `${indent}logging.info(f"ℹ️ Установлен флаг collectUserInput для узла ${nodeId}: ${collectUserInputFlag}")\n`;
  
  return code;
}
