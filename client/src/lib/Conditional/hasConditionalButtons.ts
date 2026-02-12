/**
 * @fileoverview Модуль для проверки наличия условных кнопок в узлах бота
 * 
 * Этот файл содержит функцию, которая проверяет, содержат ли узлы бота
 * условные сообщения с кнопками, связанными с переменными пользователя.
 * Условные кнопки определяются по наличию поля action со значением 'command'
 * и переменной (variableName или variableNames) в условных сообщениях.
 * 
 * @module hasConditionalButtons
 */

import { Button } from "../bot-generator";
import { BotNode } from "../bot-generator";

// Функция для проверки наличия условных кнопок с callback_data формата "conditional_"
export function hasConditionalButtons(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  return nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;

    return conditions.some((cond: any) => {
      if (!cond.buttons || !Array.isArray(cond.buttons)) return false;
      // Проверяем, есть ли кнопки команд в условных сообщениях с переменными
      return cond.buttons.some((button: Button) => button.action === 'command' && (cond.variableName || cond.variableNames)
      );
    });
  });
}
