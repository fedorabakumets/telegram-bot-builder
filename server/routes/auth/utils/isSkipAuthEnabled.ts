/**
 * @fileoverview Флаг режима входа без Telegram proof (dev-login)
 * @module auth/utils/isSkipAuthEnabled
 */

import { isAuthSkippedSync } from "../../../services/app-settings.service";

/**
 * Dev-login включён, если в admin выбран режим dev_login
 * (или SKIP_AUTH в env не равен false до первой настройки).
 *
 * @returns true если skip-auth активен
 */
export function isSkipAuthEnabled(): boolean {
  return isAuthSkippedSync();
}
