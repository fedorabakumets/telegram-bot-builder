/** @fileoverview Проверка настроек Node-приёмника без загрузки пользовательского сценария. */
import { buildWorkerBaseEnv } from "../../bots/workerBaseEnv";
import type { PollingBot } from "./dispatcherTypes";

/** Команда панели после подстановки проверенного пути сборки. */
export interface ProcessStartCommand {
  /** Вид команды. */
  cmd: string;
  /** Идентификатор токена. */
  token_id: number;
  /** Токен Telegram. */
  token: string;
  /** Локальный путь сборки. */
  bot_file: string;
  /** Явные переменные бота. */
  env?: Record<string, string>;
  /** Адрес webhook, несовместимого с данным polling-режимом. */
  webhook_url?: string;
}

/** Определяет именно явно выбранный process, оставляя другие режимы старому воркеру. */
export function usesNodePolling(command: ProcessStartCommand): boolean {
  const env = { ...buildWorkerBaseEnv(), ...(command.env ?? {}) };
  if (env.BOT_POLLING_MODE !== "process") return false;
  const selected = env.BOT_ON_DEMAND_TOKEN_IDS?.trim();
  return !selected || selected.split(",").some((value) => Number(value.trim()) === command.token_id);
}

/** Проверяет настройки до lease; предел процессов проверяется только для изолированного обработчика. */
export function processPollingBot(command: ProcessStartCommand, workerKey: string, instance: string,
  isolated = true): PollingBot {
  if (!Number.isSafeInteger(command.token_id) || command.token_id <= 0 || !command.token || !command.bot_file)
    throw new Error("Не указаны корректные token_id, token или bot_file");
  if (command.webhook_url) throw new Error("Режим process пока несовместим с webhook");
  const env = { ...buildWorkerBaseEnv(), ...(command.env ?? {}) } as Record<string, string>;
  if (!env.REDIS_URL) throw new Error("Для режима process требуется REDIS_URL");
  const idleTimeout = Number(env.BOT_ON_DEMAND_IDLE_SECONDS ?? "30");
  const maximum = Number(env.BOT_ON_DEMAND_MAX_ACTIVE ?? "0");
  if (!Number.isFinite(idleTimeout) || idleTimeout < 0.1 || idleTimeout > 86400
    || (isolated && (!Number.isInteger(maximum) || maximum < 0 || maximum > 64)))
    throw new Error("Недопустимые ограничения режима process");
  return { tokenId: command.token_id, token: command.token, botFile: command.bot_file,
    env, projectId: Number(workerKey), idleTimeout, workerKey, instance };
}

/** Возвращает Telegram ID для общего с Python пространства очередей, отличного от ID строки БД. */
export function telegramPollingId(token: string): number {
  const prefix = token.split(":", 1)[0];
  const id = Number(prefix);
  if (!/^\d+$/.test(prefix) || !Number.isSafeInteger(id) || id <= 0)
    throw new Error("Некорректный идентификатор Telegram");
  return id;
}
