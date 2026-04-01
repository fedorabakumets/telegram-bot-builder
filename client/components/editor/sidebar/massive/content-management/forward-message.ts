/**
 * @fileoverview Определение компонента пересылки сообщения
 * Пересылка сообщения в другой чат через Bot API
 */
import { ComponentDefinition } from "@shared/schema";

/** Пересылка сообщения */
export const forwardMessage: ComponentDefinition = {
  id: 'forward-message',
  name: 'Переслать сообщение',
  description: 'Пересылка сообщения в другой чат',
  icon: 'fas fa-share',
  color: 'bg-amber-100 text-amber-600',
  type: 'forward_message',
  defaultData: {
    command: '/forward_message',
    sourceMessageId: '',
    sourceMessageIdSource: 'current_message',
    sourceMessageNodeId: '',
    sourceMessageVariableName: '',
    targetChatId: '',
    targetChatIdSource: 'manual',
    targetChatVariableName: '',
    targetChatTargets: [],
    disableNotification: false,
    hideAuthor: false,
    synonyms: ['переслать', 'отправить дальше', 'forward']
  }
};
