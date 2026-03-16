/**
 * @fileoverview Адаптер для генерации reply клавиатуры через Jinja2 шаблон
 *
 * Обеспечивает обратную совместимость со старым API generateReplyKeyboardCode
 * но использует Jinja2 шаблон keyboard.py.jinja2 для генерации кода.
 *
 * @module bot-generator/Keyboard/generateReplyKeyboardCode.adapter
 */

import { generateKeyboard } from '../../templates/keyboard';
import type { KeyboardTemplateParams } from '../../templates/keyboard';

/**
 * Адаптер для генерации reply клавиатуры через Jinja2 шаблон
 *
 * @param buttons - Массив кнопок
 * @param indentLevel - Уровень отступа
 * @param nodeId - ID узла
 * @param nodeData - Данные узла (включая keyboardLayout)
 * @returns Python код клавиатуры
 */
export function generateReplyKeyboardCodeAdapter(
  buttons: any[],
  indentLevel: string,
  _nodeId?: string,
  nodeData?: any
): string {
  if (!buttons || buttons.length === 0) {
    let code = '';
    code += `${indentLevel}keyboard = None  # Нет кнопок, клавиатура не нужна\n`;
    code += `${indentLevel}keyboardHTML = ''  # Заглушка для совместимости\n`;
    return code;
  }

  // Подготовка параметров для Jinja2 шаблона
  const params: KeyboardTemplateParams = {
    keyboardType: 'reply',
    buttons: buttons.map((btn) => ({
      id: btn.id || btn.target || 'btn',
      text: btn.text,
      action: btn.action,
      target: btn.target,
      requestContact: btn.requestContact,
      requestLocation: btn.requestLocation,
    })),
    indentLevel,
    oneTimeKeyboard: nodeData?.oneTimeKeyboard || false,
    resizeKeyboard: nodeData?.resizeKeyboard !== false,
    keyboardLayout: nodeData?.keyboardLayout,
    allowMultipleSelection: nodeData?.allowMultipleSelection || false,
    multiSelectVariable: nodeData?.multiSelectVariable,
  };

  try {
    const generatedCode = generateKeyboard(params);
    // Добавляем переменную keyboardHTML для совместимости
    return generatedCode + `${indentLevel}keyboardHTML = ''  # Заглушка для совместимости\n`;
  } catch (error) {
    throw new Error(`Ошибка генерации reply клавиатуры через Jinja2: ${error instanceof Error ? error.message : String(error)}`);
  }
}
