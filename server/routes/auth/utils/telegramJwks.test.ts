/**
 * @fileoverview Тесты верификации Telegram id_token (JWKS / RSA)
 * @module auth/utils/telegramJwks.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import { generateKeyPairSync, createSign } from "crypto";
import {
  verifyTelegramIdToken,
  setJwksCacheForTests,
  resetJwksCache,
} from "./telegramJwks";

/**
 * Кодирует объект в base64url JSON
 * @param obj - Объект
 * @returns base64url строка
 */
function b64urlJson(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

/**
 * Собирает подписанный JWT
 * @param header - JWT header
 * @param payload - JWT payload
 * @param privateKey - RSA private key PEM
 * @returns JWT строка
 */
function signJwt(
  header: object,
  payload: object,
  privateKey: string,
): string {
  const h = b64urlJson(header);
  const p = b64urlJson(payload);
  const content = `${h}.${p}`;
  const signer = createSign("RSA-SHA256");
  signer.update(content);
  signer.end();
  const sig = signer.sign(privateKey).toString("base64url");
  return `${content}.${sig}`;
}

describe("verifyTelegramIdToken", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  const jwk = publicKey.export({ format: "jwk" }) as {
    kty: string;
    n: string;
    e: string;
  };

  beforeEach(() => {
    resetJwksCache();
    setJwksCacheForTests([
      {
        kid: "test-kid",
        kty: jwk.kty,
        alg: "RS256",
        use: "sig",
        n: jwk.n,
        e: jwk.e,
      },
    ]);
  });

  it("принимает валидный JWT", async () => {
    const token = signJwt(
      { alg: "RS256", kid: "test-kid" },
      { sub: "12345", exp: Math.floor(Date.now() / 1000) + 3600 },
      privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    );

    const result = await verifyTelegramIdToken(token);
    expect(result).toEqual({ sub: "12345", exp: expect.any(Number) });
  });

  it("отклоняет истёкший JWT", async () => {
    const token = signJwt(
      { alg: "RS256", kid: "test-kid" },
      { sub: "12345", exp: Math.floor(Date.now() / 1000) - 10 },
      privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    );

    expect(await verifyTelegramIdToken(token)).toBeNull();
  });

  it("отклоняет невалидную подпись", async () => {
    const token = signJwt(
      { alg: "RS256", kid: "test-kid" },
      { sub: "12345", exp: Math.floor(Date.now() / 1000) + 3600 },
      privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    );
    const tampered = token.slice(0, -4) + "AAAA";

    expect(await verifyTelegramIdToken(tampered)).toBeNull();
  });

  it("отклоняет неизвестный kid", async () => {
    const token = signJwt(
      { alg: "RS256", kid: "unknown" },
      { sub: "12345", exp: Math.floor(Date.now() / 1000) + 3600 },
      privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    );

    expect(await verifyTelegramIdToken(token)).toBeNull();
  });
});
