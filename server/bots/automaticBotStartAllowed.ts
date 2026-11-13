/** @fileoverview Единый запрет автоматического запуска замороженного или явно остановленного бота. */
import { storage } from '../storages/storage';
import { isBotFrozen } from './frozenBotStatus';

/**
 * Сверяет актуальную личность бота и сохранённое намерение непосредственно перед автоматическим запуском.
 * @param projectId - Проект бота.
 * @param tokenId - Запись токена.
 * @returns Разрешён ли автоматический запуск; ручной запуск не использует этот запрет.
 */
export async function automaticBotStartAllowed(projectId: number, tokenId: number): Promise<boolean> {
  const token = await storage.getBotToken(tokenId);
  if (!token?.token || isBotFrozen(projectId, tokenId, token.token)) return false;
  const instance = await storage.getBotInstanceByToken(tokenId);
  return instance?.desiredStatus !== 'stopped' && !isBotFrozen(projectId, tokenId, token.token);
}
