/**
 * @fileoverview Получение API credentials из переменных окружения
 * @module server/telegram/services/client/get-env-credentials
 */

/**
 * Получает API credentials из переменных окружения
 * @returns Объект с apiId и apiHash или null, если не настроены
 */
export function getEnvCredentials(): { apiId: string; apiHash: string } | null {
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (apiId && apiHash) {
    return { apiId, apiHash };
  }
  return null;
}
