/**
 * @fileoverview Модуль для генерации обработчика узла команды с поддержкой клавиатуры и изображений
 *
 * Этот модуль предоставляет функцию для генерации Python-кода обработчика узла команды,
 * которая:
 * - Обрабатывает команды с различными типами клавиатур (inline)
 * - Поддерживает отправку изображений вместе с сообщениями
 * - Обеспечивает корректную замену переменных в тексте сообщения
 * - Обрабатывает переходы между узлами
 *
 * @module generateCommandNodeHandlerWithKeyboardAndImageSupport
 */

import { Button } from '../bot-generator';
import { formatTextForPython, generateButtonText, getParseMode, stripHtmlTags } from '../format';
import { calculateOptimalColumns } from '../Keyboard';
import { generateUniversalVariableReplacement } from '../utils';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Генерирует Python-код обработчика узла команды с поддержкой клавиатуры и изображений
 *
 * Функция генерирует Python-код, который:
 * - Обрабатывает команды с различными типами клавиатур (inline)
 * - Поддерживает отправку изображений вместе с сообщениями
 * - Обеспечивает корректную замену переменных в тексте сообщения
 * - Обрабатывает переходы между узлами
 *
 * @param targetNode - Узел конфигурации команды, содержащий настройки и данные команды
 * @param code - Строка с исходным кодом, в которую будет добавлен новый код
 * @param actualNodeId - Идентификатор текущего узла
 *
 * @returns Обновленная строка с Python-кодом
 *
 * @example
 * const targetNode = {
 *   id: "command-node-1",
 *   data: {
 *     command: "/help",
 *     messageText: "Справка по команде",
 *     keyboardType: "inline",
 *     buttons: [
 *       { text: "Назад", action: "goto", target: "main_menu" }
 *     ],
 *     imageUrl: "https://example.com/image.jpg"
 *   }
 * };
 * const result = generateCommandNodeHandlerWithKeyboardAndImageSupport(targetNode, "node-1");
 * // result теперь содержит Python-код обработчика команды
 */
export function generateCommandNodeHandlerWithKeyboardAndImageSupport(targetNode: any, actualNodeId: any) {
  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  const command = targetNode.data.command || '/start';
  const commandMessage = targetNode.data.messageText || `Выполняем команду ${command}`;
  const cleanedCommandMessage = stripHtmlTags(commandMessage);
  const formattedCommandText = formatTextForPython(cleanedCommandMessage);
  const parseMode = getParseMode(targetNode.data.formatMode);

  codeLines.push(`    # Обрабатываем узел command: ${targetNode.id}`);
  codeLines.push(`    text = ${formattedCommandText}`);

  // Применяем универсальную замену переменных
  codeLines.push('    ');
  const universalVarCodeLines: string[] = [];
  generateUniversalVariableReplacement(universalVarCodeLines, '    ');
  codeLines.push(...universalVarCodeLines);

  // Создаем inline клавиатуру для command узла если есть кнопки
  if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
      codeLines.push('    # Создаем inline клавиатуру для command узла');
      codeLines.push('    builder = InlineKeyboardBuilder()');
      targetNode.data.buttons.forEach((btn: Button, index: number) => {
          if (btn.action === "url") {
              codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))`);
          } else if (btn.action === 'goto') {
              const baseCallbackData = btn.target || btn.id || 'no_action';
              const callbackData = `${baseCallbackData}_btn_${index}`;
              codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))`);
          } else if (btn.action === 'command') {
              const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
              codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))`);
          }
      });
      // Добавляем настройку колонок для консистентности
      const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
      codeLines.push(`    builder.adjust(${columns})`);
      codeLines.push('    keyboard = builder.as_markup()');

      // ИСПРАВЛЕНИЕ: Проверяем наличие изображения в command узле
      if (targetNode.data.imageUrl && targetNode.data.imageUrl.trim() !== '' && targetNode.data.imageUrl !== 'undefined') {
          codeLines.push(`    # Узел command содержит изображение: ${targetNode.data.imageUrl}`);
          codeLines.push(`    image_url = "${targetNode.data.imageUrl}"`);
          codeLines.push('    # Отправляем сообщение command узла с изображением и клавиатурой');
          codeLines.push('    try:');
          codeLines.push(`        await bot.send_photo(callback_query.from_user.id, image_url, caption=text, reply_markup=keyboard, node_id="${actualNodeId}"${parseMode})`);
          codeLines.push('    except Exception:');
          codeLines.push(`        await callback_query.message.answer(text, reply_markup=keyboard${parseMode})`);
      } else {
          codeLines.push('    # Отправляем сообщение command узла с клавиатурой');
          codeLines.push('    try:');
          codeLines.push(`        await safe_edit_or_send(callback_query, text, reply_markup=keyboard, is_auto_transition=True${parseMode})`);
          codeLines.push('    except Exception:');
          codeLines.push(`        await callback_query.message.answer(text, reply_markup=keyboard${parseMode})`);
      }
  } else {
      // ИСПРАВЛЕНИЕ: Проверяем наличие изображения в command узле без клавиатуры
      if (targetNode.data.imageUrl && targetNode.data.imageUrl.trim() !== '' && targetNode.data.imageUrl !== 'undefined') {
          codeLines.push(`    # Узел command содержит изображение: ${targetNode.data.imageUrl}`);
          // Проверяем, является ли URL относительным путем к локальному файлу
          if (targetNode.data.imageUrl.startsWith('/uploads/')) {
              codeLines.push(`    image_path = get_upload_file_path("${targetNode.data.imageUrl}")`);
              codeLines.push(`    image_url = FSInputFile(image_path)`);
          } else {
              codeLines.push(`    image_url = "${targetNode.data.imageUrl}"`);
          }
          codeLines.push('    # Отправляем сообщение command узла с изображением');
          codeLines.push('    try:');
          codeLines.push(`        await bot.send_photo(callback_query.from_user.id, image_url, caption=text, node_id="${actualNodeId}"${parseMode})`);
          codeLines.push('    except Exception:');
          codeLines.push(`        await callback_query.message.answer(text${parseMode})`);
      } else {
          codeLines.push('    # Отправляем сообщение command узла без клавиатуры');
          codeLines.push('    try:');
          codeLines.push(`        await safe_edit_or_send(callback_query, text, is_auto_transition=True${parseMode})`);
          codeLines.push('    except Exception:');
          codeLines.push(`        await callback_query.message.answer(text${parseMode})`);
      }
  }

  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateCommandNodeHandlerWithKeyboardAndImageSupport.ts');
  return processedCode.join('\n');
}
