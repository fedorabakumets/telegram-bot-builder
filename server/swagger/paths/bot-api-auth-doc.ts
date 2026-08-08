/**
 * @fileoverview Общий текст Auth/actor для OpenAPI тега bot.
 * @module server/swagger/paths/bot-api-auth-doc
 */

/** Описание session / PAT / bot_manager для всех `/api/bot/*` */
export const BOT_API_AUTH_DOC =
  "**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.\n\n" +
  "**Actor:**\n" +
  "- Личная сессия / обычный PAT → `req.user.id`; query `telegram_id` если есть — только свой, иначе **403**.\n" +
  "- PAT scope **`bot_manager`** → actor = обязательный `telegram_id` " +
  "(Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}`).\n\n" +
  "Подробнее: `docs/features/bot-manager-api-auth.md`.\n\n";
