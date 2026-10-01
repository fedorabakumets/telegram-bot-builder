/**
 * @fileoverview Разбор тела PUT /tokens/:tokenId/userbot без потери сохранённых секретов.
 * Клиент получает API Hash и session string только в виде маски, поэтому null, пустая
 * строка или маска в запросе означают «оставить как есть», а не «стереть».
 * @module server/routes/botTokens/build-userbot-update
 */

/** Маска секрета в ответах API */
export const SECRET_MASK = "••••••••";

/** Поля юзербота, которые можно обновить */
export interface UserbotUpdate {
  /** Включён ли юзербот (0 или 1) */
  userbotEnabled: number;
  /** API ID; null — очистить */
  userbotApiId?: string | null;
  /** Новый API Hash (только если прислан настоящий) */
  userbotApiHash?: string;
  /** Новая session string (только если прислана настоящая) */
  userbotSessionString?: string;
}

/**
 * Маскирует секрет для ответа клиенту
 * @param value - Сырое значение
 * @returns маска, если секрет задан, иначе null
 */
export function maskSecret(value: string | null | undefined): string | null {
  return value ? SECRET_MASK : null;
}

/**
 * Убирает session string из ответа авторизации: она уже сохранена в БД,
 * а ответ попадает в браузер и в журнал запросов сервера
 * @param result - Ответ userbotAuth.py
 * @returns копия ответа с маской вместо session string
 */
export function toPublicAuthResult<T extends { session_string?: string | null }>(result: T): T {
  if (!result.session_string) return result;
  return { ...result, session_string: SECRET_MASK };
}

/**
 * Возвращает новое значение секрета, если клиент прислал настоящее
 * @param value - Значение из тела запроса
 * @returns строка или undefined, если секрет менять не нужно
 */
export function pickNewSecret(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("•")) return undefined;
  return trimmed;
}

/**
 * Строит обновление токена из тела PUT-запроса
 * @param body - Тело запроса
 * @returns обновление или сообщение об ошибке
 */
export function buildUserbotUpdate(body: Record<string, unknown> | undefined): { update: UserbotUpdate } | { error: string } {
  const enabled = body?.userbotEnabled;
  if (enabled !== 0 && enabled !== 1) return { error: "userbotEnabled должен быть 0 или 1" };
  const update: UserbotUpdate = { userbotEnabled: enabled };
  if (body && "userbotApiId" in body) {
    const apiId = typeof body.userbotApiId === "number" ? String(body.userbotApiId) : body.userbotApiId;
    update.userbotApiId = typeof apiId === "string" && apiId.trim() ? apiId.trim() : null;
  }
  const apiHash = pickNewSecret(body?.userbotApiHash);
  if (apiHash) update.userbotApiHash = apiHash;
  const session = pickNewSecret(body?.userbotSessionString);
  if (session) update.userbotSessionString = session;
  return { update };
}
