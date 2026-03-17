/**
 * @fileoverview Renderer для шаблона admin-rights
 * @module templates/admin-rights/admin-rights.renderer
 */

import type { Node } from '@shared/schema';
import type { AdminRightsTemplateParams } from './admin-rights.params';
import { adminRightsParamsSchema } from './admin-rights.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python обработчик admin_rights из параметров (низкоуровневый API)
 */
export function generateAdminRightsHandler(params: AdminRightsTemplateParams): string {
  const validated = adminRightsParamsSchema.parse(params);
  return renderPartialTemplate('admin-rights/admin-rights.py.jinja2', validated);
}

/**
 * Генерирует Python обработчик admin_rights из узла графа (высокоуровневый API)
 */
export function generateAdminRightsFromNode(node: Node): string {
  return generateAdminRightsHandler(nodeToAdminRightsParams(node));
}

/**
 * Собирает параметры AdminRightsTemplateParams из узла графа
 */
export function nodeToAdminRightsParams(node: Node): AdminRightsTemplateParams {
  return {
    nodeId: node.id,
    safeName: node.id.replace(/[^a-zA-Z0-9_]/g, '_'),
    messageText: node.data.messageText || '⚙️ Управление правами администратора',
    command: (node.data.command || '/admin_rights').replace('/', ''),
  };
}
