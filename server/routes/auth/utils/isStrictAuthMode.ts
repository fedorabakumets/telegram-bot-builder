/**
 * @fileoverview Определяет строгий режим auth (обязательный Telegram proof)
 * @module auth/utils/isStrictAuthMode
 */

/**
 * Strict prod: NODE_ENV=production и SKIP_AUTH !== true.
 * В этом режиме POST /api/auth/telegram требует валидный id_token.
 *
 * @returns true если нужен обязательный proof
 */
export function isStrictAuthMode(): boolean {
    return (
        process.env.NODE_ENV === "production" &&
        process.env.SKIP_AUTH !== "true"
    );
}
