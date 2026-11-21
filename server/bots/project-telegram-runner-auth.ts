/** @fileoverview Подписывает доступ раннера к общему клиенту Telegram. */
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Управляемые сервером переменные Telegram-раннера. */
export const projectTelegramEnvKeys = [
  'PROJECT_TELEGRAM_ACCOUNT_ID', 'PROJECT_TELEGRAM_API_BASE', 'PROJECT_TELEGRAM_RUNNER_KEY',
] as const;

/**
 * Создаёт ключ только для конкретного бота и проекта.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор токена бота.
 * @param generation - Актуальное поколение запуска.
 * @param accountId - Актуальная привязка аккаунта.
 * @returns Ключ раннера или null при отсутствии настройки.
 */
export function projectTelegramRunnerKey(projectId: number, tokenId: number, generation = 0, accountId = 0): string | null {
  const secret = process.env.PROJECT_TELEGRAM_RUNNER_SECRET?.trim();
  if (!secret || Buffer.byteLength(secret) < 32) return null;
  const signature = createHmac('sha256', secret)
    .update(`botcraft:project-telegram:v2:${projectId}:${tokenId}:${generation}:${accountId}`).digest('base64url');
  return `${generation}.${accountId}.${signature}`;
}

/**
 * Проверяет заголовок авторизации раннера.
 * @param authorization - Значение заголовка Authorization.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор токена бота.
 * @param generation - Актуальное поколение запуска из базы данных.
 * @param accountId - Текущий аккаунт, которому разрешена операция.
 * @returns Признак совпадения ключа.
 */
export function authorizeProjectTelegramRunner(
  authorization: string | undefined, projectId: number, tokenId: number, generation?: number, accountId?: number,
): boolean {
  if (!authorization?.startsWith('Bearer ') || authorization.length > 160) return false;
  const parts = /^(\d{1,16})\.(\d{1,16})\.([A-Za-z0-9_-]{43})$/.exec(authorization.slice(7));
  if (!parts) return false;
  const signedGeneration = Number(parts[1]);
  const signedAccountId = Number(parts[2]);
  if (!Number.isSafeInteger(signedGeneration) || !Number.isSafeInteger(signedAccountId)
    || (generation !== undefined && generation !== signedGeneration)
    || (accountId !== undefined && accountId !== signedAccountId)) return false;
  const expected = projectTelegramRunnerKey(projectId, tokenId, signedGeneration, signedAccountId);
  if (!expected) return false;
  const actual = Buffer.from(authorization.slice(7));
  const signed = Buffer.from(expected);
  return actual.length === signed.length && timingSafeEqual(actual, signed);
}
