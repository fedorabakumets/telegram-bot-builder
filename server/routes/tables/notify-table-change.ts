/**
 * @fileoverview Синхронизация _content и одно уведомление Redis
 * @module routes/tables/notify-table-change
 */

import { syncTableToScenario } from "../../services/content-table";
import { CONTENT_TABLE_NAME } from "../../database/bot-tables/limits";

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
    for (const rowData of rowDatas) {
      try {
        await syncTableToScenario(projectId, tableId, rowData);
      } catch (error) {
        console.error("[tables] синхронизация _content:", error);
      }
    }
  }
  try {
    const { getRedisPublisher } = await import("../../redis/redisClient");
    const publisher = getRedisPublisher();
    if (publisher) await publisher.publish(`bot:table_updated:${projectId}`, JSON.stringify({ tableId }));
  } catch {
    /* уведомление не должно ломать уже сохранённый ответ */
  }
}
