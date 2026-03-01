/**
 * @fileoverview Генерация reply клавиатуры для множественного выбора
 * 
 * Модуль создаёт Python-код для генерации reply клавиатуры
 * с поддержкой множественного выбора и кнопкой "Готово".
 * 
 * @module bot-generator/transitions/multi-select/generate-multi-select-reply-keyboard
 */

import { Button } from '../../types';
import { generateButtonText, toPythonBoolean } from '../../format';
import { getAdjustCode } from '../../Keyboard/getAdjustCode';

/**
 * Параметры для генерации reply клавиатуры multi-select
 */
export interface MultiSelectReplyKeyboardParams {
  nodeId: string;
  buttons: Button[];
  continueButtonText?: string;
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
}

/**
 * Генерирует Python-код для reply клавиатуры множественного выбора
 * 
 * @param params - Параметры клавиатуры
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMultiSelectReplyKeyboard(
  params: MultiSelectReplyKeyboardParams,
  indent: string = '    '
): string {
  const { nodeId, buttons, continueButtonText, resizeKeyboard, oneTimeKeyboard } = params;
  
  let code = '';
  code += `${indent}# Создаем reply клавиатуру с поддержкой множественного выбора\n`;
  code += `${indent}builder = ReplyKeyboardBuilder()\n`;
  code += `${indent}\n`;
  
  // Разделяем кнопки на опции выбора и обычные кнопки
  const selectionButtons = buttons.filter((button: { action: string; }) => button.action === 'selection');
  const regularButtons = buttons.filter((button: { action: string; }) => button.action !== 'selection');
  
  // Добавляем кнопки выбора с отметками о состоянии
  selectionButtons.forEach((button: { text: any; }, index: number) => {
    code += `${indent}# Кнопка выбора ${index + 1}: ${button.text}\n`;
    code += `${indent}builder.add(KeyboardButton(text=f"{'✅ ' if '${button.text}' in user_data[user_id]['multi_select_${nodeId}'] else ''}${button.text}"))\n`;
  });
  
  // Добавляем кнопку "Готово"
  if (selectionButtons.length > 0) {
    const text = continueButtonText || 'Готово';
    code += `${indent}builder.add(KeyboardButton(text="${text}"))\n`;
  }
  
  // Добавляем обычные кнопки
  regularButtons.forEach((btn: Button) => {
    code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
  });
  
  // Вычисляем оптимальное количество колонок
  const totalButtons = selectionButtons.length + regularButtons.length + (selectionButtons.length > 0 ? 1 : 0);
  const multiSelectNodeData = { allowMultipleSelection: true };
  const allButtonsForCalculation = Array(totalButtons).fill({});
  code += `${indent}${getAdjustCode(allButtonsForCalculation, multiSelectNodeData)}\n`;
  
  const resize = toPythonBoolean(resizeKeyboard !== false);
  const oneTime = toPythonBoolean(oneTimeKeyboard === true);
  code += `${indent}keyboard = builder.as_markup(resize_keyboard=${resize}, one_time_keyboard=${oneTime})\n`;
  
  return code;
}
