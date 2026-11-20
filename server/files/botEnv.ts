/**
 * @fileoverview Переменные окружения бота: сборка из БД, режим передачи (файл или команда)
 * @module server/files/botEnv
 */

import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { parse } from "dotenv";
import { resolveBotDatabaseUrl, warnBotRuntimeIfNeeded } from "../bots/resolveBotDatabaseUrl";
import { withTelegramBotApiUrl } from "./telegramBotApiEnv";
import { withPollingRuntimeEnv, type ProjectPollingRuntimeScope } from "../bots/pollingRuntimeEnv";
import { withDatabaseRuntimeEnv } from "../bots/databaseRuntimeEnv";
import { resolveWebhookBaseUrl } from "../bots/webhookBaseUrl";
import { resolveBotLaunchMode } from "../../shared/bot-launch-mode";
import { resolveBotInheritedSettings, type BotInheritedSettings } from "../../shared/bot-inherited-settings";

/** Как переменные попадают к боту: файл .env в папке бота или поле env в команде start_bot */
export type BotEnvSource = "file" | "inline";

/** Заглушка ADMIN_IDS, если администраторы не заданы */
const ADMIN_IDS_PLACEHOLDER = "123456789";

/** Параметры транспорта и обработчика, выбранные для запуска. */
interface BotEnvLaunchSnapshot {
  /** Базовый адрес webhook либо null для polling. */
  webhookBaseUrl: string | null;
  /** Источник режима обработчика. */
  sleep?: ProjectPollingRuntimeScope;
  /** Общие и индивидуальные настройки, выбранные при запуске. */
  settings?: BotInheritedSettings;
}

/**
 * Режим передачи переменных из `BOT_ENV_SOURCE`.
 * @param env - Переменные окружения панели
 * @returns "inline" только при явном включении, иначе "file"
 */
export function getBotEnvSource(env: NodeJS.ProcessEnv = process.env): BotEnvSource {
  return env.BOT_ENV_SOURCE?.trim().toLowerCase() === "inline" ? "inline" : "file";
}

/**
 * Читает ADMIN_IDS из старого .env папки бота (для проектов, где их нет в БД).
 * @param botDir - Папка бота
 * @returns Значение или null
 */
export function readLegacyAdminIds(botDir: string): string | null {
  const envPath = join(botDir, ".env");
  if (!existsSync(envPath)) return null;
  try {
    const value = parse(readFileSync(envPath, "utf8")).ADMIN_IDS?.trim();
    return value && value !== ADMIN_IDS_PLACEHOLDER ? value : null;
  } catch {
    return null;
  }
}

/**
 * Собирает текст .env бота из БД и окружения панели — то же, что пишется в файл.
 * @param botDir - Папка бота (для старого ADMIN_IDS)
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param launch - Снимок транспорта и обработчика.
 * @returns Содержимое .env
 */
export async function buildBotEnvContent(botDir: string, projectId: number, tokenId: number, launch?: BotEnvLaunchSnapshot): Promise<string> {
  const { generateEnvFile } = await import("@shared/scaffolding-wrapper");
  const { storage } = await import("../storages/storage");
  const { resolveBotEnvVariables } = await import("../bots/resolveBotEnvReference");
  const tokenRecord = await storage.getBotToken(tokenId);
  const project = await storage.getBotProject(projectId);
  const adminIds = project?.adminIds?.trim() || readLegacyAdminIds(botDir) || ADMIN_IDS_PLACEHOLDER;

  const mode = resolveBotLaunchMode(project?.defaultLaunchMode, tokenRecord?.launchMode, tokenRecord?.inheritLaunchMode);
  const settings = launch?.settings ?? resolveBotInheritedSettings(project?.botSettingDefaults, tokenRecord);
  /** Файл и команда запуска используют один снимок адреса. */
  const webhookBaseUrl = launch ? launch.webhookBaseUrl
    : mode === "webhook" ? resolveWebhookBaseUrl(settings.webhookBaseUrl) : null;
  const webhookPort = webhookBaseUrl ? 9000 + tokenId : null;

  // Ссылки ${{VAR}} раскрываются только для разрешённых переменных сервера (botEnvPolicy)
  /** Настройки пула передаются удалённому исполнителю вместе с окружением бота. */
  const scope = launch?.sleep ?? { defaultMode: project?.defaultSleepMode, inherited: tokenRecord?.inheritSleepMode };
  /** Старый пользовательский WEBHOOK_URL не должен включать webhook при запуске через polling. */
  const ownVariables = resolveBotEnvVariables(await storage.getEnvVariables(tokenId))
    .filter(({ key }) => key !== "WEBHOOK_URL");
  const customVariables = withDatabaseRuntimeEnv(withPollingRuntimeEnv(withTelegramBotApiUrl(ownVariables), undefined, scope));
  const { isRailwayProject, railwayBotEnvDefaults } = await import("../bots/railway/railwayConfig");
  // Боту на Railway адреса панели недоступны — подставляем адреса из RAILWAY_BOT_*
  const remoteDefaults = isRailwayProject(projectId) ? railwayBotEnvDefaults() : {};
  warnBotRuntimeIfNeeded();
  const runtimeDatabase = resolveBotDatabaseUrl();
  for (const key of ["DATABASE_URL", "REDIS_URL"] as const) {
    const fallback = key === "DATABASE_URL" && runtimeDatabase.useBotRuntime
      ? runtimeDatabase.databaseUrl
      : (remoteDefaults[key] ?? process.env[key]);
    if (!customVariables.some((v) => v.key === key) && fallback) {
      customVariables.push({ key, value: fallback });
    }
  }
  if (tokenRecord?.userbotEnabled === 1) {
    const userbot = {
      USERBOT_API_ID: tokenRecord.userbotApiId,
      USERBOT_API_HASH: tokenRecord.userbotApiHash,
      USERBOT_SESSION_STRING: tokenRecord.userbotSessionString,
    };
    for (const [key, value] of Object.entries(userbot)) {
      if (value) customVariables.push({ key, value });
    }
  }

  return generateEnvFile(
    tokenRecord?.token || "YOUR_BOT_TOKEN_HERE",
    adminIds,
    projectId,
    settings.logLevel || "WARNING",
    "redis://localhost:6379",
    webhookBaseUrl,
    webhookPort,
    settings.protectContent === 1,
    settings.saveIncomingMedia === 1,
    tokenId,
    customVariables,
    settings.catchAllHandlers !== 0,
    settings.contentCache === 1,
  );
}

/**
 * Переменные бота словарём — разбор того же текста, что попал бы в .env.
 * @param content - Содержимое .env
 * @returns Имя переменной → значение
 */
export function parseBotEnv(content: string): Record<string, string> {
  return parse(content);
}

/**
 * Переход на передачу переменных в команде: переносит старый ADMIN_IDS в БД
 * (если там пусто) и удаляет .env из папки бота, чтобы секреты не лежали на диске.
 * @param botDir - Папка бота
 * @param projectId - ID проекта
 */
export async function retireBotEnvFile(botDir: string, projectId: number): Promise<void> {
  const envPath = join(botDir, ".env");
  if (!existsSync(envPath)) return;
  const legacy = readLegacyAdminIds(botDir);
  if (legacy) {
    const { storage } = await import("../storages/storage");
    const project = await storage.getBotProject(projectId);
    if (!project?.adminIds?.trim()) {
      await storage.updateBotProject(projectId, { adminIds: legacy });
      console.log(`👮 ADMIN_IDS проекта ${projectId} перенесены из .env в БД`);
    }
  }
  rmSync(envPath, { force: true });
}
