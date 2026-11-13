/** @fileoverview Проверки читаемости служебных значений и маскировки настоящих секретов. */
import test from "node:test";
import assert from "node:assert/strict";
import { isSecretEnvironmentKey } from "./secret-environment-key";
import { redactChildLog } from "../runner/polling/pythonChildSupport";

test("порты, идентификаторы и публичные webhook адреса сохраняются", () => {
  const env = { TOKEN_ID: "58", PROJECT_ID: "12", WEBHOOK_PORT: "9058",
    API_BASE_URL: "https://example.com", WEBHOOK_URL: "https://example.com/api/webhook/12/58",
    AUTH_MODE: "dev", BOT_TOKEN: "123456789:AA_real_secret_token_of_sufficient_length",
    WEBHOOK_SECRET_TOKEN: "webhook-secret", USERBOT_API_HASH: "private-hash",
    USERBOT_SESSION_STRING: "private-session", REDIS_URL: "redis://user:password@redis/0" };
  const secrets = Object.entries(env).filter(([key]) => isSecretEnvironmentKey(key)).map(([, value]) => value);
  const ordinary = "Webhook сервер порт 9058, бот 58, https://example.com/api/webhook/12/58";
  assert.equal(redactChildLog(ordinary, secrets), ordinary);
  for (const key of ["TOKEN_ID", "PROJECT_ID", "WEBHOOK_PORT", "WEBHOOK_URL", "API_BASE_URL", "AUTH_MODE"]) {
    assert.equal(isSecretEnvironmentKey(key), false, key);
  }
  for (const value of secrets) assert.equal(redactChildLog(value, secrets), "[скрыто]");
});
