/**
 * @fileoverview Тип сообщений WebSocket терминала
 * @module server/terminal/TerminalMessage
 */

/**
 * Сообщение, передаваемое через WebSocket терминала
 */
export interface TerminalMessage {
  /** Тип сообщения */
  type: 'stdout' | 'stderr' | 'status' | 'token-created' | 'token-deleted';
  /** Содержимое сообщения (для stdout/stderr/status) */
  content: string;
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId: number;
  /** Временная метка */
  timestamp: string;
  /** Дополнительные данные (для событий проекта) */
  data?: unknown;
}
