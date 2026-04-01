import { ComponentDefinition } from "@shared/schema";
import { broadcastNode } from "../../canvas/canvas-node/broadcast-node";
import { clientAuthNode } from "../../canvas/canvas-node/client-auth-node";
import { textMessage, stickerMessage, voiceMessage, locationMessage, contactMessage, mediaMessage, saveAnswerNode } from "./messages";
import { banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser, adminRights } from "./user-management";
import { pinMessage, unpinMessage, deleteMessage, forwardMessage } from "./content-management";
import { commandTrigger, textTrigger, anyMessageTrigger } from "./triggers";
import { conditionNode } from "./logic";

/**
 * Массив определений компонентов для конструктора бота
 * Содержит все доступные типы узлов с их настройками по умолчанию
 */
export const components: ComponentDefinition[] = [
  commandTrigger,
  textTrigger,
  anyMessageTrigger,
  textMessage,
  saveAnswerNode,
  mediaMessage,
  stickerMessage,
  voiceMessage,
  locationMessage,
  contactMessage,
  pinMessage,
  unpinMessage,
  deleteMessage,
  forwardMessage,
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
  kickUser,
  promoteUser,
  demoteUser,
  adminRights,
  broadcastNode,
  clientAuthNode,
  conditionNode,
];
