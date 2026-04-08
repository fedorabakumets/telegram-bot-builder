/**
 * @fileoverview Модуль для автоматического восстановления ботов после перезапуска сервера
 * @module server/bots/restoreRunningBots
 */

import { storage } from "../storages/storage";
import { startBot } from "./startBot";

/**
 * Восстанавливает все боты, которые были запущены до перезапуска сервера.
 *
 * При редеплое Railway (или любом другом рестарте) in-memory коллекция
 * botProcesses очищается, но в БД боты остаются со статусом "running".
 * Эта функция находит такие боты и перезапускает их автоматически.
 *
 * @returns {Promise<void>}
 */
export async function restoreRunningBots(): Promise<void> {
  try {
    console.log("🔄 Восстанавливаем запущенные боты после рестарта...");

    const allInstances = await storage.getAllBotInstances();
    const runningInstances = allInstances.filter((i) => i.status === "running");

    if (runningInstances.length === 0) {
      console.log("ℹ️ Нет ботов для восстановления.");
      return;
    }

    console.log(`🤖 Найдено ${runningInstances.length} бот(ов) для восстановления.`);

    for (const instance of runningInstances) {
      try {
        console.log(
          `▶️ Восстанавливаем бота: projectId=${instance.projectId}, tokenId=${instance.tokenId}`
        );

        const result = await startBot(instance.projectId, instance.token, instance.tokenId);

        if (result.success) {
          console.log(
            `✅ Бот projectId=${instance.projectId} успешно восстановлен (PID: ${result.processId})`
          );
        } else {
          console.error(
            `❌ Не удалось восстановить бота projectId=${instance.projectId}: ${result.error}`
          );
          await storage.updateBotInstance(instance.id, {
            status: "error",
            errorMessage: result.error ?? "Ошибка при восстановлении после рестарта",
          });
        }
      } catch (err) {
        console.error(`❌ Ошибка при восстановлении бота projectId=${instance.projectId}:`, err);
        await storage.updateBotInstance(instance.id, {
          status: "error",
          errorMessage: String(err),
        });
      }
    }

    console.log("✅ Восстановление ботов завершено.");
  } catch (error) {
    console.error("❌ Критическая ошибка при восстановлении ботов:", error);
  }
}
