/**
 * @fileoverview Агрегатор OpenAPI paths тега auth.
 * @module server/swagger/paths/auth-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerAuthDevLoginPaths } from "./auth-dev-login-paths";
import { registerAuthMiniAppPaths } from "./auth-miniapp-paths";
import { registerAuthSessionPaths } from "./auth-session-paths";
import { registerAuthTelegramWidgetPaths } from "./auth-telegram-widget-paths";
import { registerAuthUserPaths } from "./auth-user-paths";

/**
 * Регистрирует все auth paths (me, logout, telegram, miniapp, dev-login, login HTML, user).
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security (все auth login публичные)
 * @returns void
 */
export function registerAuthPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  registerAuthSessionPaths(registry, publicSecurity);
  registerAuthTelegramWidgetPaths(registry, publicSecurity);
  registerAuthMiniAppPaths(registry, publicSecurity);
  registerAuthDevLoginPaths(registry, publicSecurity);
  registerAuthUserPaths(registry, publicSecurity);
}
