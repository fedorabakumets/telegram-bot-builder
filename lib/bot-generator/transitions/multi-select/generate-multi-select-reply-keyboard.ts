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
import { generateKeyboard } from '../../../templates/keyboard';
import { escapePythonString } from '../../format/escapePythonString';

/**
 * Параметры для генерации reply клавиатуры multi-select
 */
export interface MultiSelectReplyKeyboardParams {
  nodeId: string;
  buttons: Button[];
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
  const { nodeId, buttons, resizeKeyboard, oneTimeKeyboard } = params;
  
  let code = '';
  code += `${indent}# Создаем reply клавиатуру с поддержкой множественного выбора\n`;
  code += `${indent}builder = ReplyKeyboardBuilder()\n`;
  code += `${indent}\n`;
  
  // Разделяем кнопки на опции выбора и обычные кнопки
  const selectionButtons = buttons.filter((button: { action: string; }) => button.action === 'selection');
  const completeButton = buttons.find((button: { action: string; }) => button.action === 'complete');
  const otherButtons = buttons.filter((button: { action: string; }) => button.action !== 'selection' && button.action !== 'complete');

  // Добавляем кнопки выбора с отметками о состоянии
  selectionButtons.forEach((button: { text: any; }, index: number) => {
    const escapedText = button.text.replace(/'/g, "\\'");
    code += `${indent}# Кнопка выбора ${index + 1}: ${button.text}\n`;
    code += `${indent}builder.add(KeyboardButton(text=f"{'✅ ' if '${escapedText}' in user_data[user_id]['multi_select_${nodeId}'] else ''}${escapedText}"))\n`;
  });

  // Добавляем кнопку "Готово" из данных узла
  if (completeButton) {
    code += `${indent}builder.add(KeyboardButton(text=${escapePythonString(completeButton.text)}))\n`;
  }

  // Добавляем обычные кнопки
  otherButtons.forEach((btn: Button) => {
    code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
  });

  // Вычисляем оптимальное количество колонок (2 для множественного выбора)
  code += `${indent}builder.adjust(2)\n`;

  const resize = toPythonBoolean(resizeKeyboard !== false);
  const oneTime = toPythonBoolean(oneTimeKeyboard === true);
  code += `${indent}keyboard = builder.as_markup(resize_keyboard=${resize}, one_time_keyboard=${oneTime})\n`;

  return code;
}
