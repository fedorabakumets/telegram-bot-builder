/**
 * @fileoverview Пул воркеров включён, пока USE_WORKER_POOL не равен строке false
 * @module server/bots/isWorkerPoolEnabled
 */

import { runtimeEnv } from "../services/runtime-overlay";

/**
 * Включён ли пул воркеров.
 * Выключается только явным значением false — так было до админки.
 * @param env - Окружение; чужой объект оверлей не видит
 * @returns false только при значении false
 */
export function isWorkerPoolEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return runtimeEnv("USE_WORKER_POOL", env) !== "false";
}
