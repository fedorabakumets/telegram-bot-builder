/**
 * @fileoverview Тесты флага Secure у admin-cookie и сравнения ключа входа
 * @module server/admin/admin-session.test
 */

import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import type { Response } from "express";
import { adminKeysMatch } from "./admin-key-match";
import { setAdminCookie } from "./admin-session";

/** NODE_ENV до тестов, чтобы вернуть окружение как было */
const savedNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = savedNodeEnv;
});

/**
 * Минимальный ответ: запоминает значение Set-Cookie.
 * @returns Мок и чтение заголовка
 */
function mockCookieRes(): { res: Response; header: () => string } {
  let value = "";
  const res = {
    setHeader(_name: string, headerValue: string) {
      value = headerValue;
    },
  };
  return { res: res as unknown as Response, header: () => value };
}

describe("setAdminCookie Secure", () => {
  it("в production всегда ставит ; Secure, даже если secure=false", () => {
    process.env.NODE_ENV = "production";
    for (const secure of [false, undefined, true] as const) {
      const box = mockCookieRes();
      setAdminCookie(box.res, "signing-secret", secure);
      const header = box.header();
      assert.ok(header.includes("; Secure"), `secure=${String(secure)}: ${header}`);
      assert.ok(header.includes("HttpOnly") && header.includes("SameSite=Lax"));
      assert.ok(header.includes("Max-Age=604800"));
    }
  });

  it("вне production без аргумента cookie без Secure", () => {
    process.env.NODE_ENV = "development";
    const box = mockCookieRes();
    setAdminCookie(box.res, "signing-secret");
    assert.ok(!box.header().includes("; Secure"));
    assert.ok(box.header().includes("HttpOnly"));
  });

  it("вне production с secure: true ставит Secure", () => {
    process.env.NODE_ENV = "development";
    const box = mockCookieRes();
    setAdminCookie(box.res, "signing-secret", true);
    assert.ok(box.header().includes("; Secure"));
  });
});

describe("adminKeysMatch", () => {
  const key = "correct-admin-key";

  it("принимает равный ключ", () => {
    assert.strictEqual(adminKeysMatch(key, key), true);
  });

  it("отклоняет пустой, короткий и другой ключ", () => {
    assert.strictEqual(adminKeysMatch("", key), false);
    assert.strictEqual(adminKeysMatch("short", key), false);
    assert.strictEqual(adminKeysMatch("another-admin-key", key), false);
  });
});
