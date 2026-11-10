/**
 * @fileoverview Проверка версии намерения в PostgreSQL перед выполнением команды бота.
 * @module server/runner/runnerCommandFence
 */

import { eq } from "drizzle-orm";
import { botInstances } from "@shared/schema/tables/bot-instances";
import { db } from "../database/db";

/** Поля защиты, переданные вместе с командой воркеру. */
export interface BotCommandFence {
  /** ID экземпляра бота в базе */
  instance_id: number;
  /** Версия желаемого состояния */
  desired_generation: number;
  /** ID токена для исключения перепутанных экземпляров */
  token_id: number;
}

/**
 * Проверяет актуальность команды в авторитетной базе данных.
 * @param fence - Идентификаторы команды
 * @param operation - Запуск или остановка
 * @returns true только для актуальной версии
 */
export async function isCurrentBotCommand(fence: BotCommandFence, operation: "start_bot" | "stop_bot"): Promise<boolean> {
  if (!Number.isSafeInteger(fence.instance_id) || !Number.isSafeInteger(fence.desired_generation)
    || !Number.isSafeInteger(fence.token_id)) return false;
  const [instance] = await db.select({
    tokenId: botInstances.tokenId,
    desiredStatus: botInstances.desiredStatus,
    desiredGeneration: botInstances.desiredGeneration,
  }).from(botInstances).where(eq(botInstances.id, fence.instance_id)).limit(1);
  if (!instance || instance.tokenId !== fence.token_id || instance.desiredGeneration !== fence.desired_generation) return false;
  return operation === "start_bot" ? instance.desiredStatus === "running" : true;
}
