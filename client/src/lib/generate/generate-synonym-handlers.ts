import { Node } from '@shared/schema';
import { generateSynonymHandler, generateMessageSynonymHandler } from '../Synonyms';
import { generateUserManagementSynonymHandler } from '../UserHandler';

/**
 * Генерирует обработчики синонимов для узлов
 * @param nodes - Массив узлов для генерации обработчиков синонимов
 * @returns Сгенерированный код обработчиков синонимов
 */
export function generateSynonymHandlers(nodes: Node[]): string {
  // Типы узлов, требующие специального обработчика управления пользователями
  const userManagementTypes = new Set([
    'ban_user', 'unban_user', 'mute_user', 'unmute_user',
    'kick_user', 'promote_user', 'demote_user', 'admin_rights'
  ]);

  const nodesWithSynonyms = nodes.filter(node =>
    node.data.synonyms && node.data.synonyms.length > 0
  );

  // Если нет узлов с синонимами, возвращаем пустую строку
  if (nodesWithSynonyms.length === 0) return '';

  let synonymCode = '\n# Обработчики синонимов\n';

  for (const node of nodesWithSynonyms) {
    for (const synonym of node.data.synonyms) {
      // Маркеры для идентификации синонимов того же узла
      synonymCode += `# @@NODE_START:${node.id}@@\n`;

      if (node.type === 'start' || node.type === 'command') {
        synonymCode += generateSynonymHandler(node, synonym);
      } else if (userManagementTypes.has(node.type)) {
        synonymCode += generateUserManagementSynonymHandler(node, synonym);
      } else {
        synonymCode += generateMessageSynonymHandler(node, synonym);
      }

      synonymCode += `# @@NODE_END:${node.id}@@\n`;
    }
  }

  return synonymCode;
}