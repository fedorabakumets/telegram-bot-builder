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
import { generateUserInputFromNode } from '../../templates/user-input';

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
    code += generateUserInputFromNode(targetNode, bodyIndent);
  } else {
    code += `${bodyIndent}# Узел ${targetNode.id} имеет collectUserInput=false - НЕ устанавливаем waiting_for_input\n`;
  }

  code += `${bodyIndent}break  # Выходим из цикла после настройки ожидания ввода\n`;

  return code;
}
