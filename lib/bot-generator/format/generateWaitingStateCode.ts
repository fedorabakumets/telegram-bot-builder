/**
 * @fileoverview Утилита для генерации кода установки состояния ожидания ввода
 *
 * Делегирует генерацию шаблону user-input/user-input.py.jinja2
 *
 * @module generateWaitingStateCode
 */

import { generatorLogger } from '../core/generator-logger';
import { generateUserInputFromNode } from '../../templates/user-input';

/**
 * Генерирует код установки waiting_for_input через Jinja2-шаблон.
 *
 * @param node - Узел с настройками ввода
 * @param indentLevel - Уровень отступа (по умолчанию '    ')
 * @param _userIdSource - Не используется (оставлен для обратной совместимости сигнатуры)
 * @returns Сгенерированный Python-код
 */
export function generateWaitingStateCode(
  node: any,
  indentLevel: string = '    ',
  _userIdSource: string = 'message.from_user.id'
): string {
  if (!node || !node.data) {
    generatorLogger.warn('generateWaitingStateCode: node или node.data не определены');
    return '';
  }
  return generateUserInputFromNode(node, indentLevel);
}
