/**
 * @fileoverview Модуль для генерации кода обработки условных сообщений и клавиатуры в обработчике команды /start
 *
 * Этот модуль предоставляет функцию для генерации Python-кода, которая:
 * - Обрабатывает условные сообщения
 * - Генерирует клавиатуру (inline или reply) на основе настроек узла
 * - Обрабатывает прикрепленные медиафайлы
 * - Формирует сообщения с учетом медиа-контента и клавиатуры
 *
 * @module generateConditionalMessageLogicAndKeyboard
 */

import type { Node } from '@shared/schema';
import { generateButtonText, toPythonBoolean } from '../format';
import { generateAttachedMediaSendCode } from '../MediaHandler';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

interface NodeWithKeyboard extends Node {
  data: {
    keyboardType?: 'inline' | 'reply' | 'none';
    buttons?: any[];
    attachedMedia?: string[];
    [key: string]: any;
  };
}

/**
 * Генерирует Python-код для обработки условных сообщений и генерации клавиатуры
 *
 * Функция добавляет в массив codeLines Python-код, который:
 * - Создает клавиатуру (inline или reply) на основе настроек узла
 * - Обрабатывает прикрепленные медиафайлы
 * - Отправляет сообщение с учетом медиа-контента и клавиатуры
 *
 * @param node - Узел конфигурации, содержащий настройки и данные команды
 * @param codeLines - Массив строк кода, в который будет добавлен сгенерированный Python-код
 * @param mediaVariablesMap - Карта переменных медиафайлов
 * @param attachedMedia - Массив прикрепленных медиафайлов
 * @param formattedText - Отформатированный текст сообщения
 *
 * @example
 * const node = {
 *   id: "start-node",
 *   data: {
 *     keyboardType: "inline",
 *     buttons: [
 *       { text: "Кнопка 1", action: "goto", target: "next_node" },
 *       { text: "Ссылка", action: "url", url: "https://example.com" }
 *     ],
 *     attachedMedia: ["image1"]
 *   }
 * };
 * const codeLines: string[] = [];
 * const mediaVars = new Map();
 * mediaVars.set("image1", { type: "image", variable: "image_var" });
 * generateConditionalMessageLogicAndKeyboard(node, codeLines, mediaVars, ["image1"], "Привет!");
 * // codeLines теперь содержит Python-код для обработки условных сообщений и клавиатуры
 */
export function generateConditionalMessageLogicAndKeyboard(node: NodeWithKeyboard, codeLines: string[], mediaVariablesMap: Map<string, { type: string; variable: string; }> | undefined, attachedMedia: string[], formattedText: string) {
    let keyboardCode = '';

    // Определяем тип клавиатуры и генерируем соответствующий код
    if (node && node.data && node.data.keyboardType === "inline" && node.data.buttons && node.data.buttons.length > 0) {
        keyboardCode += '    # Создаем inline клавиатуру\n';
        keyboardCode += '    builder = InlineKeyboardBuilder()\n';

        if (node && node.data && node.data.buttons) {
            node.data.buttons.forEach(button => {
                if (button.action === "url") {
                    keyboardCode += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
                } else if (button.action === 'goto' || button.action === 'selection' || button.action === 'complete') {
                    const callbackData = button.target || button.id || 'no_action';
                    keyboardCode += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
                }
            });
        }

        // Используем keyboardLayout если есть
        if (node.data.keyboardLayout && !node.data.keyboardLayout.autoLayout && node.data.keyboardLayout.rows.length > 0) {
            const rowSizes = node.data.keyboardLayout.rows.map((row: any) => row.buttonIds.length);
            keyboardCode += `    builder.adjust(${rowSizes.join(', ')})  # Используем раскладку из keyboardLayout\n`;
        } else {
            keyboardCode += '    builder.adjust(2)  # Используем 2 колонки для консистентности\n';
        }
        keyboardCode += '    keyboard = builder.as_markup()\n';
    } else if (node && node.data && node.data.keyboardType === "reply" && node.data.buttons && node.data.buttons.length > 0) {
        keyboardCode += '    # Создаем reply клавиатуру\n';
        keyboardCode += '    builder = ReplyKeyboardBuilder()\n';

        if (node && node.data && node.data.buttons) {
            node.data.buttons.forEach(button => {
                if (button.action === "contact" && button.requestContact) {
                    keyboardCode += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
                } else if (button.action === "location" && button.requestLocation) {
                    keyboardCode += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
                } else {
                    keyboardCode += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
                }
            });
        }

        let resizeKeyboardValue: any;
        if (node && node.data && node.data.resizeKeyboard !== undefined) {
            resizeKeyboardValue = node.data.resizeKeyboard;
        } else {
            resizeKeyboardValue = undefined;
        }

        let oneTimeKeyboardValue: any;
        if (node && node.data && node.data.oneTimeKeyboard !== undefined) {
            oneTimeKeyboardValue = node.data.oneTimeKeyboard;
        } else {
            oneTimeKeyboardValue = undefined;
        }

        const resizeKeyboard = toPythonBoolean(resizeKeyboardValue);
        const oneTimeKeyboard = toPythonBoolean(oneTimeKeyboardValue);
        keyboardCode += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
    } else if (node && node.data && node.data.keyboardType === "none") {
        // Если тип клавиатуры "none", все равно создаем переменную keyboard, но без клавиатуры
        keyboardCode += '    keyboard = None\n';
    } else {
        // По умолчанию создаем пустую клавиатуру
        keyboardCode += '    keyboard = None\n';
    }

    // Добавляем код создания клавиатуры
    const keyboardLines = keyboardCode.split('\n').filter(line => line.trim());
    codeLines.push(...keyboardLines);

    // Используем переданный mediaVariablesMap
    if (mediaVariablesMap) {
        // Фильтруем mediaVariablesMap, чтобы получить только те переменные, которые связаны с этим узлом
        const filteredMediaVariablesMap = new Map<string, { type: string; variable: string; }>();

        attachedMedia.forEach((mediaVar: string) => {
            if (mediaVariablesMap.has(mediaVar)) {
                filteredMediaVariablesMap.set(mediaVar, mediaVariablesMap.get(mediaVar)!);
            }
        });

        // Генерируем код для отправки прикрепленных медиа
        let formatModeValue: any;
        if (node && node.data) {
            formatModeValue = node.data.formatMode;
        } else {
            formatModeValue = 'HTML';
        }

        let autoTransitionToValue: any;
        if (node && node.data) {
            autoTransitionToValue = node.data.autoTransitionTo;
        } else {
            autoTransitionToValue = undefined;
        }

        let collectUserInputValue: any;
        if (node && node.data && node.data.collectUserInput !== undefined) {
            collectUserInputValue = node.data.collectUserInput;
        } else {
            collectUserInputValue = true;
        }

        const mediaCode = generateAttachedMediaSendCode(
            attachedMedia,
            filteredMediaVariablesMap,
            formattedText, // текст сообщения
            formatModeValue, // режим парсинга
            'keyboard', // клавиатура
            node.id || 'unknown', // ID узла
            '    ', // отступ
            autoTransitionToValue, // автопереход
            collectUserInputValue, // собирать пользовательский ввод
            node, // nodeData - передаем весь узел для доступа к imageUrl
            'message' // контекст обработчика
        );

        if (mediaCode.trim()) {
            // Используем код медиа вместо обычной отправки сообщения
            const mediaLines = mediaCode.split('\n');
            codeLines.push(...mediaLines);
        } else {
            // Если код медиа не сгенерирован, используем обычную логику
            if (node && node.data && node.data.allowMultipleSelection) {
                codeLines.push('    await message.answer(text, reply_markup=keyboard)');
            } else {
                const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
                codeLines.push(`    await message.answer(text${keyboardParam})`);
            }
        }
    } else {
        // Если mediaVariablesMap не передан, используем обычную логику
        if (node && node.data && node.data.allowMultipleSelection) {
            codeLines.push('    await message.answer(text, reply_markup=keyboard)');
        } else {
            const keyboardParam = keyboardCode.includes('keyboard') ? ', reply_markup=keyboard' : '';
            codeLines.push(`    await message.answer(text${keyboardParam})`);
        }
    }

    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCodeLines = processCodeWithAutoComments(codeLines, 'generateConditionalMessageLogicAndKeyboard.ts');

    // Обновляем оригинальный массив
    codeLines.length = 0;
    codeLines.push(...processedCodeLines);
}
