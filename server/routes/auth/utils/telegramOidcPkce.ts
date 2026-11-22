/**
 * @fileoverview PKCE и state для Telegram OIDC redirect-flow.
 */

import { createHash, randomBytes } from "crypto";

/**
 * Генерирует code_verifier (43–128 символов base64url).
 * @returns Случайный verifier
 */
export function createCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Считает S256 code_challenge из verifier.
 * @param verifier - code_verifier
 * @returns code_challenge
 */
export function createCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Генерирует CSRF state для OIDC.
 * @returns Случайный state
 */
export function createOidcState(): string {
  return randomBytes(16).toString("base64url");
}
