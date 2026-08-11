/**
 * @fileoverview Примеры JSON для OpenAPI project-users.
 * @module server/swagger/paths/bot-users-examples
 */

/** GET /users — пагинированный список */
export const BOT_USERS_PAGE_EXAMPLE = {
  users: [
    {
      id: 1,
      userId: "123456789",
      userName: "ivan",
      firstName: "Иван",
      lastName: "Петров",
      isActive: true,
      isGroup: false,
      interactionCount: 12,
      lastInteraction: "2026-08-10T12:00:00.000Z",
    },
  ],
  total: 120,
  hasMore: true,
};

/** PUT body — активировать */
export const BOT_USER_PUT_ACTIVATE_EXAMPLE = { isActive: 1 };

/** PUT body — деактивировать */
export const BOT_USER_PUT_DEACTIVATE_EXAMPLE = { isActive: 0 };

/** PUT 200 — строка bot_users */
export const BOT_USER_ROW_EXAMPLE = {
  user_id: "123456789",
  project_id: 42,
  token_id: 7,
  username: "ivan",
  first_name: "Иван",
  is_active: 1,
};

/** DELETE one 200 */
export const BOT_USER_DELETE_OK_EXAMPLE = {
  message: "User data deleted successfully",
};

/** GET /users/stats */
export const BOT_USERS_STATS_EXAMPLE = {
  totalUsers: 150,
  activeUsers: 120,
  blockedUsers: 30,
  premiumUsers: 12,
  usersWithResponses: 45,
  totalInteractions: 3200,
  avgInteractionsPerUser: 21,
  uniqueLanguages: 5,
  deepLinkUsers: 40,
  referralUsers: 18,
};

/** GET /users/traffic */
export const BOT_USERS_TRAFFIC_EXAMPLE = {
  sources: [
    { param: "direct", count: 80, percentage: 53.3 },
    { param: "instagram", count: 40, percentage: 26.7 },
  ],
  languages: [
    { code: "ru", count: 100, percentage: 66.7 },
    { code: "en", count: 50, percentage: 33.3 },
  ],
};

/** GET /users/growth */
export const BOT_USERS_GROWTH_EXAMPLE = [
  { date: "2026-08-01T00:00:00.000Z", count: 5 },
  { date: "2026-08-02T00:00:00.000Z", count: 3 },
];

/** GET /users/growth-by-source */
export const BOT_USERS_GROWTH_BY_SOURCE_EXAMPLE = [
  { date: "2026-08-01T00:00:00.000Z", sources: { direct: 3, instagram: 2 } },
  { date: "2026-08-02T00:00:00.000Z", sources: { direct: 1 } },
];

/** GET /users/popular-buttons */
export const BOT_USERS_POPULAR_BUTTONS_EXAMPLE = [
  { label: "Купить", count: 42 },
  { label: "Помощь", count: 18 },
];

/** GET /users/variables */
export const BOT_USERS_VARIABLES_EXAMPLE = {
  columns: ["user_id", "username", "city", "age"],
  rows: [{ user_id: "123", username: "ivan", city: "Москва", age: "25" }],
};

/** DELETE /users wipe 200 */
export const BOT_USERS_WIPE_OK_EXAMPLE = {
  message: "All user data deleted successfully",
  deleted: true,
  deletedCount: 250,
};

/** 403 project access */
export const BOT_USERS_FORBIDDEN_EXAMPLE = {
  message: "Нет прав доступа к проекту",
};
