/**
 * @fileoverview Генерация проверки состояния множественного выбора
 * 
 * Модуль создаёт Python-код для проверки и передачи управления
 * обработчику множественного выбора.
 * 
 * @module bot-generator/user-input/generate-multiselect-check
 */

import { multiselectcheck } from './multiselect-check';

/**
 * Генерирует Python-код для проверки множественного выбора
 * 
 * @param code - Текущий код
 * @param nodes - Массив узлов
 * @param allNodeIds - Массив всех ID узлов
 * @returns Обновлённый код
 */
export function generateMultiselectCheck(
  code: string,
  nodes: any[],
  allNodeIds: any[]
): string {
  return multiselectcheck(code, nodes, allNodeIds);
}
