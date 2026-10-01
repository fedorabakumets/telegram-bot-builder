/**
 * @fileoverview Ключ объекта сборки бота в хранилище
 * @module server/bots/builds/botBuildKey
 */

/** Префикс всех объектов сборок в хранилище */
export const BOT_BUILDS_PREFIX = "bot-builds";

/**
 * Строит неизменяемый ключ сборки: одна сборка — один ключ навсегда.
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @param fingerprint - Отпечаток генерации (sha256 hex)
 * @returns Ключ вида bot-builds/<projectId>/<tokenId>/<fingerprint>.py.gz
 */
export function buildBotBuildKey(projectId: number, tokenId: number, fingerprint: string): string {
  if (!Number.isInteger(projectId) || projectId <= 0 || !Number.isInteger(tokenId) || tokenId <= 0) {
    throw new Error(`Некорректные projectId/tokenId для ключа сборки: ${projectId}/${tokenId}`);
  }
  if (!/^[a-f0-9]{16,128}$/.test(fingerprint)) {
    throw new Error("Некорректный отпечаток сборки: ожидается hex-строка");
  }
  return `${BOT_BUILDS_PREFIX}/${projectId}/${tokenId}/${fingerprint}.py.gz`;
}
