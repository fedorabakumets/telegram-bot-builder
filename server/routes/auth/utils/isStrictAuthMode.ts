/**
 * @fileoverview Определяет строгий режим auth (обязательный Telegram proof)
 * @module auth/utils/isStrictAuthMode
 */

import { isSkipAuthEnabled } from "./isSkipAuthEnabled";

/**
 * Strict prod: NODE_ENV=production и SKIP_AUTH=false (явно).
 * В этом режиме POST /api/auth/telegram требует валидный id_token.
 *
 * @returns true если нужен обязательный proof
 */
export function isStrictAuthMode(): boolean {
    return process.env.NODE_ENV === "production" && !isSkipAuthEnabled();
}
