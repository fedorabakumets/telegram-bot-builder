/**
 * @fileoverview Тесты разбора PUT /userbot: маски и пустые значения не стирают секреты
 * @module server/routes/botTokens/build-userbot-update.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { buildUserbotUpdate, maskSecret, pickNewSecret, SECRET_MASK, toPublicAuthResult } from "./build-userbot-update";

describe("buildUserbotUpdate", () => {
  it("форма без сессии (null) не стирает session string и API Hash", () => {
    const parsed = buildUserbotUpdate({ userbotEnabled: 1, userbotApiId: "123", userbotApiHash: null, userbotSessionString: null });
    assert.deepStrictEqual(parsed, { update: { userbotEnabled: 1, userbotApiId: "123" } });
  });

  it("маска из ответа API и пустая строка — тоже «оставить как есть»", () => {
    const parsed = buildUserbotUpdate({ userbotEnabled: 0, userbotApiHash: SECRET_MASK, userbotSessionString: "" });
    assert.deepStrictEqual(parsed, { update: { userbotEnabled: 0 } });
  });

  it("настоящие значения сохраняются", () => {
    const parsed = buildUserbotUpdate({ userbotEnabled: 1, userbotApiId: 456, userbotApiHash: " abc ", userbotSessionString: "1AbC" });
    assert.deepStrictEqual(parsed, {
      update: { userbotEnabled: 1, userbotApiId: "456", userbotApiHash: "abc", userbotSessionString: "1AbC" },
    });
  });

  it("пустой API ID очищается, отсутствующий — не трогается", () => {
    assert.deepStrictEqual(buildUserbotUpdate({ userbotEnabled: 1, userbotApiId: "" }), { update: { userbotEnabled: 1, userbotApiId: null } });
    assert.deepStrictEqual(buildUserbotUpdate({ userbotEnabled: 1 }), { update: { userbotEnabled: 1 } });
  });

  it("неверный userbotEnabled — ошибка", () => {
    assert.ok("error" in buildUserbotUpdate({ userbotEnabled: "1" }));
    assert.ok("error" in buildUserbotUpdate(undefined));
  });
});

describe("маски секретов", () => {
  it("maskSecret и pickNewSecret", () => {
    assert.strictEqual(maskSecret("sess"), SECRET_MASK);
    assert.strictEqual(maskSecret(null), null);
    assert.strictEqual(pickNewSecret(SECRET_MASK), undefined);
    assert.strictEqual(pickNewSecret("real"), "real");
  });

  it("ответ авторизации не содержит session string", () => {
    const pub = toPublicAuthResult({ ok: true, session_string: "1SECRETSESSION" });
    assert.deepStrictEqual(pub, { ok: true, session_string: SECRET_MASK });
    assert.deepStrictEqual(toPublicAuthResult({ ok: true, needs_2fa: true }), { ok: true, needs_2fa: true });
  });
});
