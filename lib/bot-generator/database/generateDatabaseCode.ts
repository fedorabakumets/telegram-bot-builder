/**
 * @fileoverview Модуль для генерации кода, связанного с базой данных.
 *              Содержит функции для инициализации, сохранения, обновления и получения данных пользователей.
 *              Также включает вспомогательные функции для работы с переменными и логирования.

 */

import { AliasNodes } from './AliasNodes';
import { generateSaveToDatabaseTable } from './generateSaveToDatabaseTable';
import { generateDatabase } from '../../templates/database/database.renderer';

/**
 * Вспомогательная функция для генерации кода, связанного с базой данных
 * @param {boolean} userDatabaseEnabled - Флаг, указывающий, включена ли база данных
 * @param {any[]} nodes - Массив узлов для генерации кода
 * @returns {string} Сгенерированный код для работы с базой данных
 */
export function generateDatabaseCode(userDatabaseEnabled: boolean, nodes: any[]): string {
  if (!userDatabaseEnabled) {
    return '';
  }

  // Определяем какие функции нужны
  const hasMessageLogging = nodes.some(n => n.type === 'message' || n.type === 'command');
  const hasUserIdsTable = nodes.some(n => n.data?.buttons?.some((b: any) => b.action === 'goto'));

  // Базовые функции через Jinja2
  let code = generateDatabase({
    userDatabaseEnabled: true,
    hasMessageLogging,
    hasUserIdsTable,
  });

  code += '\n';

  // Алиасы для обработчиков команд
  const aliasCodeLines: string[] = [];
  AliasNodes(aliasCodeLines, nodes);
  code += aliasCodeLines.join('\n');

  code += '\n';

  // Сложные функции остаются в TS
  code += generateSaveToDatabaseTable({
    variableName: 'test_var',
    valueExpression: 'test_value',
  });

  return code;
}
