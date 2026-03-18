/**
 * @fileoverview Renderer для шаблона обработчиков групп
 * @module templates/group-handlers/group-handlers.renderer
 */

import type { GroupHandlersTemplateParams } from './group-handlers.params';
import { BotGroup } from '@shared/schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код обработчиков групп.
 * Заменяет generateGroupHandlers из MediaHandler.
 */
export function generateGroupHandlers(groups: BotGroup[]): string {
  if (!groups || groups.length === 0) return '';

  const groupsConfig = groups.reduce((config, group) => {
    if (group.name && group.groupId !== null && group.groupId !== undefined) {
      config[group.name] = {
        id: group.groupId,
        isAdmin: group.isAdmin ?? 0,
        settings: group.settings || {}
      };
    }
    return config;
  }, {} as GroupHandlersTemplateParams['groupsConfig']);

  return renderPartialTemplate('group-handlers/group-handlers.py.jinja2', { groupsConfig });
}
