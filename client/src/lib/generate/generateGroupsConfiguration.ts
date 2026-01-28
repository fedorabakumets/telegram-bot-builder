import { BotGroup } from '@shared/schema';

/**
 * Функция для генерации конфигурации подключенных групп
 * @param groups - Массив групп
 * @returns Строка с кодом конфигурации групп, если они есть, иначе пустая строка
 */
export function generateGroupsConfiguration(groups: BotGroup[]): string {
  if (!groups || groups.length === 0) {
    return '';
  }

  let code = '';
  code += '# Подключенные группы\n';
  code += 'CONNECTED_GROUPS = {\n';
  groups.forEach((group, index) => {
    const groupId = group.groupId || 'None';
    const isLast = index === groups.length - 1;
    code += `    "${group.name}": {\n`;
    code += `        "id": ${groupId === 'None' ? 'None' : `"${groupId}"`},\n`;
    code += `        "url": "${group.url}",\n`;
    code += `        "is_admin": ${group.isAdmin ? 'True' : 'False'},\n`;
    code += `        "chat_type": "${group.chatType || 'group'}",\n`;
    if (group.adminRights) {
      code += `        "admin_rights": ${JSON.stringify(group.adminRights, null, 12).replace(/"/g, "'")},\n`;
    }
    code += `        "description": "${group.description || ''}"\n`;
    code += `    }${isLast ? '' : ','}\n`;
  });
  code += '}\n\n';

  return code;
}
