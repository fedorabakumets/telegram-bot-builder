/**
 * @fileoverview Определение узла "Редактировать сообщение"
 * @module components/editor/sidebar/massive/actions/edit-message-node
 */
import type { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента узла редактирования сообщения.
 * Вызывает editMessageText или editMessageReplyMarkup для изменения
 * уже отправленного сообщения.
 */
export const editMessageNode: ComponentDefinition = {
  id: 'edit_message',
  type: 'edit_message' as any,
  name: 'Редактировать сообщение',
  description: 'Редактирует текст или кнопки уже отправленного сообщения',
  icon: 'fas fa-pen',
  color: 'bg-blue-100 text-blue-600',
  defaultData: {
    /** Режим редактирования: 'text' — текст, 'markup' — кнопки, 'both' — оба */
    editMode: 'text',
    /** Новый текст сообщения, поддерживает переменные {var} */
    editMessageText: '',
    /** Режим форматирования: 'html' | 'markdown' | 'none' */
    editFormatMode: 'none',
    /** Источник ID сообщения: 'current_message' | 'variable' | 'manual' */
    editMessageIdSource: 'current_message',
    /** Имя переменной с ID сообщения */
    editMessageIdVariable: '',
    /** ID сообщения вручную */
    editMessageIdManual: '',
    /** Источник ID чата: 'current_chat' | 'variable' | 'manual' */
    editChatIdSource: 'current_chat',
    /** Имя переменной с ID чата */
    editChatIdVariable: '',
    /** ID чата вручную */
    editChatIdManual: '',
    /** Убрать клавиатуру */
    editRemoveKeyboard: false,
    /** Новые кнопки (если editMode = 'markup' или 'both') */
    editButtons: [],
    /** Тип клавиатуры для новых кнопок */
    editKeyboardType: 'inline',
  },
};
