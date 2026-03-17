/**
 * @fileoverview Тестовые данные для шаблона admin-rights
 * @module templates/admin-rights/admin-rights.fixture
 */

import type { AdminRightsTemplateParams } from './admin-rights.params';

export const fixtureAdminRights: AdminRightsTemplateParams = {
  nodeId: 'admin_rights_node_1',
  safeName: 'admin_rights_node_1',
  messageText: '⚙️ Управление правами администратора',
  command: 'admin_rights',
};

export const fixtureAdminRightsCustom: AdminRightsTemplateParams = {
  nodeId: 'ar_custom',
  safeName: 'ar_custom',
  messageText: '🔧 Настройка прав',
  command: 'set_rights',
};
