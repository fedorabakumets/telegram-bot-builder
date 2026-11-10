/**
 * @fileoverview Проверка остановки рассылки между процессами через базу данных.
 */

import { storage } from "../../../../storages/storage";

/**
 * Проверяет сохранённый запрос остановки рассылки.
 * @param broadcastId - Идентификатор рассылки
 * @returns Признак остановки или удаления рассылки
 */
export async function isBroadcastStopped(broadcastId: number): Promise<boolean> {
  const broadcast = await storage.getBroadcastById(broadcastId);
  return !broadcast || broadcast.status === "stopped";
}
