/**
 * @fileoverview Настройки хранения сборок ботов из переменных окружения
 * @module server/bots/builds/botBuildConfig
 */

import { runtimeEnv } from "../../services/runtime-overlay";

/** Источник кода бота: только диск или диск + хранилище сборок */
export type BotArtifactSource = "disk" | "storage";

/** ID служебного приватного локального хранилища сборок */
export const BOT_BUILDS_LOCAL_ID = "bot-builds-local";

/** Папка приватного локального хранилища по умолчанию (не раздаётся по HTTP) */
export const DEFAULT_BOT_BUILDS_DIR = ".bot-builds";

/** Сколько последних сборок хранить на токен по умолчанию */
export const DEFAULT_BOT_BUILDS_KEEP = 3;

/**
 * Возвращает режим источника кода из `BOT_ARTIFACT_SOURCE`.
 * @param env - Переменные окружения
 * @returns "storage" только при явном включении, иначе "disk"
 */
export function getBotArtifactSource(env: NodeJS.ProcessEnv = process.env): BotArtifactSource {
  return runtimeEnv("BOT_ARTIFACT_SOURCE", env)?.toLowerCase() === "storage" ? "storage" : "disk";
}

/**
 * Включено ли хранение сборок в хранилище.
 * @param env - Переменные окружения
 * @returns true в режиме "storage"
 */
export function isBotBuildStorageEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return getBotArtifactSource(env) === "storage";
}

/**
 * Сколько сборок хранить на токен (`BOT_BUILDS_KEEP`, минимум 1).
 * @param env - Переменные окружения
 * @returns Количество сохраняемых сборок
 */
export function getBotBuildsKeep(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number.parseInt(runtimeEnv("BOT_BUILDS_KEEP", env) ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : DEFAULT_BOT_BUILDS_KEEP;
}

/**
 * ID хранилища из `storage_configs` для сборок (`BOT_BUILDS_STORAGE_ID`).
 * @param env - Переменные окружения
 * @returns ID конфига или null — тогда используется приватная локальная папка
 */
export function getBotBuildsStorageId(env: NodeJS.ProcessEnv = process.env): string | null {
  return runtimeEnv("BOT_BUILDS_STORAGE_ID", env) ?? null;
}

/**
 * Папка приватного локального хранилища (`BOT_BUILDS_DIR`).
 * @param env - Переменные окружения
 * @returns Путь относительно cwd или абсолютный
 */
export function getBotBuildsDir(env: NodeJS.ProcessEnv = process.env): string {
  return runtimeEnv("BOT_BUILDS_DIR", env) || DEFAULT_BOT_BUILDS_DIR;
}
