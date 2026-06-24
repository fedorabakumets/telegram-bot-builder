/**
 * @fileoverview Тип сообщения сброса/сохранения локальных изменений холста между клиентами.
 * Отправляется при нажатии «Сбросить» или «Сохранить» — другие вкладки/устройства
 * убирают плашку несохранённых изменений (а при сбросе — ещё и откатывают данные).
 * @module shared/canvas-sync/canvas-reset-message
 */

/** Вид сигнала управления изменениями холста */
export type CanvasResetKind = 'reset' | 'saved';

/** Сообщение сброса/сохранения локальных изменений холста */
export interface CanvasResetMessage {
  /** Тип сообщения */
  type: 'canvas-reset';
  /** Вид: 'reset' — откат к серверной версии, 'saved' — изменения сохранены */
  kind: CanvasResetKind;
  /** ID проекта */
  projectId: number;
  /** Уникальный ID вкладки-отправителя (для игнорирования собственного эха) */
  tabId: string;
  /** Временная метка отправки */
  timestamp: number;
}

/**
 * Проверяет, что сообщение — canvas-reset
 * @param msg - Распарсенное сообщение
 * @returns true если это сообщение сброса/сохранения
 */
export function isCanvasResetMessage(msg: unknown): msg is CanvasResetMessage {
  return (
    typeof msg === 'object'
    && msg !== null
    && (msg as CanvasResetMessage).type === 'canvas-reset'
    && ((msg as CanvasResetMessage).kind === 'reset' || (msg as CanvasResetMessage).kind === 'saved')
    && typeof (msg as CanvasResetMessage).projectId === 'number'
    && typeof (msg as CanvasResetMessage).tabId === 'string'
    && typeof (msg as CanvasResetMessage).timestamp === 'number'
  );
}
