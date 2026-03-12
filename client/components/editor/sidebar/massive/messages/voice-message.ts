/**
 * @fileoverview Определение компонента голосового сообщения
 * Голосовое сообщение
 */
import { ComponentDefinition } from "@shared/schema";

/** Голосовое сообщение с длительностью */
export const voiceMessage: ComponentDefinition = {
  id: 'voice-message',
  name: 'Голосовое сообщение',
  description: 'Голосовое сообщение',
  icon: 'fas fa-microphone',
  color: 'bg-teal-100 text-teal-600',
  type: 'voice',
  defaultData: {
    messageText: 'Голосовое сообщение',
    voiceUrl: '',
    duration: 0,
    keyboardType: 'none',
    buttons: [],
    markdown: false,
    oneTimeKeyboard: false,
    resizeKeyboard: true
  }
};
