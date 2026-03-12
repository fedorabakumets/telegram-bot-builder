import { ComponentDefinition } from "@shared/schema";
import { broadcastNode } from "../../canvas/canvas-node/broadcast-node";
import { clientAuthNode } from "../../canvas/canvas-node/client-auth-node";
import { startCommand, helpCommand, settingsCommand, menuCommand, customCommand } from "./commands";
import { textMessage, stickerMessage, voiceMessage, locationMessage, contactMessage } from "./messages";
import { banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser } from "./user-management";
import { pinMessage, unpinMessage, deleteMessage, adminRights } from "./content-management";

/**
 * Массив определений компонентов для конструктора бота
 * Содержит все доступные типы узлов с их настройками по умолчанию
 */
export const components: ComponentDefinition[] = [
  textMessage,
  stickerMessage,
  voiceMessage,
  locationMessage,
  contactMessage,
  startCommand,
  helpCommand,
  settingsCommand,
  menuCommand,
  customCommand,
  pinMessage,
  unpinMessage,
  deleteMessage,
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
  kickUser,
  promoteUser,
  demoteUser,
  adminRights,
  broadcastNode,
  clientAuthNode
];