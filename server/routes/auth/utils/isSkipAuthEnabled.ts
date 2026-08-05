/**
 * @fileoverview Флаг режима входа без Telegram proof (dev-login)
 * @module auth/utils/isSkipAuthEnabled
 */

/**
 * SKIP_AUTH включён по умолчанию (dev-login, форма Telegram ID).
 * Явно `SKIP_AUTH=false` — Telegram Login Widget и строгий proof в production.
 *
 * @returns true если skip-auth активен
 */
export function isSkipAuthEnabled(): boolean {
  return process.env.SKIP_AUTH !== "false";
}
