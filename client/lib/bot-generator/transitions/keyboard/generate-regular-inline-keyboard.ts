/**
 * @fileoverview Генерация обычной inline клавиатуры
 * 
 * Модуль создаёт Python-код для генерации inline клавиатуры
 * для узлов без множественного выбора.
 * 
 * @module bot-generator/transitions/keyboard/generate-regular-inline-keyboard
 */

import { Button } from '../../types';
import { generateButtonText } from '../format';
import { calculateOptimalColumns } from '../Keyboard';

/**
 * Параметры для генерации inline клавиатуры
 */
export interface RegularInlineKeyboardParams {
  buttons: Button[];
  nodeData?: any;
}

/**
 * Генерирует Python-код для обычной inline клавиатуры
 * 
 * @param params - Параметры клавиатуры
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateRegularInlineKeyboard(
  params: RegularInlineKeyboardParams,
  indent: string = '    '
): string {
  const { buttons, nodeData } = params;
  
  let code = '';
  code += `${indent}# Создаем inline клавиатуру\n`;
  code += `${indent}builder = InlineKeyboardBuilder()\n`;
  
  buttons.forEach((btn: Button, index: number) => {
    if (btn.action === "goto" && btn.target) {
      const btnCallbackData = `${btn.target}_btn_${index}`;
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
    } else if (btn.action === "url") {
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
    } else if (btn.action === "command" && btn.target) {
      const commandCallback = `cmd_${btn.target.replace('/', '')}`;
      code += `${indent}# Кнопка команды: ${btn.text} -> ${btn.target}\n`;
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
    } else if (btn.action === "selection") {
      // Добавляем поддержку кнопок выбора для обычных узлов
      const callbackData = `multi_select_${nodeData?.id || 'node'}_${btn.target || btn.id}`;
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
    }
  });
  
  // Автоматическое распределение колонок для обычных кнопок
  const columns = calculateOptimalColumns(buttons, nodeData || {});
  code += `${indent}builder.adjust(${columns})\n`;
  code += `${indent}keyboard = builder.as_markup()\n`;
  
  return code;
}
