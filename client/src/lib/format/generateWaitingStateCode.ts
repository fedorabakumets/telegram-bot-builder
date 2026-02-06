// ============================================================================
// ГЕНЕРАТОРЫ СОСТОЯНИЙ И ИДЕНТИФИКАТОРОВ
// ============================================================================

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python код для установки состояния ожидания ввода от пользователя
 *
 * Функция автоматически определяет тип ожидаемого ввода (текст, фото, видео, аудио, документ)
 * на основе настроек узла и генерирует соответствующий Python код для установки состояния.
 * Поддерживает множественные типы ввода и различные варианты обработки пользовательского ввода.
 *
 * @param node - Объект узла графа с настройками ввода
 * @param indentLevel - Уровень отступа для форматирования кода (по умолчанию 4 пробела)
 * @param userIdSource - Источник ID пользователя (по умолчанию 'message.from_user.id')
 *
 * @returns Строка с Python кодом для установки состояния ожидания ввода
 *
 * @example
 * // Для узла с ожиданием текстового ввода
 * generateWaitingStateCode({
 *   id: "node_1",
 *   data: {
 *     enableTextInput: true,
 *     inputVariable: "user_name"
 *   }
 * });
 * // Возвращает Python код для установки состояния ожидания текста
 */
export function generateWaitingStateCode(node: any, indentLevel: string = '    ', userIdSource: string = 'message.from_user.id'): string {
  // Определяем тип ввода и соответствующее состояние
  const waitingStateKey = 'waiting_for_input'; // Всегда используем одно и то же состояние
  let inputVariable = node.data.inputVariable || `response_${node.id}`;

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем массив modes для поддержки нескольких типов ввода
  const modes: string[] = [];

  // Проверяем медиа-типы
  if (node.data.enablePhotoInput) {
    modes.push('photo');
    inputVariable = node.data.photoInputVariable || 'user_photo';
  } else if (node.data.enableVideoInput) {
    modes.push('video');
    inputVariable = node.data.videoInputVariable || 'user_video';
  } else if (node.data.enableAudioInput) {
    modes.push('audio');
    inputVariable = node.data.audioInputVariable || 'user_audio';
  } else if (node.data.enableDocumentInput) {
    modes.push('document');
    inputVariable = node.data.documentInputVariable || 'user_document';
  } else {
    // Для текстовых узлов проверяем наличие кнопок И текстового ввода
    const hasReplyButtons = node.data.keyboardType === 'reply' && node.data.buttons && node.data.buttons.length > 0;
    const hasTextInput = node.data.enableTextInput === true || node.data.collectUserInput === true;

    if (hasReplyButtons) {
      modes.push('button');
    }
    if (hasTextInput || !hasReplyButtons) {
      // Если нет кнопок или включен текстовый ввод - добавляем text
      modes.push('text');
    }
  }

  // Если modes пустой, по умолчанию добавляем text
  if (modes.length === 0) {
    modes.push('text');
  }

  const inputTargetNodeId = node.data.inputTargetNodeId || '';
  const modesStr = modes.map(m => `"${m}"`).join(', ');
  const modesRepr = modes.map(m => `'${m}'`).join(', '); // Для вывода в логи - с одинарными кавычками
  const primaryType = modes[0]; // Первый тип для обратной совместимости

  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  codeLines.push(`${indentLevel}user_data[${userIdSource}] = user_data.get(${userIdSource}, {})`);
  codeLines.push(`${indentLevel}user_data[${userIdSource}]["${waitingStateKey}"] = {`);
  codeLines.push(`${indentLevel}    "type": "${primaryType}",`);
  codeLines.push(`${indentLevel}    "modes": [${modesStr}],`);
  codeLines.push(`${indentLevel}    "variable": "${inputVariable}",`);
  codeLines.push(`${indentLevel}    "save_to_database": True,`);
  codeLines.push(`${indentLevel}    "node_id": "${node.id}",`);
  codeLines.push(`${indentLevel}    "next_node_id": "${inputTargetNodeId}",`);
  codeLines.push(`${indentLevel}    "min_length": ${node.data.minLength || 0},`);
  codeLines.push(`${indentLevel}    "max_length": ${node.data.maxLength || 0},`);
  codeLines.push(`${indentLevel}    "retry_message": "Пожалуйста, попробуйте еще раз.",`);
  codeLines.push(`${indentLevel}    "success_message": ""`);
  codeLines.push(`${indentLevel}}`);
  codeLines.push(`${indentLevel}logging.info(f"✅ Состояние ожидания настроено: modes=[${modesRepr}] для переменной ${inputVariable} (узел ${node.id})")`);

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateWaitingStateCode.ts');
  
  return processedCode.join('\n');
}
