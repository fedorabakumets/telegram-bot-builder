/** @fileoverview Порядок подтверждённых снимков холста по ревизии, а черновиков по времени. */

/** Последний принятый маркер одного проекта. */
export interface CanvasOrder {
  /** Идентификатор проекта, к которому относится маркер. */
  projectId: number;
  /** Последняя подтверждённая сервером ревизия. */
  revision?: number;
  /** Время последнего принятого сообщения. */
  timestamp: number;
}

/**
 * Отбрасывает старый серверный снимок даже при более позднем времени доставки.
 * @param previous - Последнее принятое состояние.
 * @param incoming - Маркер входящего снимка.
 * @returns Допустимость применения снимка.
 */
export function acceptsCanvasOrder(previous: CanvasOrder | undefined, incoming: CanvasOrder): boolean {
  if (!previous || previous.projectId !== incoming.projectId) return true;
  if (incoming.revision !== undefined) return previous.revision === undefined || incoming.revision > previous.revision;
  return incoming.timestamp > previous.timestamp;
}
