/**
 * @fileoverview Генерация обработки узлов сбора ввода
 * 
 * Модуль создаёт Python-код для обработки узлов, которые собирают
 * пользовательский ввод (текст, фото, видео, аудио, документы).
 * 
 * @module bot-generator/transitions/input/generate-input-node-handling
 */

import { formatTextForPython } from '../../format';
import { generateUserInputFromNode } from '../../../templates/user-input';

/**
 * Параметры для генерации обработки узла ввода
 */
export interface InputNodeHandlingParams {
  targetNode: any;
  connections: any[];
}

/**
 * Генерирует Python-код для обработки узла сбора ввода
 * 
 * @param params - Параметры узла ввода
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateInputNodeHandling(
  params: InputNodeHandlingParams,
  indent: string = '    '
): string {
  const { targetNode, connections } = params;
  
  let code = '';
  
  // Определяем тип ввода
  let inputType = 'text';
  if (targetNode.data?.enablePhotoInput) {
    inputType = 'photo';
  } else if (targetNode.data?.enableVideoInput) {
    inputType = 'video';
  } else if (targetNode.data?.enableAudioInput) {
    inputType = 'audio';
  } else if (targetNode.data?.enableDocumentInput) {
    inputType = 'document';
  } else {
    inputType = targetNode.data?.inputType || 'text';
  }
  
  const inputPrompt = targetNode.data?.messageText || targetNode.data?.inputPrompt || "Пожалуйста, введите ваш ответ:";
  const inputVariable = targetNode.data?.inputVariable || `response_${targetNode.id}`;
  const saveToDatabase = targetNode.data?.saveToDatabase || false;
  
  code += `${indent}# Удаляем старое сообщение\n`;
  code += `${indent}\n`;
  
  const formattedPrompt = formatTextForPython(inputPrompt);
  code += `${indent}text = ${formattedPrompt}\n`;
  
  if (targetNode.data?.responseType === 'text') {
    code += `${indent}# Не отправляем сообщение второй раз, если оно уже было отправлено ранее\n`;
    code += `${indent}# Вместо этого, просто настраиваем ожидание ввода\n`;
    
    // Проверяем collectUserInput перед установкой waiting_for_input
    const inlineTextCollect = targetNode.data?.collectUserInput === true ||
      targetNode.data?.enableTextInput === true ||
      targetNode.data?.enablePhotoInput === true ||
      targetNode.data?.enableVideoInput === true ||
      targetNode.data?.enableAudioInput === true ||
      targetNode.data?.enableDocumentInput === true;
    
    if (inlineTextCollect) {
      code += generateUserInputFromNode(targetNode, indent);
    } else {
      code += `${indent}# Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
    }
  }
  
  return code;
}
