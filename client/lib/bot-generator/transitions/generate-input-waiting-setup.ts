/**
 * @fileoverview Генерация кода для настройки ожидания ввода
 * 
 * Модуль создаёт Python-код для настройки waiting_for_input
 * с параметрами валидации, таймаутами и навигацией.
 * 
 * @module bot-generator/transitions/generate-input-waiting-setup
 */

import { toPythonBoolean, escapeForJsonString } from '../format';

/**
 * Генерирует Python-код для настройки ожидания ввода
 * 
 * @param node - Узел с данными ввода
 * @param connections - Массив соединений для навигации
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateInputWaitingSetup(
  node: any,
  connections: any[],
  indent: string = '                '
): string {
  let code = '';
  
  const inputPrompt = node.data.messageText || node.data.inputPrompt || "Введите ваш ответ:";
  const inputVariable = node.data.inputVariable || `response_${node.id}`;
  
  let inputType = 'text';
  if (node.data.enablePhotoInput) {
    inputType = 'photo';
  } else if (node.data.enableVideoInput) {
    inputType = 'video';
  } else if (node.data.enableAudioInput) {
    inputType = 'audio';
  } else if (node.data.enableDocumentInput) {
    inputType = 'document';
  } else {
    inputType = node.data.inputType || 'text';
  }
  
  const minLength = node.data.minLength || 0;
  const maxLength = node.data.maxLength || 0;
  const inputTimeout = node.data.inputTimeout || 60;
  const saveToDatabase = node.data.saveToDatabase || false;
  const placeholder = node.data.placeholder || "";
  
  code += `${indent}prompt_text = "${escapeForJsonString(inputPrompt)}"\n`;
  if (placeholder) {
    code += `${indent}placeholder_text = "${placeholder}"\n`;
    code += `${indent}prompt_text += f"\\n\\n💡 {placeholder_text}"\n`;
  }
  
  code += `${indent}await message.answer(prompt_text)\n`;
  code += `${indent}\n`;
  
  const textNodeCollectInput = node.data.collectUserInput === true ||
    node.data.enableTextInput === true ||
    node.data.enablePhotoInput === true ||
    node.data.enableVideoInput === true ||
    node.data.enableAudioInput === true ||
    node.data.enableDocumentInput === true;
  
  if (textNodeCollectInput) {
    code += `${indent}# Настраиваем ожидание ввода (collectUserInput=true)\n`;
    code += `${indent}user_data[user_id]["waiting_for_input"] = {\n`;
    code += `${indent}    "type": "${inputType}",\n`;
    code += `${indent}    "variable": "${inputVariable}",\n`;
    code += `${indent}    "validation": "",\n`;
    code += `${indent}    "min_length": ${minLength},\n`;
    code += `${indent}    "max_length": ${maxLength},\n`;
    code += `${indent}    "timeout": ${inputTimeout},\n`;
    code += `${indent}    "required": True,\n`;
    code += `${indent}    "allow_skip": False,\n`;
    code += `${indent}    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
    code += `${indent}    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
    code += `${indent}    "success_message": "",\n`;
    code += `${indent}    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
    code += `${indent}    "node_id": "${node.id}",\n`;
    
    const nextConnection = connections.find(conn => conn.source === node.id);
    if (nextConnection) {
      code += `${indent}    "next_node_id": "${nextConnection.target}"\n`;
    } else {
      code += `${indent}    "next_node_id": None\n`;
    }
    code += `${indent}}\n`;
  } else {
    code += `${indent}# Узел ${node.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
  }
  
  return code;
}
