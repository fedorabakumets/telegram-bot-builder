/**
 * @fileoverview Генерация определения текста кнопки
 *
 * Модуль создаёт Python-код для определения текста нажатой кнопки
 * по callback_data, особенно когда несколько кнопок ведут к одному узлу.
 *
 * @module bot-generator/transitions/button/generate-button-text-detection
 */

import { Button } from '../../../bot-generator';
import { escapePythonString } from '../../format/escapePythonString';

/**
 * Параметры для генерации определения текста кнопки
 */
export interface ButtonTextDetectionParams {
  nodeId: string;
  buttonsToTargetNode: Button[];
}

/**
 * Генерирует Python-код для определения текста кнопки
 *
 * @param params - Параметры определения
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateButtonTextDetection(
  params: ButtonTextDetectionParams,
  indent: string = '    '
): string {
  const { nodeId, buttonsToTargetNode } = params;

  let code = '';

  if (buttonsToTargetNode.length > 1) {
    // Несколько кнопок ведут к одному узлу - создаем логику определения по callback_data
    code += `${indent}# Определяем текст кнопки по callback_data\n`;
    code += `${indent}button_display_text = "Неизвестная кнопка"\n`;

    buttonsToTargetNode.forEach((button: Button, index: number) => {
      // Проверяем по суффиксу _btn_index в callback_data
      code += `${indent}if callback_query.data.endswith("_btn_${index}"):\n`;
      code += `${indent}    button_display_text = ${escapePythonString(button.text)}\n`;
    });

    // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: ищем кнопку по точному соответствию callback_data с nodeId
    code += `${indent}# Дополнительная проверка по точному соответствию callback_data\n`;
    buttonsToTargetNode.forEach((button: Button) => {
      code += `${indent}if callback_query.data == "${nodeId}":\n`;
      // Для случая когда несколько кнопок ведут к одному узлу, используем первую найденную
      code += `${indent}    button_display_text = ${escapePythonString(button.text)}\n`;
    });
  } else {
    const button = buttonsToTargetNode[0];
    if (button) {
      code += `${indent}button_display_text = ${escapePythonString(button.text)}\n`;
    } else {
      code += `${indent}button_display_text = "Кнопка ${nodeId}"\n`;
    }
  }

  return code;
}
