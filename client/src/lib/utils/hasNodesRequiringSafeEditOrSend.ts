import { BotNode } from "../bot-generator";

// Функция для проверки наличия узлов, требующих функцию safe_edit_or_send
export function hasNodesRequiringSafeEditOrSend(nodes: BotNode[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  return nodes.some(node => {
    // Проверяем типы узлов, которые используют safe_edit_or_send
    const nodeTypesRequiringSafeEditOrSend = [
      'admin_rights',
      'ban_user',
      'unban_user',
      'mute_user',
      'unmute_user',
      'kick_user',
      'promote_user',
      'demote_user'
    ];

    return nodeTypesRequiringSafeEditOrSend.includes(node.type);
  });
}