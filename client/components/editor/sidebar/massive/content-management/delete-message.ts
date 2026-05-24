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
    /** Источник ID сообщения: 'current_message' | 'last_bot_message' | 'last_n' | 'variable' | 'manual' */
    messageIdSource: 'current_message',
    /** Имя переменной с ID сообщения */
    messageIdVariable: '',
    /** ID сообщения вручную (поддерживает {переменные}) */
    messageIdManual: '',
    /** Количество последних сообщений для режима last_n */
    lastNCount: '',
    /** Источник ID чата: 'current_chat' | 'variable' | 'manual' */
    chatIdSource: 'current_chat',
    /** Имя переменной с ID чата */
    chatIdVariable: '',
    /** ID чата вручную */
    chatIdManual: '',
    /** Не падать если сообщение не найдено */
    ignoreErrors: true,
    /** Множественное удаление (массив ID из переменной) */
    bulkDelete: false,
    /** Переменная с массивом message_id */
    bulkMessageIdsVariable: '',
  }
};
