/**
 * @fileoverview Определение компонента удаления сообщения
 * Полноценная action-нода для удаления одного или нескольких сообщений
 */
import { ComponentDefinition } from "@shared/schema";

/** Удаление сообщения из чата */
export const deleteMessage: ComponentDefinition = {
  id: 'delete-message',
  name: 'Удалить сообщение',
  description: 'Удаляет одно или несколько сообщений в чате',
  icon: 'fas fa-trash',
  color: 'bg-red-100 text-red-600',
  type: 'delete_message',
  defaultData: {
    /** Источник ID сообщения: 'current_message' | 'last_bot_message' | 'reply_message' | 'last_n' | 'custom' */
    messageIdSource: 'current_message',
    /** ID сообщения (число или {переменная}) — для режима custom */
    messageIdManual: '',
    /** Количество последних сообщений для режима last_n */
    lastNCount: '',
    /** Источник ID чата: 'current_chat' | 'custom' */
    chatIdSource: 'current_chat',
    /** ID чата (число или {переменная}) — для режима custom */
    chatIdManual: '',
    /** Не падать если сообщение не найдено */
    ignoreErrors: true,
    /** Множественное удаление (массив ID из переменной) */
    bulkDelete: false,
    /** Переменная с массивом message_id */
    bulkMessageIdsVariable: '',
  }
};
