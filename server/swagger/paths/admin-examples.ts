/**
 * @fileoverview Примеры JSON для OpenAPI тега admin.
 * @module server/swagger/paths/admin-examples
 */

/** GET /admin/api/app-settings */
export const ADMIN_APP_SETTINGS_GET_EXAMPLE = {
  configured: true,
  auth: { loginMode: "dev_login", devLoginEnabled: true },
  providers: {
    telegram: {
      clientId: "123456789",
      botUsername: "my_bot",
      clientSecretConfigured: true,
      botTokenConfigured: true,
      configured: true,
    },
  },
};

/** Тело PUT /admin/api/app-settings */
export const ADMIN_APP_SETTINGS_PUT_BODY_EXAMPLE = {
  auth: { loginMode: "dev_login" as const },
  telegram: {
    clientId: "123456789",
    botUsername: "my_bot",
    clientSecret: "",
    botToken: "",
  },
};

/** Успех PUT app-settings */
export const ADMIN_APP_SETTINGS_SAVE_EXAMPLE = {
  success: true as const,
  configured: true,
  auth: { loginMode: "dev_login", devLoginEnabled: true },
  providers: { telegram: { configured: true, botUsername: "my_bot" } },
};

/** Seed refresh/recreate OK */
export const ADMIN_TEMPLATE_SEED_OK_EXAMPLE = {
  message: "Templates refreshed successfully",
  timestamp: "2026-08-08T19:00:00.000Z",
};

/** Featured PATCH body */
export const ADMIN_FEATURED_BODY_EXAMPLE = { featured: 1 as const };

/** 401 */
export const ADMIN_UNAUTHORIZED_EXAMPLE = { error: "ADMIN_UNAUTHORIZED" as const };

/** GET /admin/api/version */
export const ADMIN_VERSION_EXAMPLE = {
  version: "2.2.1.4",
  releasedAt: "2026-10-02",
  notesUrl: null,
};

/** GET /admin/api/update-check */
export const ADMIN_UPDATE_CHECK_EXAMPLE = {
  current: { version: "2.2.1.4", releasedAt: "2026-10-02" },
  latest: { version: "2.2.1.4", releasedAt: "2026-10-02", notesUrl: null },
  updateAvailable: false,
  checkFailed: false,
  deployGuideUrl: "https://github.com/org/telegram-bot-builder",
};

/** GET /admin/api/users */
export const ADMIN_PLATFORM_USERS_LIST_EXAMPLE = {
  items: [
    {
      id: 123456789,
      firstName: "Иван",
      lastName: "Петров",
      username: "ivan_bot",
      photoUrl: null,
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-03-10T09:15:00.000Z",
      ownedCount: 2,
      sharedCount: 1,
    },
  ],
  total: 1,
  page: 1,
  perPage: 25,
};

/** GET /admin/api/users/{id} */
export const ADMIN_PLATFORM_USER_DETAIL_EXAMPLE = {
  user: {
    id: 123456789,
    firstName: "Иван",
    lastName: "Петров",
    username: "ivan_bot",
    photoUrl: null,
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: "2026-03-10T09:15:00.000Z",
  },
  ownedProjects: [
    {
      id: 42,
      name: "Мой бот",
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-03-01T12:30:00.000Z",
    },
  ],
  sharedProjects: [
    {
      id: 7,
      name: "Командный проект",
      createdAt: "2026-02-01T11:00:00.000Z",
      updatedAt: "2026-02-28T16:00:00.000Z",
      ownerId: 987654321,
      ownerDisplayName: "@team_lead",
    },
  ],
};

/** Блок curl: login + вызов (подставить PATH) */
export const ADMIN_CURL_LOGIN =
  "curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \\\n" +
  "  -H 'Content-Type: application/x-www-form-urlencoded' \\\n" +
  "  -d 'key=YOUR_ADMIN_API_KEY'";
