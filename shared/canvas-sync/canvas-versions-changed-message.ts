/**
 * @fileoverview Тип сообщения «история версий проекта изменилась».
 * Отправляется сервером в комнату canvas_<projectId> после удаления/prune/commit версий,
 * чтобы открытая панель версий инвалидировала react-query и обновилась в реальном времени.
 * @module shared/canvas-sync/canvas-versions-changed-message
 */

/** Сообщение «история версий проекта изменилась» (для live-обновления панели версий) */
export interface CanvasVersionsChangedMessage {
  /** Тип сообщения */
  type: 'versions-changed';
  /** ID проекта, чья история версий изменилась */
  projectId: number;
  /** Временная метка отправки (опционально) */
  timestamp?: number;
}

/**
 * Проверяет, что сообщение — versions-changed
 * @param msg - Распарсенное сообщение
 * @returns true если это сигнал об изменении истории версий
 */
export function isCanvasVersionsChangedMessage(msg: unknown): msg is CanvasVersionsChangedMessage {
  return (
    typeof msg === 'object'
    && msg !== null
    && (msg as CanvasVersionsChangedMessage).type === 'versions-changed'
    && typeof (msg as CanvasVersionsChangedMessage).projectId === 'number'
  );
}
