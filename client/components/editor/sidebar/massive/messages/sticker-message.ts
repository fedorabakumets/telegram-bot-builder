/**
 * @fileoverview Определение компонента стикера
 * Анимированный стикер
 */
import { ComponentDefinition } from "@shared/schema";

/** Сообщение со стикером */
export const stickerMessage: ComponentDefinition = {
  id: 'sticker-message',
  name: 'Отправить стикер',
  description: 'Бот пришлёт выбранный стикер, например в ответ на приветствие.',
  icon: 'fas fa-laugh',
  color: 'bg-pink-100 text-pink-600',
  type: 'sticker',
  defaultData: {
    messageText: 'Стикер',
    stickerUrl: '',
    stickerFileId: '',
    markdown: false,
    oneTimeKeyboard: false,
    resizeKeyboard: true
  }
};
