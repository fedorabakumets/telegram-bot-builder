/**
 * @fileoverview Определение компонента текстового сообщения
 * Отправляет обычный текст или текст с разметкой Markdown.
 */
import { ComponentDefinition } from "@shared/schema";

/** Текстовое сообщение с поддержкой Markdown */
export const textMessage: ComponentDefinition = {
  id: 'text-message',
  name: 'Отправить текст в чат',
  description: 'Бот отправит сообщение, например «Добро пожаловать!».',
  icon: 'fas fa-comment',
  color: 'bg-blue-100 text-blue-600',
  type: 'message',
  defaultData: {
    messageText: 'Новое сообщение',
    markdown: false
  }
};
