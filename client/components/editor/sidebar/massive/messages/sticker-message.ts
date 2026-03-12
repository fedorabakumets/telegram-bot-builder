/**
 * @fileoverview Определение компонента стикера
 * Анимированный стикер
 */
import { ComponentDefinition } from "@shared/schema";

/** Сообщение со стикером */
export const stickerMessage: ComponentDefinition = {
  id: 'sticker-message',
  name: 'Стикер',
  description: 'Анимированный стикер',
  icon: 'fas fa-laugh',
  color: 'bg-pink-100 text-pink-600',
  type: 'sticker',
  defaultData: {
    messageText: 'Стикер',
    stickerUrl: '',
    stickerFileId: '',
    keyboardType: 'none',
    buttons: [],
    markdown: false,
    oneTimeKeyboard: false,
    resizeKeyboard: true
  }
};
