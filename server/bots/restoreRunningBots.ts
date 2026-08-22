/**
 * @fileoverview Модуль для автоматического восстановления ботов после перезапуска сервера
 * @module server/bots/restoreRunningBots
 */

import { storage } from "../storages/storage";
import { clearBotRedisLock } from "./clearBotRedisLock";
import {
  RESTORE_START_STAGGER_MS,
  waitRestoreStagger,
} from "./restoreStartStagger";
import { refuseInactiveBotStart } from "./refuse-inactive-bot-start";
import { startBotWithRetries } from "./restoreRetry";
import {
  markRestoreFinished,
  markRestoreStarted,
  markTokenRestored,
} from "./restoreState";
import { groupRestoreInstancesByProject } from "./restoreGrouping";

export interface RestoreRunningBotsResult {
  /** Сколько ботов пытались поднять */
  total: number;
  /** Успешно подняты */
  restored: number;
  /** tokenId, которые не поднялись после всех попыток */
  failedTokenIds: number[];
}

interface RestoreGroupResult {
  restored: number;
  failedTokenIds: number[];
}

/**
 * Определяет, был ли бот остановлен внезапно (не вручную пользователем).
 *
 * @param errorMessage - Значение поля error_message из БД
 * @returns true, если бот был остановлен внезапно и должен быть восстановлен
 */
function isAbruptShutdown(errorMessage: string | null | undefined): boolean {
  if (!errorMessage) return false;
  if (errorMessage.includes("с кодом null")) return false;
  return errorMessage.includes("Процесс завершен с кодом");
}

/**
 * Восстанавливает одну группу ботов одного проекта последовательно (один WorkerPool).
 * @param group - Инстансы одного projectId
 * @returns Счётчики успеха и неудач
 */
async function restoreProjectGroup(
  group: Awaited<ReturnType<typeof storage.getAllBotInstances>>,
): Promise<RestoreGroupResult> {
  let restored = 0;
  const failedTokenIds: number[] = [];
  const groupTotal = group.length;

  for (let i = 0; i < group.length; i++) {
    const instance = group[i];
    const tokenId = instance.tokenId;

    try {
      console.log(
        `[Restore] ${i + 1}/${groupTotal} projectId=${instance.projectId} tokenId=${tokenId}`,
      );
      console.log(
        `▶️ Восстанавливаем бота: projectId=${instance.projectId}, tokenId=${tokenId}`,
      );

      const tokenRecord = tokenId ? await storage.getBotToken(tokenId) : undefined;
      const launchToken = tokenRecord?.token;

      if (!launchToken || !tokenId) {
        console.error(
          `❌ Нет валидного токена для восстановления projectId=${instance.projectId} tokenId=${tokenId}`,
        );
        await storage.updateBotInstance(instance.id, {
          status: "error",
          errorMessage: "Нет валидного токена для восстановления",
        });
        if (tokenId != null) failedTokenIds.push(tokenId);
        markTokenRestored(tokenId ?? -1);
        continue;
      }

      const inactiveError = refuseInactiveBotStart(tokenRecord.isActive);
      if (inactiveError) {
        console.log(
          `⏭ Пропуск восстановления: токен ${tokenId} недействителен (isActive=0)`,
        );
        await storage.updateBotInstance(instance.id, {
          status: "stopped",
          stoppedAt: new Date(),
          errorMessage: inactiveError,
        });
        markTokenRestored(tokenId);
        continue;
      }

      await clearBotRedisLock(launchToken, tokenId);

      const result = await startBotWithRetries(
        instance.projectId,
        launchToken,
        tokenId,
      );

      if (result.success) {
        restored += 1;
        console.log(
          `✅ Бот projectId=${instance.projectId} успешно восстановлен`
          + ` (PID: ${result.processId}, попыток: ${result.attempts})`,
        );
      } else {
        console.error(
          `❌ Не удалось восстановить бота projectId=${instance.projectId}`
          + ` tokenId=${tokenId}: ${result.error}`,
        );
        await storage.updateBotInstance(instance.id, {
          status: "error",
          errorMessage: result.error ?? "Ошибка при восстановлении после рестарта",
        });
        failedTokenIds.push(tokenId);
      }
    } catch (err) {
      console.error(
        `❌ Ошибка при восстановлении бота projectId=${instance.projectId}:`,
        err,
      );
      await storage.updateBotInstance(instance.id, {
        status: "error",
        errorMessage: String(err),
      });
      if (tokenId != null) failedTokenIds.push(tokenId);
    } finally {
      if (tokenId != null) {
        markTokenRestored(tokenId);
      }
    }

    if (i < group.length - 1) {
      await waitRestoreStagger(RESTORE_START_STAGGER_MS);
    }
  }

  return { restored, failedTokenIds };
}

/**
 * Восстанавливает все боты, которые были запущены до перезапуска сервера.
 * Проекты поднимаются параллельно; внутри проекта — последовательно.
 *
 * @returns Итог: сколько поднято и список неудачных tokenId
 */
export async function restoreRunningBots(): Promise<RestoreRunningBotsResult> {
  const empty: RestoreRunningBotsResult = { total: 0, restored: 0, failedTokenIds: [] };

  try {
    console.log("🔄 Восстанавливаем запущенные боты после рестарта...");

    const allInstances = await storage.getAllBotInstances();
    const runningInstances = allInstances.filter(
      (i) =>
        i.status === "running" ||
        i.errorMessage === "__server_restart__" ||
        (i.status === "stopped" && !i.stoppedAt) ||
        (i.status === "stopped" && isAbruptShutdown(i.errorMessage)),
    );

    if (runningInstances.length === 0) {
      console.log("ℹ️ Нет ботов для восстановления.");
      return empty;
    }

    const tokenIds = runningInstances
      .map((i) => i.tokenId)
      .filter((id): id is number => id != null);

    markRestoreStarted(tokenIds);

    console.log(`🤖 Найдено ${runningInstances.length} бот(ов) для восстановления.`);

    const groups = groupRestoreInstancesByProject(runningInstances);
    const groupResults = await Promise.all(groups.map((g) => restoreProjectGroup(g)));

    let restored = 0;
    const failedTokenIds: number[] = [];
    for (const r of groupResults) {
      restored += r.restored;
      failedTokenIds.push(...r.failedTokenIds);
    }

    const total = runningInstances.length;
    const failedPart = failedTokenIds.length
      ? `, не удалось: token=${failedTokenIds.join(",")}`
      : "";
    console.log(`✅ Восстановление: ${restored} из ${total}${failedPart}`);

    return { total, restored, failedTokenIds };
  } catch (error) {
    console.error("❌ Критическая ошибка при восстановлении ботов:", error);
    return empty;
  } finally {
    markRestoreFinished();
  }
}

/** @internal Экспорт для unit-тестов фильтрации */
export { isAbruptShutdown };
