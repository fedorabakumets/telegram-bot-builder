/**
 * @fileoverview Определение узла "Уведомление при нажатии на inline кнопку"
 * @module components/editor/sidebar/massive/actions/answer-callback-query-node
 */
import type { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента узла ответа на callback_query.
 * Показывает всплывающее уведомление пользователю после нажатия inline-кнопки.
 */
export const answerCallbackQueryNode: ComponentDefinition = {
  id: 'answer_callback_query',
  type: 'answer_callback_query' as any,
  name: 'Уведомление при нажатии на inline кнопку',
  description: 'Показывает всплывающее уведомление пользователю после нажатия inline-кнопки',
  icon: 'fas fa-bell',
  color: 'bg-purple-100 text-purple-600',
  defaultData: {
    /** Текст уведомления (0–200 символов), поддерживает переменные */
    callbackNotificationText: '',
    /** Показать как алерт (true) или тост (false) */
    callbackShowAlert: false,
    /** Время кеширования ответа в секундах */
    callbackCacheTime: 0,
  },
};
