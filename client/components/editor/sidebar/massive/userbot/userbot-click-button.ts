/**
 * @fileoverview Определение компонента нажатия inline-кнопки через Telethon userbot
 */
import { ComponentDefinition } from "@shared/schema";

/** Нажатие inline-кнопки через юзербот (Telethon) */
export const userbotClickButton: ComponentDefinition = {
  id: 'userbot-click-button',
  name: 'Нажать кнопку (юзербот)',
  description: 'Нажать inline-кнопку в сообщении через Telethon',
  icon: 'fas fa-hand-pointer',
  color: 'bg-violet-100 text-violet-600',
  type: 'userbot_click_button' as any,
  defaultData: {
    userbotEntity: '',
    messageId: '',
    clickMode: 'text',
    clickValue: '',
    saveAlertTo: '',
    saveResultTo: '',
    saveButtonsTo: '',
    saveHasMediaTo: '',
    autoTransitionTo: '',
  }
};
