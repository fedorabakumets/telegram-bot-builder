/**
 * @fileoverview Renderer для генерации кода базы данных и алиасов command_trigger
 * @module templates/database/database-code.renderer
 */

import { renderPartialTemplate } from '../template-renderer';
import { generateDatabase } from './database.renderer';
import { NODE_TYPES } from '../../bot-generator/types/node-type.constants';

/**
 * Генерирует код базы данных + алиасы обработчиков command_trigger
 * @param userDatabaseEnabled - Включена ли база пользователей
 * @param nodes - Узлы сценария
 * @param botRuntimeRole - Убрать CREATE TABLE и выставить app.project_id / app.token_id
 */
export function generateDatabaseCode(
  userDatabaseEnabled: boolean,
  nodes: any[],
  botRuntimeRole = false,
): string {
  if (!userDatabaseEnabled) {
    return '';
  }

  const hasMessageLogging = nodes.some(n => n.type === NODE_TYPES.MESSAGE);
  const hasUserDataAccess = nodes.some(n =>
    n.data?.collectUserInput ||
    n.data?.enableConditionalMessages ||
    n.data?.saveToDatabase
  );

  const TG_VARS = new Set(['tg_phone', 'tg_api_id', 'tg_api_hash', 'tg_session', 'tg_is_active']);
  const hasTelegramSettingsTable = nodes.some(n =>
    n.data?.collectUserInput && TG_VARS.has(n.data?.inputVariable)
  );

  let code = generateDatabase({
    userDatabaseEnabled: true,
    hasMessageLogging,
    hasUserDataAccess,
    hasTelegramSettingsTable,
    botRuntimeRole,
  });
  code += '\n';

  const commandNodes = nodes
    .filter(n => n.type === 'command_trigger' && n.data?.command)
    .map(n => ({
      command: n.data.command.replace('/', ''),
      functionName: n.data.command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_'),
      handlerName: `command_trigger_${String(n.id).replace(/[^a-zA-Z0-9_]/g, '_')}_handler`,
    }));

  code += renderPartialTemplate('database/alias-nodes.py.jinja2', { commandNodes });

  return code;
}
