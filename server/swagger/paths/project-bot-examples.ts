/**
 * @fileoverview Примеры JSON для OpenAPI project-bot.
 * @module server/swagger/paths/project-bot-examples
 */

/** GET …/bot/info */
export const PROJECT_BOT_INFO_EXAMPLE = {
  id: 123456789,
  is_bot: true,
  first_name: "Support Bot",
  username: "my_support_bot",
  photoUrl: true,
  tokenId: 7,
};

/** GET …/bot/data */
export const PROJECT_BOT_DATA_EXAMPLE = {
  id: "123456789",
  userId: "123456789",
  avatarUrl: "AgACAgIAAxkBAA",
  userName: "my_support_bot",
  firstName: "Support Bot",
  isBot: true,
};

/** POST start/restart 200 */
export const PROJECT_BOT_START_OK_EXAMPLE = {
  message: "Бот успешно запущен",
  processId: "12345",
  tokenUsed: true,
};

/** POST restart-all 200 */
export const PROJECT_BOT_RESTART_ALL_EXAMPLE = {
  restarted: 2,
  results: [
    { tokenId: 7, success: true, processId: "12345" },
    { tokenId: 8, success: true, processId: "12346" },
  ],
};

/** 403 */
export const PROJECT_BOT_FORBIDDEN_EXAMPLE = {
  message: "Нет прав доступа к проекту",
};
