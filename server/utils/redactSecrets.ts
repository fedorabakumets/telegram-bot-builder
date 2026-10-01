/**
 * @fileoverview Маскирование секретов в строках журнала сервера.
 * Скрывает session string Telethon (даёт полный доступ к аккаунту Telegram),
 * токены ботов и значения секретных полей JSON.
 * @module server/utils/redactSecrets
 */

/** Замена скрытого значения */
export const REDACTED = "[скрыто]";

/** Поля JSON, значения которых нельзя писать в журнал */
const SECRET_JSON_FIELDS = [
  "session_string",
  "sessionString",
  "userbotSessionString",
  "USERBOT_SESSION_STRING",
  "api_hash",
  "apiHash",
  "userbotApiHash",
  "USERBOT_API_HASH",
  "password",
  "webhookSecretToken",
];

/** "поле": "значение" для секретных полей */
const SECRET_FIELD_RE = new RegExp(`"(${SECRET_JSON_FIELDS.join("|")})"\\s*:\\s*"[^"]*"`, "g");

/** Поле=значение (строки .env) для секретных полей */
const SECRET_ENV_RE = /\b(USERBOT_SESSION_STRING|USERBOT_API_HASH|BOT_TOKEN)=\S+/g;

/** StringSession Telethon: версия "1" и base64 ключа авторизации (~350 символов) */
const TELETHON_SESSION_RE = /\b1[A-Za-z0-9_-]{300,}={0,2}/g;

/** Токен бота Telegram: 123456789:AA… (35 символов секрета) */
const BOT_TOKEN_RE = /\b(\d{6,12}):[A-Za-z0-9_-]{30,}/g;

/**
 * Маскирует секреты в строке журнала
 * @param text - Строка журнала
 * @returns строка без session string, токенов и значений секретных полей
 */
export function redactSecrets(text: string): string {
  return text
    .replace(SECRET_FIELD_RE, (_m, field: string) => `"${field}":"${REDACTED}"`)
    .replace(SECRET_ENV_RE, (_m, field: string) => `${field}=${REDACTED}`)
    .replace(TELETHON_SESSION_RE, REDACTED)
    .replace(BOT_TOKEN_RE, (_m, botId: string) => `${botId}:${REDACTED}`);
}
