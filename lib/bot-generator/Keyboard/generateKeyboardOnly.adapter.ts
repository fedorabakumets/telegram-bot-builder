/**
 * @fileoverview Адаптер для генерации ТОЛЬКО кода клавиатуры через Jinja2 шаблон
 *
 * Модуль создаёт Python-код для генерации клавиатуры без отправки сообщения.
 * Используется когда сообщение уже было отправлено отдельно (например, с изображением).
 *
 * @module bot-generator/Keyboard/generateKeyboardOnly.adapter
 */

import type { Node } from '@shared/schema';
import { generateKeyboard } from '../../templates/keyboard';
import type { KeyboardTemplateParams } from '../../templates/keyboard';
import { generatorLogger } from '../core/generator-logger';

/**
 * Генерирует ТОЛЬКО код клавиатуры через Jinja2 шаблон (без отправки сообщения)
 *
 * @param node - Узел для генерации клавиатуры
 * @returns Сгенерированный код клавиатуры (только создание, без отправки)
 */
export function generateKeyboardOnlyAdapter(node: Node): string {
  let code = '';

  // Проверяем наличие кнопок
  const hasButtons = node.data.keyboardType !== 'none' && node.data.buttons && node.data.buttons.length > 0;

  if (!hasButtons) {
    return code; // Нет кнопок - возвращаем пустую строку
  }

  // Подготовка параметров для Jinja2 шаблона
  const params: KeyboardTemplateParams = {
    keyboardType: node.data.keyboardType as 'inline' | 'reply' | 'none',
    buttons: node.data.buttons,
    keyboardLayout: node.data.keyboardLayout,
    oneTimeKeyboard: node.data.oneTimeKeyboard,
    resizeKeyboard: node.data.resizeKeyboard,
    allowMultipleSelection: node.data.allowMultipleSelection,
    multiSelectVariable: node.data.multiSelectVariable,
    nodeId: node.id,
    indentLevel: '    ',
    parseMode: node.data.formatMode === 'markdown' ? 'markdown' : node.data.formatMode === 'html' ? 'html' : 'none',
  };

  if (node.data.allowMultipleSelection) {
    const completeButton = node.data.buttons?.find((btn: any) => btn.action === 'complete');
    if (completeButton) {
      params.completeButton = {
        text: completeButton.text,
        target: completeButton.target,
      };
    }
  }

  try {
    const generatedCode = generateKeyboard(params);
    // Удаляем строки с отправкой сообщения, оставляем только создание клавиатуры
    const lines = generatedCode.split('\n');
    const keyboardOnlyLines = lines.filter(line => {
      // Пропускаем строки с отправкой сообщений
      if (line.includes('await message.answer(') || line.includes('await bot.send_photo(')) {
        return false;
      }
      // Пропускаем строки с инициализацией множественного выбора (они добавляются отдельно)
      if (line.includes('user_data[') && line.includes('multi_select_')) {
        return false;
      }
      return true;
    });

    return keyboardOnlyLines.join('\n');
  } catch (error) {
    generatorLogger.error('Ошибка генерации клавиатуры (only) через Jinja2:', error);
    throw error;
  }
}
