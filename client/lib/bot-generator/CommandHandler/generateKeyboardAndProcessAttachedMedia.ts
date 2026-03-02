/**
 * @fileoverview Модуль для генерации кода клавиатуры и обработки прикрепленных медиафайлов в обработчике команды /start
 *
 * Этот модуль предоставляет функцию для генерации Python-кода, которая:
 * - Обрабатывает условные сообщения
 * - Форматирует текст сообщения
 * - Заменяет переменные в тексте сообщения
 * - Генерирует клавиатуру для взаимодействия с пользователем
 *
 * @module generateKeyboardAndProcessAttachedMedia
 */

import type { Node } from '@shared/schema';
import { generateConditionalMessageLogic } from '../Conditional';
import { formatTextForPython } from '../format';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

interface NodeWithConditionalMessages extends Node {
  data: {
    messageText?: string;
    enableConditionalMessages?: boolean;
    conditionalMessages?: any[];
    [key: string]: any;
  };
}

/**
 * Генерирует Python-код для обработки текста сообщения, условных сообщений и замены переменных
 *
 * Функция добавляет в массив codeLines Python-код, который:
 * - Форматирует текст сообщения для использования в Python
 * - Обрабатывает условные сообщения, если они включены
 * - Заменяет переменные в тексте сообщения данными пользователя
 *
 * @param node - Узел конфигурации, содержащий настройки и данные команды
 * @param codeLines - Массив строк кода, в который будет добавлен сгенерированный Python-код
 *
 * @returns Отформатированный текст сообщения
 *
 * @example
 * const node = {
 *   id: "start-node",
 *   data: {
 *     messageText: "Привет, {user_name}!",
 *     enableConditionalMessages: true,
 *     conditionalMessages: [...]
 *   }
 * };
 * const codeLines: string[] = [];
 * const result = generateKeyboardAndProcessAttachedMedia(node, codeLines);
 * // codeLines теперь содержит Python-код для обработки сообщения
 */
export function generateKeyboardAndProcessAttachedMedia(node: NodeWithConditionalMessages, codeLines: string[]) {
    const messageText = (node && node.data && node.data.messageText) ? node.data.messageText : "Привет! Добро пожаловать!";
    const formattedText = formatTextForPython(messageText);

    if (node && node.data && node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
        // Инициализируем text только если он ещё не определён
        codeLines.push('    # Проверяем условные сообщения');
        codeLines.push('    # text уже определён выше, используем его как fallback');
        codeLines.push('    conditional_parse_mode = None');
        codeLines.push('    conditional_keyboard = None');
        codeLines.push('');
        codeLines.push('    # Получаем данные пользователя для проверки условий');
        codeLines.push('    user_record = await get_user_from_db(user_id)');
        codeLines.push('    if not user_record:');
        codeLines.push('        user_record = user_data.get(user_id, {})');
        codeLines.push('');
        codeLines.push('    # Безопасно извлекаем user_data');
        codeLines.push('    if isinstance(user_record, dict):');
        codeLines.push('        if "user_data" in user_record and isinstance(user_record["user_data"], dict):');
        codeLines.push('            user_data_dict = user_record["user_data"]');
        codeLines.push('        else:');
        codeLines.push('            user_data_dict = user_record');
        codeLines.push('    else:');
        codeLines.push('        user_data_dict = {}');
        codeLines.push('');

        // Generate conditional logic using helper function - условия теперь переопределят text если нужно
        let conditionalMessagesValue: any;
        if (node && node.data) {
            conditionalMessagesValue = node.data.conditionalMessages;
        } else {
            conditionalMessagesValue = [];
        }

        let nodeDataValue: any;
        if (node && node.data) {
            nodeDataValue = node.data;
        } else {
            nodeDataValue = {};
        }

        const conditionalCode = generateConditionalMessageLogic(conditionalMessagesValue, '    ', nodeDataValue);
        const conditionalLines = conditionalCode.split('\n').filter(line => line.trim());
        codeLines.push(...conditionalLines);

        // Не нужен else блок - text уже инициализирован основным сообщением
        codeLines.push('');

        // Добавляем замену переменных в тексте для условных сообщений
        codeLines.push('');
        codeLines.push('    # Подставляем все доступные переменные пользователя в текст');
        codeLines.push('    user_vars = await get_user_from_db(user_id)');
        codeLines.push('    if not user_vars:');
        codeLines.push('        user_vars = user_data.get(user_id, {})');
        codeLines.push('');
        codeLines.push('    # get_user_from_db теперь возвращает уже обработанные user_data');
        codeLines.push('    if not isinstance(user_vars, dict):');
        codeLines.push('        user_vars = user_data.get(user_id, {})');
        codeLines.push('');
        codeLines.push('    # Заменяем все переменные в тексте (text уже определён выше)');
        codeLines.push('    text = replace_variables_in_text(text, all_user_vars)');
    } else {
        // text уже определён в generateStartHandler, не переопределяем
        codeLines.push('    # text уже определён выше, заменяем переменные');
        codeLines.push('    text = replace_variables_in_text(text, all_user_vars)');
    }

    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCodeLines = processCodeWithAutoComments(codeLines, 'generateKeyboardAndProcessAttachedMedia.ts');

    // Обновляем оригинальный массив
    codeLines.length = 0;
    codeLines.push(...processedCodeLines);

    return formattedText;
}
