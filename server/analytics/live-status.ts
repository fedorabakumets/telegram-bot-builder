/** @fileoverview Доступность канала подтверждённых уведомлений аналитики. */
import type { ProjectEvent } from '../../shared/project-sync/project-event';
import { authorizedFanout } from '../terminal/authorized-fanout';
/** Подключение к журналу уведомлений PostgreSQL. */
let connected = false;
/** Возвращает состояние без содержимого отчётов. */
export function analyticsTransportStatus(): ProjectEvent {
  return { type: 'analytics-status', projectId: 0, data: { connected }, timestamp: new Date().toISOString() };
}
/** Уведомляет вкладки о потере и восстановлении канала уведомлений. */
export async function setAnalyticsTransportStatus(value: boolean): Promise<void> {
  if (connected === value) return;
  connected = value;
  await authorizedFanout(JSON.stringify(analyticsTransportStatus()));
}
