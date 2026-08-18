/**
 * @fileoverview Модуль для автоматического восстановления ботов после перезапуска сервера
 * @module server/bots/restoreRunningBots
 */

import { storage } from "../storages/storage";
import { startBot } from "./startBot";
import { clearBotRedisLock } from "./clearBotRedisLock";
import {
  RESTORE_START_STAGGER_MS,
  waitRestoreStagger,
} from "./restoreStartStagger";
import { refuseInactiveBotStart } from "./refuse-inactive-bot-start";

/**
 * Определяет, был ли бот остановлен внезапно (не вручную пользователем).
 *
 * Внезапная остановка — это завершение процесса операционной системой:
 * закрытие терминала крестиком, kill -9, перезагрузка Windows и т.п.
 * В таких случаях обработчик `exit` в startBot.ts записывает
 * `errorMessage = "Процесс завершен с кодом <N>"`.
 *
 * Ручная остановка через `stopBot` не трогает `errorMessage` (остаётся null),
 * поэтому такие боты восстанавливать не нужно.
 *
 * @param errorMessage - Значение поля error_message из БД
 * @returns true, если бот был остановлен внезапно и должен быть восстановлен
 */
function isAbruptShutdown(errorMessage: string | null | undefined): boolean {
  if (!errorMessage) return false;
  // "Процесс завершен с кодом null" — это завершение по сигналу (SIGTERM/SIGKILL от stopBot),
  // не считается внезапным крашем и не должно триггерить восстановление
  if (errorMessage.includes("с кодом null")) return false;
  return errorMessage.includes("Процесс завершен с кодом");
}

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
    /**
     * Ищем боты для восстановления по четырём условиям:
     * 1. `status === 'running'` — бот был запущен, сервер упал без graceful shutdown
     * 2. `errorMessage === '__server_restart__'` — graceful shutdown записал маркер
     * 3. `status === 'stopped'` + `stoppedAt === null` — процесс убит внезапно,
     *    stopped_at не успел записаться (kill -9 до flush БД)
     * 4. `status === 'stopped'` + `stoppedAt` заполнен + errorMessage содержит
     *    "Процесс завершен с кодом" — внезапное убийство (закрытие терминала
     *    крестиком, Windows код 3221225786 и т.п.), stopped_at успел записаться,
     *    но это НЕ ручная остановка пользователем
     */
    const runningInstances = allInstances.filter(
      (i) =>
        i.status === "running" ||
        i.errorMessage === "__server_restart__" ||
        (i.status === "stopped" && !i.stoppedAt) ||
        (i.status === "stopped" && isAbruptShutdown(i.errorMessage))
    );

    if (runningInstances.length === 0) {
      console.log("ℹ️ Нет ботов для восстановления.");
      return;
    }

    console.log(`🤖 Найдено ${runningInstances.length} бот(ов) для восстановления.`);

    for (let i = 0; i < runningInstances.length; i++) {
      const instance = runningInstances[i];
      try {
        console.log(
          `▶️ Восстанавливаем бота: projectId=${instance.projectId}, tokenId=${instance.tokenId}`
        );

        // Токен всегда берём из bot_tokens — в bot_instances.token может лежать
        // устаревшая маска (••••) после env-batch/публичного DTO.
        const tokenRecord = instance.tokenId
          ? await storage.getBotToken(instance.tokenId)
          : undefined;
        const launchToken = tokenRecord?.token;
        if (!launchToken || !instance.tokenId) {
          console.error(
            `❌ Нет валидного токена для восстановления projectId=${instance.projectId} tokenId=${instance.tokenId}`,
          );
          await storage.updateBotInstance(instance.id, {
            status: "error",
            errorMessage: "Нет валидного токена для восстановления",
          });
          continue;
        }

        const inactiveError = refuseInactiveBotStart(tokenRecord.isActive);
        if (inactiveError) {
          console.log(
            `⏭ Пропуск восстановления: токен ${instance.tokenId} недействителен (isActive=0)`,
          );
          await storage.updateBotInstance(instance.id, {
            status: "stopped",
            stoppedAt: new Date(),
            errorMessage: inactiveError,
          });
          continue;
        }

        // Удаляем Redis lock перед запуском — старый процесс мог держать lock
        await clearBotRedisLock(launchToken, instance.tokenId);

        const result = await startBot(instance.projectId, launchToken, instance.tokenId, { clearLogs: false });

        if (result.success) {
          console.log(
            `✅ Бот projectId=${instance.projectId} успешно восстановлен (PID: ${result.processId})`
          );
        } else {
          console.error(
            `❌ Не удалось восстановить бота projectId=${instance.projectId}: ${result.error}`
          );
          /**
           * Убираем маркер `__server_restart__` при неудаче, чтобы следующий рестарт
           * не пытался снова запустить заведомо неработающего бота.
           */
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

      // Stagger: не бить Redis одновременным ping от всех ботов
      if (i < runningInstances.length - 1) {
        await waitRestoreStagger(RESTORE_START_STAGGER_MS);
      }
    }

    console.log("✅ Восстановление ботов завершено.");
  } catch (error) {
    console.error("❌ Критическая ошибка при восстановлении ботов:", error);
  }
}
