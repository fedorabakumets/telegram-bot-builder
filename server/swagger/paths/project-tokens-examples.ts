/**
 * @fileoverview Примеры JSON для OpenAPI project-tokens.
 * @module server/swagger/paths/project-tokens-examples
 */

/** Публичный токен + botId (GET …/tokens) */
export const PUBLIC_TOKEN_WITH_BOT_ID_EXAMPLE = {
  id: 7,
  projectId: 42,
  ownerId: 123456789,
  name: "Основной бот",
  token: "7123456789:••••••••",
  isDefault: 1,
  isActive: 1,
  botUsername: "my_bot",
  botFirstName: "My Bot",
  messagesRetentionDays: 60,
  autoRestart: 0,
  maxRestartAttempts: 3,
  logLevel: "WARNING",
  protectContent: 0,
  saveIncomingMedia: 0,
  catchAllHandlers: 1,
  contentCache: 1,
  launchMode: "polling",
  webhookBaseUrl: null as string | null,
  webhookSecretToken: null as string | null,
  userbotEnabled: 0,
  userbotApiId: null as string | null,
  userbotApiHash: null as string | null,
  userbotSessionString: null as string | null,
  botId: "7123456789",
};

/** Элемент GET …/tokens/list */
export const TOKEN_LIST_ITEM_EXAMPLE = {
  id: 7,
  name: "Основной бот",
  botUsername: "my_bot",
  botFirstName: "My Bot",
  isDefault: 1,
  isActive: 1,
  projectId: 42,
  messagesRetentionDays: 60,
};

/** GET …/tokens/first с секретом */
export const TOKENS_FIRST_EXAMPLE = {
  hasToken: true,
  token: "7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
};

/** Parse success */
export const PARSE_TOKEN_EXAMPLE = {
  botFirstName: "My Bot",
  botUsername: "my_bot",
  botDescription: "Описание бота",
  botShortDescription: "Кратко",
  botPhotoUrl: null as string | null,
  botCanJoinGroups: 1,
  botCanReadAllGroupMessages: 0,
  botSupportsInlineQueries: 0,
  botHasMainWebApp: 0,
};

/** Env list */
export const ENV_LIST_EXAMPLE = {
  items: [
    {
      id: 15,
      tokenId: 7,
      key: "API_KEY",
      value: "••••••••",
      isSecret: 1,
    },
  ],
  count: 1,
};

/** Live log row */
export const LIVE_LOG_EXAMPLE = {
  id: 1001,
  projectId: 42,
  tokenId: 7,
  launchId: null as number | null,
  content: "Bot started successfully",
  type: "stdout",
  timestamp: "2026-08-11T12:00:00.000Z",
};

/** 403 пример */
export const PROJECT_TOKENS_FORBIDDEN_EXAMPLE = {
  message: "You don't have permission to view this project's tokens",
};
