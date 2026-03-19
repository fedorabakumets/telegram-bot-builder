/**
 * @fileoverview Определение компонента закрепления сообщения
 * Закрепление сообщения в группе
 */
import { ComponentDefinition } from "@shared/schema";

/** Закрепление сообщения в чате */
export const pinMessage: ComponentDefinition = {
  id: 'pin-message',
  name: 'Закрепить сообщение',
  description: 'Закрепление сообщения в группе',
  icon: 'fas fa-thumbtack',
  color: 'bg-cyan-100 text-cyan-600',
  type: 'pin_message',
  defaultData: {
    command: '/pin_message',
    targetMessageId: '',
    messageIdSource: 'last_message',
    variableName: '',
    disableNotification: false
  }
};
