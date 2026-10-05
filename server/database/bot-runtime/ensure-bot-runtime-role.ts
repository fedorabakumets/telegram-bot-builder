/**
 * @fileoverview Вызов провижининга роли bot_runtime при старте панели
 * @module server/database/bot-runtime/ensure-bot-runtime-role
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { resolveBotDatabaseUrl, warnBotRuntimeIfNeeded } from "../../bots/resolveBotDatabaseUrl";
import { passwordFromDatabaseUrl, quoteRolePassword } from "./quote-role-password";

/** Текст политик рядом с этим модулем */
const SQL_PATH = join(dirname(fileURLToPath(import.meta.url)), "bot-runtime-role.sql");

/**
 * Создаёт роль, права и политики, если флаг включён и BOT_DATABASE_URL задан.
 * Ошибка SQL пишется в лог и не останавливает панель.
 * Пустой адрес тоже не роняет старт: боты остаются на DATABASE_URL панели.
 * @param env - Окружение сервера
 */
export async function ensureBotRuntimeRole(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  warnBotRuntimeIfNeeded(env);
  const decision = resolveBotDatabaseUrl(env);
  if (!decision.useBotRuntime || !decision.databaseUrl) return;

  const panelUrl = env.DATABASE_URL?.trim();
  if (!panelUrl) {
    console.warn("⚠️ BOT_RUNTIME_ENABLED включён, но DATABASE_URL панели пуст. Роль bot_runtime не создаётся.");
    return;
  }

  let password = "";
  try {
    password = passwordFromDatabaseUrl(decision.databaseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ BOT_DATABASE_URL не разобран, роль bot_runtime не создаётся: ${message}`);
    return;
  }
  if (!password) {
    console.warn("⚠️ В BOT_DATABASE_URL нет пароля. Роль bot_runtime не создаётся.");
    return;
  }

  const client = new Client({ connectionString: panelUrl });
  try {
    await client.connect();
    await client.query(readFileSync(SQL_PATH, "utf8"));
    await client.query(`ALTER ROLE bot_runtime WITH LOGIN PASSWORD ${quoteRolePassword(password)}`);
    console.log("🔐 Роль bot_runtime проверена");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Не удалось подготовить роль bot_runtime: ${message}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}
