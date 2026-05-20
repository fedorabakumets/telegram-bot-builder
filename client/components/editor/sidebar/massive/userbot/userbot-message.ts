/**
 * @fileoverview Определение компонента отправки сообщения через Telethon userbot
 */
import { ComponentDefinition } from "@shared/schema";

/** Отправка сообщения через юзербот (Telethon) */
export const userbotMessage: ComponentDefinition = {
  id: 'userbot-message',
  name: 'Сообщение (юзербот)',
  description: 'Отправка сообщения от аккаунта через Telethon',
  icon: 'fas fa-paper-plane',
  color: 'bg-violet-100 text-violet-600',
  type: 'userbot_message' as any,
  defaultData: {
    messageText: '',
    formatMode: 'html',
    userbotEntity: '',
    userbotEntitySource: 'manual',
    userbotEntityVariable: '',
    attachedMedia: [],
    autoTransitionTo: '',
  }
};
