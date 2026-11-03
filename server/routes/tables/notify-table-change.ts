/**
 * @fileoverview Синхронизация _content и одно уведомление Redis
 * @module routes/tables/notify-table-change
 */

import { cachedOps } from '../../database/db-cache';
import { syncTableToScenario } from "../../services/content-table";
import { CONTENT_TABLE_NAME } from "../../database/bot-tables/limits";
import { broadcastProjectEvent } from '../../terminal/broadcastProjectEvent';
import { broadcastContentSnapshot } from './broadcast-content-snapshot';

/**
 * Синхронизирует изменённые строки _content и публикует одно событие
 * @param projectId - Проект
 * @param tableId - Таблица
 * @param tableName - Имя таблицы
 * @param rowDatas - Данные изменённых строк
 */
export async function notifyTableChange(
  projectId: number,
  tableId: number,
  tableName: string,
  rowDatas: Record<string, string>[] = [],
): Promise<void> {
  if (tableName === CONTENT_TABLE_NAME) {
    /** После атомарного обновления JSON серверный кеш проекта также должен стать свежим. */
    cachedOps.invalidateProject(projectId);
    for (const rowData of rowDatas) {
      try {
        await syncTableToScenario(projectId, tableId, rowData);
      } catch (error) {
        console.error("[tables] синхронизация _content:", error);
      }
    }
    /** Потеря live-доставки не отменяет сохранённые ячейки; ревизия защищает от позднего снимка. */
    try { await broadcastContentSnapshot(projectId); }
    catch (error) { console.error('[tables] доставка сценария:', error); }
  }
  try {
    const { getRedisPublisher } = await import("../../redis/redisClient");
    const publisher = getRedisPublisher();
    if (publisher) await publisher.publish(`bot:table_updated:${projectId}`, JSON.stringify({ tableId }));
  } catch {
    /* уведомление не должно ломать уже сохранённый ответ */
  }
  /** Доставка интерфейсу отделена от Python reload и не отменяет уже сделанный COMMIT. */
  try {
    await broadcastProjectEvent(projectId, { type: 'table-updated', projectId,
      data: { tableId }, timestamp: new Date().toISOString() });
  } catch { /* Интерфейс перечитает данные при восстановлении соединения. */ }
}
