/**
 * @fileoverview Типы событий проекта, передаваемых через WebSocket
 * @module server/terminal/ProjectEvent
 */

/**
 * Событие проекта, рассылаемое всем подключённым клиентам
 */
export interface ProjectEvent {
  /** Тип события: создание или удаление токена */
  type: 'token-created' | 'token-deleted';
  /** Идентификатор проекта */
  projectId: number;
  /** Дополнительные данные события */
  data?: unknown;
  /** Временная метка события в ISO-формате */
  timestamp: string;
}
