/**
 * @fileoverview Определение компонента открепления сообщения
 * Снятие закрепления сообщения
 */
import { ComponentDefinition } from "@shared/schema";

/** Открепление закреплённого сообщения */
export const unpinMessage: ComponentDefinition = {
  id: 'unpin-message',
  name: 'Открепить сообщение',
  description: 'Снятие закрепления сообщения',
  icon: 'fas fa-times',
  color: 'bg-slate-100 text-slate-600',
  type: 'unpin_message',
  defaultData: {
    command: '/unpin_message',
    targetMessageId: '',
    messageIdSource: 'last_message',
    variableName: ''
  }
};
