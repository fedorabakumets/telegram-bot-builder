/**
 * @fileoverview Генерация импортов для команд бота
 * Функции для генерации импортов Command и CommandStart
 */

import { Button } from '../types';

/** Параметры для генерации импортов */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: any[];
}

/**
 * Генерирует импорты для команд и стартовых узлов
 * @param options - Параметры генерации
 * @returns {string} Python код импортов
 */
export const generateCommandImports = (options: ImportGeneratorOptions): string => {
  const { nodes } = options;
  
  const hasCommandNodes = nodes.some(
    (node) =>
      node.type === 'command' ||
      (node.data.buttons &&
        node.data.buttons.some((btn: Button) => btn.action === 'command'))
  );
  
  const hasStartNodes = nodes.some((node) => node.type === 'start');

  if (!hasCommandNodes && !hasStartNodes) {
    return '';
  }

  let imports = '';
  if (hasStartNodes) {
    imports += 'from aiogram.filters import CommandStart\n';
  }
  if (hasCommandNodes) {
    imports += 'from aiogram.filters import Command\n';
  }
  return imports;
};
