import { BotGroup } from '@shared/schema';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Функция для генерации конфигурации подключенных групп
 * @param groups - Массив групп
 * @returns Строка с кодом конфигурации групп, если они есть, иначе пустая строка
 */
export function generateGroupsConfiguration(groups: BotGroup[]): string {
  if (!groups || groups.length === 0) {
    return '';
  }

  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];
  
  codeLines.push('# Подключенные группы');
  codeLines.push('CONNECTED_GROUPS = {');
  groups.forEach((group, index) => {
    const groupId = group.groupId || 'None';
    const isLast = index === groups.length - 1;
    codeLines.push(`    "${group.name}": {`);
    codeLines.push(`        "id": ${groupId === 'None' ? 'None' : `"${groupId}"`},`);
    codeLines.push(`        "url": "${group.url}",`);
    codeLines.push(`        "is_admin": ${group.isAdmin ? 'True' : 'False'},`);
    codeLines.push(`        "chat_type": "${group.chatType || 'group'}",`);
    if (group.adminRights) {
      codeLines.push(`        "admin_rights": ${JSON.stringify(group.adminRights, null, 12).replace(/"/g, "'")},`);
    }
    codeLines.push(`        "description": "${group.description || ''}"`);
    codeLines.push(`    }${isLast ? '' : ','}`);
  });
  codeLines.push('}');
  codeLines.push('');

  // Применяем автоматическое добавление комментариев ко всему коду
  // Функция автоматически определяет имя файла
  const processedCode = processCodeWithAutoComments(codeLines, 'generateGroupsConfiguration.ts');
  
  return processedCode.join('\n');
}
