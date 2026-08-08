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

/** Блок curl: login + вызов (подставить PATH) */
export const ADMIN_CURL_LOGIN =
  "curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \\\n" +
  "  -H 'Content-Type: application/x-www-form-urlencoded' \\\n" +
  "  -d 'key=YOUR_ADMIN_API_KEY'";
