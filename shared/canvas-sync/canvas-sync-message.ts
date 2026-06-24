/**
 * @fileoverview Типы сообщений синхронизации холста между клиентами
 * @module shared/canvas-sync/canvas-sync-message
 */

import type { BotDataWithSheets } from '../schema';
import type { CanvasActor } from './canvas-actor';

/** Сообщение live-синхронизации холста */
export interface CanvasSyncMessage {
  /** Тип сообщения */
  type: 'canvas-sync';
  /** ID проекта */
  projectId: number;
  /** Уникальный ID вкладки-отправителя */
  tabId: string;
  /** Кто внёс изменения (человек, агент, гость) */
  actor?: CanvasActor;
  /**
   * @deprecated Используйте actor.userId
   * ID пользователя (дублируется сервером для совместимости)
   */
  userId?: number;
  /** Временная метка для last-write-wins */
  timestamp: number;
  /** Актуальные данные проекта */
  data: BotDataWithSheets;
}

/** Ping/pong для keepalive WebSocket */
export interface CanvasSyncPingMessage {
  /** Тип сообщения */
  type: 'ping' | 'pong';
}

/** Любое входящее сообщение канала синхронизации */
export type CanvasSyncWireMessage = CanvasSyncMessage | CanvasSyncPingMessage;

/**
 * Проверяет, что сообщение — canvas-sync
 * @param msg - Распарсенное сообщение
 * @returns true если canvas-sync
 */
export function isCanvasSyncMessage(msg: unknown): msg is CanvasSyncMessage {
  return (
    typeof msg === 'object'
    && msg !== null
    && (msg as CanvasSyncMessage).type === 'canvas-sync'
    && typeof (msg as CanvasSyncMessage).projectId === 'number'
    && typeof (msg as CanvasSyncMessage).tabId === 'string'
    && typeof (msg as CanvasSyncMessage).timestamp === 'number'
    && typeof (msg as CanvasSyncMessage).data === 'object'
  );
}
