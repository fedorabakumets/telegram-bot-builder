/**
 * @fileoverview Renderer для генерации кода базы данных и алиасов команд
 * @module templates/database/database-code.renderer
 */

import { renderPartialTemplate } from '../template-renderer';
import { generateDatabase } from './database.renderer';

/**
 * Генерирует код базы данных + алиасы обработчиков команд
 * @param userDatabaseEnabled - Включена ли БД
 * @param nodes - Массив узлов бота
 * @returns Сгенерированный Python код
 */
export function generateDatabaseCode(userDatabaseEnabled: boolean, nodes: any[]): string {
  if (!userDatabaseEnabled) {
    return '';
  }

  const hasMessageLogging = nodes.some(n => n.type === 'message' || n.type === 'command');
  const hasUserIdsTable = nodes.some(n => n.data?.buttons?.some((b: any) => b.action === 'goto'));

  let code = generateDatabase({ userDatabaseEnabled: true, hasMessageLogging, hasUserIdsTable });
  code += '\n';

  const hasStartNode = nodes.some(n => n.type === 'start');
  const commandNodes = nodes
    .filter(n => n.type === 'command' && n.data?.command)
    .map(n => ({
      command: n.data.command.replace('/', ''),
      functionName: n.data.command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_'),
    }));

  code += renderPartialTemplate('database/alias-nodes.py.jinja2', { hasStartNode, commandNodes });

  return code;
}
