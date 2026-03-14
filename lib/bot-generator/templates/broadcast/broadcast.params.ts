/**
 * @fileoverview Параметры для шаблона рассылки
 * @module templates/broadcast/broadcast.params
 */

/** Параметры для генерации обработчика рассылки */
export interface BroadcastTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Тип API: 'bot' или 'client' */
  broadcastApiType: 'bot' | 'client';
  /** ID узла для получения целевых пользователей */
  broadcastTargetNode: string;
  /** Включить ли рассылку */
  enableBroadcast: boolean;
  /** Требуется ли подтверждение */
  enableConfirmation: boolean;
  /** Текст подтверждения */
  confirmationText: string;
  /** Сообщение об успехе */
  successMessage: string;
  /** Сообщение об ошибке */
  errorMessage: string;
  /** Источник ID: 'user_ids', 'bot_users', 'both' */
  idSourceType: 'user_ids' | 'bot_users' | 'both';
  /** Текст сообщения для рассылки */
  messageText: string;
}
