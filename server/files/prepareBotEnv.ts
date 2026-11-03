/**
 * @fileoverview Подготовка файла и полного словаря переменных конкретного бота.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildBotEnvContent, getBotEnvSource, parseBotEnv, retireBotEnvFile } from "./botEnv";
import { isRemoteProject } from "../bots/botPlacement";

/** Результат подготовки переменных для артефактов и команды запуска. */
interface PreparedBotEnv {
  /** Путь к записанному файлу в режиме file. */
  envPath?: string;
  /** Полный словарь только из сформированного окружения конкретного бота. */
  env: Record<string, string>;
}

/**
 * Готовит полный словарь в обоих режимах, сохраняя файловый артефакт в режиме file.
 * @param botDir - Папка бота.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор токена.
 * @returns Словарь для команды запуска и необязательный путь к .env.
 */
export async function prepareBotEnv(
  botDir: string,
  projectId: number,
  tokenId: number,
): Promise<PreparedBotEnv> {
  const content = await buildBotEnvContent(botDir, projectId, tokenId);
  // Не используем process.env: секреты панели не должны попасть в словарь бота.
  const env = parseBotEnv(content);
  if (getBotEnvSource() === "inline" || isRemoteProject(projectId)) {
    await retireBotEnvFile(botDir, projectId);
    return { env };
  }
  const envPath = join(botDir, ".env");
  writeFileSync(envPath, content, "utf8");
  return { envPath, env };
}
