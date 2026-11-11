/** @fileoverview Проверка параметров получения идентификатора фотографии пользователя. */

/** Параметры фотографии с проверенным доступом к проекту. */
export interface BotUserPhotoInput {
  /** Идентификатор проекта. */
  projectId: number;
  /** Идентификатор записи токена. */
  tokenId: number;
  /** Учётные данные Telegram. */
  token: string;
  /** Идентификатор пользователя Telegram. */
  userId: string;
}

/**
 * Проверяет параметры перед обращением к Telegram.
 * @param input - Параметры фотографии
 * @returns Завершение проверки либо исключение
 */
export function validateBotUserPhotoInput(input: BotUserPhotoInput): void {
  if (![input.projectId, input.tokenId].every(value => Number.isSafeInteger(value) && value > 0)
    || !/^[1-9]\d{0,15}$/.test(input.userId) || !Number.isSafeInteger(Number(input.userId))
    || !/^\d{1,20}:[A-Za-z0-9_-]{20,100}$/.test(input.token)) {
    throw new Error('Некорректные параметры фотографии');
  }
}
