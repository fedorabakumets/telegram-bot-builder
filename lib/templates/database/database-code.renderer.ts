/**
 * @fileoverview Renderer для генерации кода базы данных и алиасов команд
 * @module templates/database/database-code.renderer
 */

import { renderPartialTemplate } from '../template-renderer';
import { generateDatabase } from './database.renderer';
import { NODE_TYPES } from '../../bot-generator/types/node-type.constants';

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

  const hasMessageLogging = nodes.some(n => n.type === NODE_TYPES.MESSAGE || n.type === NODE_TYPES.COMMAND);
  const hasUserIdsTable = nodes.some(n => n.data?.buttons?.some((b: any) => b.action === 'goto'));
  // hasUserDataAccess: нужны функции чтения/записи переменных — когда есть сбор ввода или условные сообщения
  const hasUserDataAccess = nodes.some(n =>
    n.data?.collectUserInput ||
    n.data?.enableConditionalMessages ||
    n.data?.saveToDatabase
  );

  // hasTelegramSettingsTable: нужна таблица user_telegram_settings — когда есть сбор tg_* переменных
  const TG_VARS = new Set(['tg_phone', 'tg_api_id', 'tg_api_hash', 'tg_session', 'tg_is_active']);
  const hasTelegramSettingsTable = nodes.some(n =>
    n.data?.collectUserInput && TG_VARS.has(n.data?.inputVariable)
  );

  let code = generateDatabase({ userDatabaseEnabled: true, hasMessageLogging, hasUserIdsTable, hasUserDataAccess, hasTelegramSettingsTable });
  code += '\n';

  const hasStartNode = nodes.some(n => n.type === NODE_TYPES.START);
  const commandNodes = nodes
    .filter(n => n.type === NODE_TYPES.COMMAND && n.data?.command)
    .map(n => ({
      command: n.data.command.replace('/', ''),
      functionName: n.data.command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_'),
    }));

  code += renderPartialTemplate('database/alias-nodes.py.jinja2', { hasStartNode, commandNodes });

  return code;
}
