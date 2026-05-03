/**
 * @fileoverview Типы событий проекта, передаваемых через WebSocket
 * @module server/terminal/ProjectEvent
 */

/**
 * Событие проекта, рассылаемое всем подключённым клиентам
 */
export interface ProjectEvent {
  /** Тип события: создание/удаление токена, изменение статуса бота или новое сообщение диалога */
  type: 'token-created' | 'token-deleted' | 'bot-started' | 'bot-stopped' | 'bot-error' | 'new-message';
  /** Идентификатор проекта */
  projectId: number;
  /** ID токена (для событий бота) */
  tokenId?: number;
  /** Дополнительные данные события */
  data?: unknown;
  /** Временная метка события в ISO-формате */
  timestamp: string;
}
