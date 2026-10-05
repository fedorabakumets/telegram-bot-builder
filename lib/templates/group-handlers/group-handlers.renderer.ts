/**
 * @fileoverview Renderer для шаблона обработчиков групп
 * @module templates/group-handlers/group-handlers.renderer
 */

import { BotGroup } from '@shared/schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код обработчиков групп.
 * Заменяет generateGroupHandlers из MediaHandler.
 * @param groups - Подключённые группы
 * @param botRuntimeRole - Не генерировать запись в group_activity
 */
export function generateGroupHandlers(groups: BotGroup[], botRuntimeRole = false): string {
  if (!groups || groups.length === 0) return '';

  const groupsConfig: Record<string, { id: string; isAdmin?: number; settings?: Record<string, unknown> }> = {};
  for (const group of groups) {
    if (group.name && group.groupId !== null && group.groupId !== undefined) {
      groupsConfig[group.name] = {
        id: group.groupId,
        isAdmin: group.isAdmin ?? 0,
        settings: (group.settings as Record<string, unknown>) || {}
      };
    }
  }

  return renderPartialTemplate('group-handlers/group-handlers.py.jinja2', { groupsConfig, botRuntimeRole });
}
