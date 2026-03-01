/**
 * @fileoverview Генерация кода для конфигурации кнопочного ответа
 *
 * Модуль создаёт Python-код для настройки button_response_config
 * с вариантами ответов, кнопками и навигацией.
 *
 * @module bot-generator/transitions/generate-button-response-config
 */

import { toPythonBoolean, escapeForJsonString } from '../format';
import { generateInlineKeyboardCode } from '../Keyboard';
import type { ButtonResponseConfigParams } from './types/button-response-config-params';
import type { ResponseOption } from './types/button-response-config-types';

/**
 * Генерирует Python-код для конфигурации кнопочного ответа
 *
 * @param params - Параметры для генерации
 * @returns Сгенерированный Python-код
 */
export function generateButtonResponseConfig(
  params: ButtonResponseConfigParams
): string {
  const { node, allNodeIds, connections, indent = '                ' } = params;

  let code = '';
  const inputPrompt = node.data.messageText || node.data.inputPrompt || "Введите ваш ответ:";
  const inputVariable = node.data.inputVariable || `response_${node.id}`;
  const inputTimeout = node.data.inputTimeout || 60;
  const saveToDatabase = node.data.saveToDatabase || false;
  const allowMultipleSelection = node.data.allowMultipleSelection || false;
  const allowSkip = node.data.allowSkip || false;
  const responseOptions = node.data.responseOptions || [];

  code += `${indent}\n`;
  code += `${indent}# Создаем кнопки для выбора ответа\n`;
  code += `${indent}builder = InlineKeyboardBuilder()\n`;

  const responseButtons = responseOptions.map((option: ResponseOption | string, index: number) => {
    const normalizedOption: ResponseOption = typeof option === 'string'
      ? { text: option, value: option }
      : option;
    return {
      text: normalizedOption.text,
      action: 'goto',
      target: `response_${node.id}_${index}`,
      id: `response_${node.id}_${index}`
    };
  });
  
  if (allowSkip) {
    responseButtons.push({
      text: "⏭️ Пропустить",
      action: 'goto',
      target: `skip_${node.id}`,
      id: `skip_${node.id}`
    });
  }
  
  code += generateInlineKeyboardCode(responseButtons, indent, node.id, node.data, allNodeIds);
  code += `${indent}await message.answer(prompt_text, reply_markup=keyboard)\n`;
  code += `${indent}\n`;
  code += `${indent}# Настраиваем конфигурацию кнопочного ответа\n`;
  code += `${indent}user_data[user_id]["button_response_config"] = {\n`;
  code += `${indent}    "variable": "${inputVariable}",\n`;
  code += `${indent}    "node_id": "${node.id}",\n`;
  code += `${indent}    "timeout": ${inputTimeout},\n`;
  code += `${indent}    "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
  code += `${indent}    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
  code += `${indent}    "selected": [],\n`;
  code += `${indent}    "success_message": "",\n`;
  code += `${indent}    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
  code += `${indent}    "options": [\n`;
  
  responseOptions.forEach((option: ResponseOption, index: number) => {
    const optionValue = option.value || option.text;
    const action = option.action || 'goto';
    const target = option.target || '';
    const url = option.url || '';
    
    code += `${indent}        {\n`;
    code += `${indent}            "text": "${escapeForJsonString(option.text)}",\n`;
    code += `${indent}            "value": "${escapeForJsonString(optionValue)}",\n`;
    code += `${indent}            "action": "${action}",\n`;
    code += `${indent}            "target": "${target}",\n`;
    code += `${indent}            "url": "${url}",\n`;
    code += `${indent}            "callback_data": "response_${node.id}_${index}"\n`;
    code += `${indent}        }`;
    if (index < responseOptions.length - 1) {
      code += ',';
    }
    code += '\n';
  });
  
  code += `${indent}    ],\n`;
  
  const nextConnection = connections.find(conn => conn.source === node.id);
  if (nextConnection) {
    code += `${indent}    "next_node_id": "${nextConnection.target}"\n`;
  } else {
    code += `${indent}    "next_node_id": None\n`;
  }
  code += `${indent}}\n`;
  
  return code;
}
