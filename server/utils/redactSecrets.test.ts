/**
 * @fileoverview Тесты маскирования секретов в журнале сервера
 * @module server/utils/redactSecrets.test
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { REDACTED, redactSecrets } from "./redactSecrets";

/** Похожая на настоящую StringSession Telethon: "1" + base64 ключа */
const SESSION = "1" + "BVtsOK8Bu7-_Ab12".repeat(22) + "=";

describe("redactSecrets", () => {
  it("скрывает session_string в JSON ответа sign-in", () => {
    const line = `POST /api/projects/1/tokens/1/userbot/sign-in 200 in 900ms :: {"ok":true,"session_string":"${SESSION}"}`;
    const out = redactSecrets(line);
    assert.ok(!out.includes(SESSION.slice(0, 40)));
    assert.ok(out.includes(`"session_string":"${REDACTED}"`));
  });

  it("скрывает голую StringSession, строки .env и пароль", () => {
    const out = redactSecrets(`env: USERBOT_SESSION_STRING=${SESSION} USERBOT_API_HASH=abc сессия ${SESSION} {"password":"qwerty"}`);
    assert.ok(!out.includes(SESSION.slice(0, 40)) && !out.includes("abc") && !out.includes("qwerty"));
  });

  it("скрывает токен бота, оставляя ID", () => {
    const out = redactSecrets("token 8822449083:AAGTJ7eSOytnwso6SECRETSECRETSECRETxx");
    assert.strictEqual(out, `token 8822449083:${REDACTED}`);
  });

  it("обычные строки не меняются", () => {
    const line = 'GET /api/projects/1/tokens 200 in 5ms :: [{"id":1,"userbotSessionString":"••••••••"}]';
    assert.strictEqual(redactSecrets(line).includes("id"), true);
    assert.strictEqual(redactSecrets("Бот 1 запущен, PROJECT_ID=1"), "Бот 1 запущен, PROJECT_ID=1");
  });
});
