/**
 * @fileoverview Ожидание сведений исполнителя в Redis площадки: исполнитель пишет их
 * после того, как начал слушать команды, поэтому их появление значит «площадка готова».
 * @module server/sites/waitRunnerSiteInfo
 */

import { listRunnerSiteInfos, type RunnerSiteInfo } from "../redis/runnerSiteInfo";

/** Пауза между проверками */
const POLL_MS = 3_000;

/**
 * Подключается к Redis площадки и ждёт сведения хотя бы одного исполнителя
 * @param redisUrl - Внешний адрес Redis площадки
 * @param timeoutMs - Сколько ждать
 * @returns сведения исполнителей
 * @throws Error, если сведения не появились за отведённое время
 */
export async function waitRunnerSiteInfo(redisUrl: string, timeoutMs: number): Promise<RunnerSiteInfo[]> {
  const { default: Redis } = await import("ioredis");
  const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 10_000 });
  redis.on("error", () => undefined);
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  try {
    while (Date.now() < deadline) {
      try {
        if (redis.status === "wait" || redis.status === "end") await redis.connect();
        const infos = await listRunnerSiteInfos(redis);
        if (infos.length > 0) return infos;
        lastError = "исполнитель ещё не записал сведения";
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
  } finally {
    redis.disconnect();
  }
  throw new Error(`Исполнитель площадки не ответил: ${lastError}`);
}
