/**
 * @fileoverview Генерация inline клавиатуры для множественного выбора
 * 
 * Модуль создаёт Python-код для генерации inline клавиатуры
 * с поддержкой множественного выбора и кнопкой "Готово".
 * 
 * @module bot-generator/transitions/multi-select/generate-multi-select-inline-keyboard
 */

import { Button } from '../../types';
import { generateButtonText, generateUniqueShortId } from '../format';

/**
 * Параметры для генерации inline клавиатуры multi-select
 */
export interface MultiSelectInlineKeyboardParams {
  nodeId: string;
  buttons: Button[];
  allNodeIds: any[];
}

/**
 * Генерирует Python-код для inline клавиатуры множественного выбора
 * 
 * @param params - Параметры клавиатуры
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMultiSelectInlineKeyboard(
  params: MultiSelectInlineKeyboardParams,
  indent: string = '    '
): string {
  const { nodeId, buttons, allNodeIds } = params;
  
  let code = '';
  code += `${indent}# Создаем inline клавиатуру с поддержкой множественного выбора\n`;
  code += `${indent}builder = InlineKeyboardBuilder()\n`;
  code += `${indent}\n`;
  
  // Разделяем кнопки на опции выбора и обычные кнопки
  const selectionButtons = buttons.filter((button: { action: string; }) => button.action === 'selection');
  const regularButtons = buttons.filter((button: { action: string; }) => button.action !== 'selection');
  
  // Добавляем кнопки выбора с отметками о состоянии
  selectionButtons.forEach((button: Button, index: number) => {
    const shortNodeId = generateUniqueShortId(nodeId, allNodeIds || []);
    const shortTarget = (button.target || button.id || 'btn').slice(-8);
    const callbackData = `ms_${shortNodeId}_${shortTarget}`;
    
    code += `${indent}# Кнопка выбора ${index + 1}: ${button.text}\n`;
    code += `${indent}logging.info(f"🔘 Создаем кнопку: ${button.text} -> ${callbackData}")\n`;
    code += `${indent}builder.add(InlineKeyboardButton(text=f"{'✅ ' if '${button.text}' in user_data[user_id]['multi_select_${nodeId}'] else ''}${button.text}", callback_data="${callbackData}"))\n`;
  });
  
  // Добавляем обычные кнопки (navigation и другие)
  regularButtons.forEach((btn: Button, index: number) => {
    if (btn.action === "goto" && btn.target) {
      const btnCallbackData = `${btn.target}_btn_${index}`;
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
    } else if (btn.action === "url") {
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
    } else if (btn.action === "command" && btn.target) {
      const commandCallback = `cmd_${btn.target.replace('/', '')}`;
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
    }
  });
  
  // Добавляем кнопку "Готово" для множественного выбора
  if (selectionButtons.length > 0) {
    const shortNodeIdDone = String(nodeId).slice(-10).replace(/^_+/, '');
    const doneCallbackData = `done_${shortNodeIdDone}`;
    
    code += `${indent}# Кнопка "Готово" для множественного выбора\n`;
    code += `${indent}logging.info(f"🔘 Создаем кнопку Готово -> ${doneCallbackData}")\n`;
    code += `${indent}builder.add(InlineKeyboardButton(text="Готово", callback_data="${doneCallbackData}"))\n`;
  }
  
  // Используем фиксированное количество колонок для постоянного расположения
  code += `${indent}# ИСПРАВЛЕНИЕ: Используем фиксированное количество колонок\n`;
  code += `${indent}builder.adjust(2)\n`;
  code += `${indent}keyboard = builder.as_markup()\n`;
  
  return code;
}
