/**
 * @fileoverview Определение компонента контакта
 * Поделиться контактом
 */
import { ComponentDefinition } from "@shared/schema";

/** Сообщение с контактом */
export const contactMessage: ComponentDefinition = {
  id: 'contact-message',
  name: 'Контакт',
  description: 'Поделиться контактом',
  icon: 'fas fa-address-book',
  color: 'bg-blue-100 text-blue-600',
  type: 'contact',
  defaultData: {
    messageText: 'Контакт',
    phoneNumber: '+7 (999) 123-45-67',
    firstName: 'Имя',
    lastName: 'Фамилия',
    userId: 0,
    vcard: '',
    keyboardType: 'none',
    buttons: [],
    markdown: false,
    oneTimeKeyboard: false,
    resizeKeyboard: true
  }
};
