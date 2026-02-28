/**
 * @fileoverview Обработка сообщений с типом ввода (inputType/responseType)
 *
 * Генерирует Python-код для узлов сообщений, которые запрашивают
 * ввод определённого типа (текст, фото, видео, аудио, документ) от пользователя.
 *
 * @module handle-message-input
 */

import type { Node } from '@shared/schema';
import { formatTextForPython } from '../format';

/**
 * Соединение между узлами графа
 */
export interface Connection {
  /** Уникальный идентификатор соединения */
  id: string;
  /** ID исходного узла */
  source: string;
  /** ID целевого узла */
  target: string;
}

/**
 * Генерирует код для обработки сообщения с запросом ввода
 * @param targetNode - Узел сообщения с настройками ввода
 * @param bodyIndent - Отступ для тела блока кода
 * @param connections - Массив соединений для определения следующего узла
 * @returns Строка с Python-кодом для настройки ожидания ввода
 *
 * @example
 * const code = handleMessageWithInputType(messageNode, '    ', connections);
 */
export function handleMessageWithInputType(
  targetNode: Node,
  bodyIndent: string,
  connections: Connection[]
): string {
  let code = '';

  const inputPrompt = targetNode.data?.messageText || 'Введите ваш ответ:';
  const formattedPrompt = formatTextForPython(inputPrompt);

  code += `${bodyIndent}prompt_text = ${formattedPrompt}\n`;
  code += `${bodyIndent}await message.answer(prompt_text)\n`;

  // Проверка: нужно ли устанавливать ожидание ввода
  const shouldCollectInput =
    targetNode.data?.collectUserInput === true ||
    targetNode.data?.enableTextInput === true ||
    targetNode.data?.enablePhotoInput === true ||
    targetNode.data?.enableVideoInput === true ||
    targetNode.data?.enableAudioInput === true ||
    targetNode.data?.enableDocumentInput === true;

  if (shouldCollectInput) {
    code += `${bodyIndent}# Устанавливаем новое ожидание ввода (collectUserInput=true)\n`;
    code += `${bodyIndent}user_data[user_id]["waiting_for_input"] = {\n`;
    code += `${bodyIndent}    "type": "${targetNode.data?.inputType || 'text'}",\n`;
    code += `${bodyIndent}    "variable": "${targetNode.data?.inputVariable || 'user_response'}",\n`;
    code += `${bodyIndent}    "save_to_database": True,\n`;
    code += `${bodyIndent}    "node_id": "${targetNode.id}",\n`;

    // Определяем следующий узел из соединений
    const nextConnection = connections.find(conn => conn.source === targetNode.id);
    if (nextConnection) {
      code += `${bodyIndent}    "next_node_id": "${nextConnection.target}",\n`;
    } else {
      code += `${bodyIndent}    "next_node_id": None,\n`;
    }

    code += `${bodyIndent}    "min_length": ${targetNode.data?.minLength || 0},\n`;
    code += `${bodyIndent}    "max_length": ${targetNode.data?.maxLength || 0},\n`;
    code += `${bodyIndent}    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
    code += `${bodyIndent}    "success_message": ""\n`;
    code += `${bodyIndent}}\n`;
  } else {
    code += `${bodyIndent}# Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
  }

  code += `${bodyIndent}break  # Выходим из цикла после настройки ожидания ввода\n`;

  return code;
}
