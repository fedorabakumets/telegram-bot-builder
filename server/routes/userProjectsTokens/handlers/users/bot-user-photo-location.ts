/** @fileoverview Проверка идентификаторов и изолированные пути фотографий пользователей. */
import { createHmac } from 'node:crypto';
import { join } from 'node:path';

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
 * Проверяет вход и вычисляет путь, изолированный по проекту, боту и учётным данным.
 * @param input - Параметры фотографии
 * @returns Абсолютный путь и публичный адрес
 */
export function getBotUserPhotoLocation(input: BotUserPhotoInput): { path: string; url: string } {
  if (![input.projectId, input.tokenId].every(value => Number.isSafeInteger(value) && value > 0)
    || !/^[1-9]\d{0,15}$/.test(input.userId) || !Number.isSafeInteger(Number(input.userId))
    || !/^\d{1,20}:[A-Za-z0-9_-]{20,100}$/.test(input.token)) {
    throw new Error('Некорректные параметры фотографии');
  }
  const digest = createHmac('sha256', input.token)
    .update(`${input.projectId}:${input.tokenId}:${input.userId}`).digest('hex');
  const name = `${digest}.jpg`;
  return {
    path: join(process.cwd(), 'uploads', String(input.projectId), 'user_photos', name),
    url: `/uploads/${input.projectId}/user_photos/${name}`,
  };
}
