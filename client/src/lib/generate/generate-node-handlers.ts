import { Node } from '@shared/schema';
import { generateStartHandler, generateCommandHandler } from '../CommandHandler';
import { generateStickerHandler, generateVoiceHandler, generateAnimationHandler, generateLocationHandler, generateContactHandler } from '../MediaHandler';
import {
  generateBanUserHandler,
  generateUnbanUserHandler,
  generateMuteUserHandler,
  generateUnmuteUserHandler,
  generateKickUserHandler,
  generatePromoteUserHandler,
  generateAdminRightsHandler,
  generateDemoteUserHandler
} from '../UserHandler';
import { generateUnpinMessageHandler, generateDeleteMessageHandler, generatePinMessageHandler } from '../MessageHandler';

/**
 * Генерирует обработчики для каждого узла
 * @param nodes - Массив узлов для генерации обработчиков
 * @param userDatabaseEnabled - Флаг, указывающий, включена ли база данных пользователей
 * @returns Сгенерированный код обработчиков узлов
 */
export function generateNodeHandlers(nodes: Node[], userDatabaseEnabled: boolean): string {
  let nodeCode = '';

  const nodeHandlers: Record<string, (node: Node) => string> = {
    start: (node) => generateStartHandler(node, userDatabaseEnabled),
    command: (node) => generateCommandHandler(node, userDatabaseEnabled),
    sticker: generateStickerHandler,
    voice: generateVoiceHandler,
    animation: generateAnimationHandler,
    location: generateLocationHandler,
    contact: generateContactHandler,
    pin_message: generatePinMessageHandler,
    unpin_message: generateUnpinMessageHandler,
    delete_message: generateDeleteMessageHandler,
    ban_user: generateBanUserHandler,
    unban_user: generateUnbanUserHandler,
    mute_user: generateMuteUserHandler,
    unmute_user: generateUnmuteUserHandler,
    kick_user: generateKickUserHandler,
    promote_user: generatePromoteUserHandler,
    demote_user: generateDemoteUserHandler,
    admin_rights: generateAdminRightsHandler,
  };

  nodes.forEach((node: Node) => {
    nodeCode += `\n# @@NODE_START:${node.id}@@\n`;

    const handler = nodeHandlers[node.type];
    if (handler) {
      nodeCode += handler(node);
    } else {
      // Если нет специфического обработчика, проверим, может быть, это обычный узел сообщения
      if (node.type === 'message' || node.type === 'command') {
        // Для узлов типа message и command без медиа-контента используем стандартную логику
        nodeCode += `    # Обработчик для узла ${node.id} типа ${node.type} будет сгенерирован отдельно\n`;
      } else {
        nodeCode += `    # Нет обработчика для узла типа ${node.type}\n`;
      }
    }
    // Примечание: узлы ввода пользователя и сообщений обрабатываются через обработчики обратного вызова, а не как отдельные обработчики команд

    nodeCode += `# @@NODE_END:${node.id}@@\n`;
  });

  return nodeCode;
}