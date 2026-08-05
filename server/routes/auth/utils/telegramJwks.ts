/**
 * @fileoverview Утилита верификации id_token от Telegram Login (OIDC)
 *
 * Проверяет JWT через публичные ключи JWKS endpoint Telegram.
 * Кэширует ключи в памяти на 1 час для снижения нагрузки.
 *
 * @module auth/utils/telegramJwks
 */

import { createPublicKey, createVerify } from "crypto";

/** URL публичных ключей Telegram JWKS */
const JWKS_URL = "https://oauth.telegram.org/jwks";

/** Время жизни кэша ключей в миллисекундах (1 час) */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Кэшированные JWKS ключи */
let jwksCache: { keys: JwkKey[]; fetchedAt: number } | null = null;

/**
 * Структура одного JWK ключа из JWKS endpoint
 */
interface JwkKey {
    /** Идентификатор ключа */
    kid: string;
    /** Тип ключа */
    kty: string;
    /** Алгоритм */
    alg: string;
    /** Использование ключа */
    use: string;
    /** Модуль RSA (base64url) */
    n: string;
    /** Экспонента RSA (base64url) */
    e: string;
}

/**
 * Результат успешной верификации id_token
 */
export interface VerifiedTelegramIdToken {
    /** Telegram user id из claim sub */
    sub: string;
    /** Срок действия (unix) */
    exp?: number;
}

/**
 * Сбрасывает кэш JWKS (для тестов)
 */
export function resetJwksCache(): void {
    jwksCache = null;
}

/**
 * Подменяет кэш JWKS (для тестов)
 *
 * @param keys - Массив JWK ключей
 */
export function setJwksCacheForTests(keys: JwkKey[]): void {
    jwksCache = { keys, fetchedAt: Date.now() };
}

/**
 * Загружает JWKS ключи Telegram с кэшированием
 *
 * @returns Массив JWK ключей
 */
export async function fetchJwks(): Promise<JwkKey[]> {
    const now = Date.now();
    if (jwksCache && now - jwksCache.fetchedAt < CACHE_TTL_MS) {
        return jwksCache.keys;
    }

    const res = await fetch(JWKS_URL);
    if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
    const data = await res.json() as { keys: JwkKey[] };

    jwksCache = { keys: data.keys, fetchedAt: now };
    return data.keys;
}

/**
 * Верифицирует RSA-подпись JWT по JWK
 *
 * @param idToken - Полная JWT-строка
 * @param jwk - Ключ из JWKS
 * @returns true если подпись валидна
 */
function verifyRsaSignature(idToken: string, jwk: JwkKey): boolean {
    const lastDot = idToken.lastIndexOf(".");
    if (lastDot < 0) return false;

    const signedContent = idToken.slice(0, lastDot);
    const signatureB64 = idToken.slice(lastDot + 1);
    const signature = Buffer.from(signatureB64, "base64url");

    const keyObject = createPublicKey({
        key: { kty: jwk.kty, n: jwk.n, e: jwk.e },
        format: "jwk",
    });

    const verifier = createVerify("RSA-SHA256");
    verifier.update(signedContent);
    verifier.end();
    return verifier.verify(keyObject, signature);
}

/**
 * Верифицирует id_token (JWT) от Telegram Login через JWKS
 *
 * @param idToken - JWT строка из поля id_token callback'а
 * @returns Данные payload при успехе, null при ошибке
 */
export async function verifyTelegramIdToken(
    idToken: string,
): Promise<VerifiedTelegramIdToken | null> {
    try {
        const parts = idToken.split(".");
        if (parts.length !== 3) return null;

        const [headerB64, payloadB64] = parts;
        const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
        const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

        if (!header.kid) {
            console.warn("⚠️ Telegram id_token: отсутствует kid");
            return null;
        }

        const keys = await fetchJwks();
        const jwk = keys.find((k) => k.kid === header.kid);
        if (!jwk) {
            console.warn("⚠️ Telegram id_token: ключ не найден в JWKS");
            return null;
        }

        if (!verifyRsaSignature(idToken, jwk)) {
            console.warn("⚠️ Telegram id_token: невалидная подпись");
            return null;
        }

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.warn("⚠️ Telegram id_token истёк");
            return null;
        }

        if (!payload.sub) {
            console.warn("⚠️ Telegram id_token: отсутствует sub");
            return null;
        }

        return { sub: String(payload.sub), exp: payload.exp };
    } catch (err) {
        console.error("Ошибка верификации Telegram id_token:", err);
        return null;
    }
}
