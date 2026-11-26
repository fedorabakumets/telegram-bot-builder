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

/** POST restart-all 202: принятие без обещания успешного перезапуска. */
export const PROJECT_BOT_RESTART_ALL_EXAMPLE = {
  jobId: "6c93054e-074a-4d15-9d72-c2e09f8eb7dc", projectId: 42, status: "queued",
  progress: { phase: "queued", total: 0, completed: 0, stopped: 0, stopFailed: 0,
    attempted: 0, restarted: 0, failed: 0, results: [] },
  createdAt: "2026-11-21T09:00:00.000Z", updatedAt: "2026-11-21T09:00:00.000Z",
};

/** 403 */
export const PROJECT_BOT_FORBIDDEN_EXAMPLE = {
  message: "Нет прав доступа к проекту",
};
