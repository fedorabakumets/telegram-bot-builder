/**
 * @fileoverview Генерация проверки автоперехода
 * 
 * Модуль создаёт Python-код для проверки и генерации
 * кода автоперехода между узлами.
 * 
 * @module bot-generator/transitions/auto-transition/generate-auto-transition-check
 */

import { toPythonBoolean } from '../../format';

/**
 * Параметры для генерации проверки автоперехода
 */
export interface AutoTransitionCheckParams {
  nodeId: string;
  targetNode: any;
  nodes: any[];
  connections: any[];
}

/**
 * Генерирует Python-код для проверки автоперехода
 * 
 * @param params - Параметры автоперехода
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionCheck(
  params: AutoTransitionCheckParams,
  indent: string = '    '
): string {
  const { nodeId } = params;
  
  let code = '';
  code += `${indent}\n`;
  code += `${indent}# Проверяем условия для автоперехода узла ${nodeId}\n`;
  
  return code;
}

/**
 * Генерирует Python-код для выполнения автоперехода
 * 
 * @param autoTransitionTarget - Целевой узел автоперехода
 * @param nodeId - ID текущего узла
 * @param targetNode - Данные целевого узла
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionCode(
  autoTransitionTarget: string,
  nodeId: string,
  targetNode: any,
  indent: string = '    '
): string {
  const collectUserInputValue = targetNode.data?.collectUserInput === true;
  const staticCollectUserInput = targetNode.data?.collectUserInput === true ||
    targetNode.data?.enableTextInput === true ||
    targetNode.data?.enablePhotoInput === true ||
    targetNode.data?.enableVideoInput === true ||
    targetNode.data?.enableAudioInput === true ||
    targetNode.data?.enableDocumentInput === true;
  
  let code = '';
  code += `${indent}# АВТОПЕРЕХОД: Проверяем условия перед выполнением\n`;
  code += `${indent}user_id = callback_query.from_user.id\n`;
  code += `${indent}has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)\n`;
  code += `${indent}if has_conditional_keyboard:\n`;
  code += `${indent}    logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")\n`;
  code += `${indent}elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):\n`;
  code += `${indent}    logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${nodeId}")\n`;
  code += `${indent}elif user_id in user_data and user_data[user_id].get("collectUserInput_${nodeId}", ${toPythonBoolean(collectUserInputValue)}) == True:\n`;
  code += `${indent}    logging.info(f"ℹ️ Узел ${nodeId} ожидает ввод (collectUserInput=true из user_data), автопереход пропущен")\n`;
  if (staticCollectUserInput) {
    code += `${indent}elif True:  # Узел ожидает ввод (статическая проверка)\n`;
    code += `${indent}    logging.info(f"ℹ️ Узел ${nodeId} ожидает ввод (collectUserInput=true из статической проверки), автопереход пропущен")\n`;
  }
  code += `${indent}else:\n`;
  code += `${indent}    # ⚡ Автопереход к узлу ${autoTransitionTarget}\n`;
  
  return code;
}
