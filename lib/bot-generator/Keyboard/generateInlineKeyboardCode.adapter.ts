/**
 * @fileoverview Адаптер для генерации inline клавиатуры через Jinja2 шаблон
 *
 * Обеспечивает обратную совместимость со старым API generateInlineKeyboardCode
 * но использует Jinja2 шаблон keyboard.py.jinja2 для генерации кода.
 *
 * @module bot-generator/Keyboard/generateInlineKeyboardCode.adapter
 */

import { generateKeyboard } from '../../templates/keyboard';
import type { KeyboardTemplateParams } from '../../templates/keyboard';
import { generateUniqueShortId } from '../format/generateUniqueShortId';

/**
 * Адаптер для генерации inline клавиатуры через Jinja2 шаблон
 *
 * @param buttons - Массив кнопок
 * @param indentLevel - Уровень отступа
 * @param nodeId - ID узла
 * @param nodeData - Данные узла (включая keyboardLayout)
 * @param allNodeIds - Все идентификаторы узлов
 * @returns Python код клавиатуры
 */
export function generateInlineKeyboardCodeAdapter(
  buttons: any[],
  indentLevel: string,
  nodeId?: string,
  nodeData?: any,
  allNodeIds?: string[]
): string {
  if (!buttons || buttons.length === 0) {
    let code = '';
    code += `${indentLevel}keyboard = None  # Нет кнопок, клавиатура не нужна\n`;
    code += `${indentLevel}keyboardHTML = ''  # Заглушка для совместимости\n`;
    return code;
  }

  // Проверяем keyboardType и делегируем на правильную функцию
  const keyboardType = nodeData?.keyboardType || 'inline';
  if (keyboardType === 'reply') {
    // Для reply клавиатуры вызываем специальную функцию
    const { generateReplyKeyboardCodeAdapter } = require('./generateReplyKeyboardCode.adapter');
    return generateReplyKeyboardCodeAdapter(buttons, indentLevel, nodeId, nodeData);
  }

  // Пре-вычисляем короткий ID для узла
  const shortNodeId = nodeId && allNodeIds ? generateUniqueShortId(nodeId, allNodeIds) : (nodeId || '');

  // Подготовка параметров для Jinja2 шаблона
  const params: KeyboardTemplateParams = {
    keyboardType: 'inline',
    buttons: buttons.map((btn) => ({
      id: btn.id || btn.target || 'btn',
      text: btn.text,
      action: btn.action,
      target: btn.target,
      url: btn.url,
      // Пре-вычисляем короткий ID кнопки для callback_data
      shortButtonId: (btn.target || btn.id || 'btn').slice(-8),
    })),
    nodeId,
    allNodeIds: allNodeIds || [],
    indentLevel,
    allowMultipleSelection: nodeData?.allowMultipleSelection || false,
    multiSelectVariable: nodeData?.multiSelectVariable,
    keyboardLayout: nodeData?.keyboardLayout,
    parseMode: nodeData?.formatMode === 'markdown' ? 'markdown' : nodeData?.formatMode === 'html' ? 'html' : 'none',
    shortNodeId,
  };

  // Добавляем кнопку завершения для множественного выбора
  if (nodeData?.allowMultipleSelection) {
    const completeButton = buttons.find((btn: any) => btn.action === 'complete');
    if (completeButton) {
      params.completeButton = {
        text: completeButton.text,
        target: completeButton.target,
      };
    }
  }

  try {
    const generatedCode = generateKeyboard(params);
    // Добавляем переменную keyboardHTML для совместимости
    return generatedCode + `${indentLevel}keyboardHTML = ''  # Заглушка для совместимости\n`;
  } catch (error) {
    throw new Error(`Ошибка генерации inline клавиатуры через Jinja2: ${error instanceof Error ? error.message : String(error)}`);
  }
}
