/**
 * @fileoverview Кто может выдать PAT со scope bot_manager.
 * @module agentTokens/can-create-bot-manager-scope
 */

/**
 * Разрешено ли пользователю создать PAT с scope bot_manager.
 * Production: id в BOT_MANAGER_ADMIN_IDS (через запятую).
 * Development: разрешено всем (удобство локальной настройки).
 * @param userId - Telegram id создателя токена
 * @returns true, если scope можно выдать
 */
export function canCreateBotManagerScope(userId: number): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  const raw = process.env.BOT_MANAGER_ADMIN_IDS ?? "";
  const allowed = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);
  return allowed.includes(userId);
}
