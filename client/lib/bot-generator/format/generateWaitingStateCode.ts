/**
 * @fileoverview Утилита для генерации кода установки состояния ожидания ввода
 * 
 * Этот модуль предоставляет функции для генерации Python-кода,
 * устанавливающего состояние ожидания ввода от пользователя
 * с автоматическим определением типа ввода.
 * 
 * @module generateWaitingStateCode
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';


/**
 * Генерирует код установки состояния ожидания ввода
 * 
 * Функция автоматически определяет правильное состояние ожидания
 * (waiting_for_photo, waiting_for_video и т.д.) в зависимости от
 * настроек узла и генерирует соответствующий Python-код.
 * 
 * @param node - Узел с настройками ввода
 * @param indentLevel - Уровень отступа для генерируемого кода (по умолчанию '    ')
 * @param userIdSource - Источник идентификатора пользователя (по умолчанию 'message.from_user.id')
 * @returns Сгенерированный Python-код для установки состояния ожидания ввода
 * 
 * @example
 * // Генерация кода для узла с ожиданием фото
 * const code = generateWaitingStateCode({
 *   id: 'node_123',
 *   data: {
 *     enablePhotoInput: true,
 *     photoInputVariable: 'user_avatar'
 *   }
 * });
 * // Возвращает Python-код, устанавливающий состояние ожидания фото
 */
export function generateWaitingStateCode(node: any, indentLevel: string = '    ', userIdSource: string = 'message.from_user.id'): string {
  // Проверяем, что node и node.data существуют
  if (!node || !node.data) {
    console.warn('⚠️ generateWaitingStateCode: node или node.data не определены, возвращаем пустой код');
    return '';
  }

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
    const hasInlineButtons = node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0;
    const hasMultipleSelection = node.data.allowMultipleSelection === true;
    const hasTextInput = node.data.enableTextInput === true || node.data.collectUserInput === true;

    // Для узлов с любыми кнопками (включая множественный выбор) добавляем режим кнопок
    if (hasReplyButtons || hasInlineButtons || hasMultipleSelection) {
      modes.push('button');
    }

    // Добавляем текстовый режим только если:
    // 1. Включен текстовый ввод (enableTextInput или collectUserInput)
    // 2. И это НЕ узел с множественным выбором
    if (hasTextInput && !hasMultipleSelection) {
      modes.push('text');
    }

    // Если нет ни кнопок, ни текстового ввода, но есть множественный выбор - добавляем button
    if (hasMultipleSelection && modes.length === 0) {
      modes.push('button');
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
  // Добавим дополнительную защиту от проблем с форматированием
  codeLines.push(''); // Пустая строка для разделения

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generateWaitingStateCode.ts');

  // Убедимся, что каждая строка кода отделена переводом строки
  return commentedCodeLines.join('\n');
}
