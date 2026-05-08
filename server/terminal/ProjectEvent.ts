/**
 * @fileoverview Типы событий проекта, передаваемых через WebSocket
 * @module server/terminal/ProjectEvent
 */

/**
 * Событие прогресса рассылки
 */
export interface BroadcastProgressEvent {
  /** Тип события */
  type: 'broadcast-progress';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор рассылки */
  broadcastId: number;
  /** Количество отправленных сообщений */
  sentCount: number;
  /** Количество доставленных сообщений */
  deliveredCount: number;
  /** Количество ошибок */
  failedCount: number;
  /** Всего получателей */
  totalCount: number;
  /** Текущий статус рассылки */
  status: 'running' | 'stopped' | 'done';
}

/**
 * Событие проекта, рассылаемое всем подключённым клиентам
 */
export interface ProjectEvent {
  /** Тип события: создание/удаление токена, изменение статуса бота, новое сообщение диалога, новый пользователь или прогресс рассылки */
  type: 'token-created' | 'token-deleted' | 'bot-started' | 'bot-stopped' | 'bot-error' | 'new-message' | 'new-user' | 'broadcast-progress';
  /** Идентификатор проекта */
  projectId: number;
  /** ID токена (для событий бота) */
  tokenId?: number;
  /** Дополнительные данные события */
  data?: unknown;
  /** Временная метка события в ISO-формате */
  timestamp: string;
}
