/** @fileoverview Подъём одного кандидата контрольного восстановления без повторной паузы запуска. */
import { storage } from '../storages/storage';
import { refuseInactiveBotStart } from './refuse-inactive-bot-start';
import { isExpectedStop } from './expectedStops';
import { isServerShuttingDown } from './serverShutdownState';
import { startBotWithRetries } from './restoreRetry';
import { automaticBotStartAllowed } from './automaticBotStartAllowed';
import { BOT_LOCK_BUSY_ERROR } from './waitForBotRedisLock';
import { BOT_START_CANCELLED_ERROR } from './botStartState';
import { type SweepInstanceInput } from './restoreSweepSelect';

/**
 * Перепроверяет намерение пользователя и восстанавливает одного бота с прежними повторами.
 * @param instance - Сохранённый кандидат прохода.
 * @param isRunning - Проверка физического состояния перед запуском.
 * @returns Один при успехе, ноль при пропуске или отказе.
 */
export async function restoreSweepCandidate(instance: SweepInstanceInput,
  isRunning: (projectId: number, tokenId: number) => boolean): Promise<number> {
  const tokenId = instance.tokenId;
  if (tokenId == null || isServerShuttingDown() || isExpectedStop(tokenId)) return 0;
  try {
    const token = await storage.getBotToken(tokenId);
    if (!token?.token || refuseInactiveBotStart(token.isActive, token.authorizationError)) return 0;
    if (!await automaticBotStartAllowed(instance.projectId, tokenId) || isRunning(instance.projectId, tokenId)) return 0;
    console.log(`[RestoreSweep] project=${instance.projectId} token=${tokenId} — поднимаю`);
    const result = await startBotWithRetries(instance.projectId, token.token, tokenId,
      { canStart: () => automaticBotStartAllowed(instance.projectId, tokenId) });
    if (result.success) {
      console.log(`[RestoreSweep] token=${tokenId} поднят (попыток: ${result.attempts})`);
      return 1;
    }
    if (result.error === BOT_LOCK_BUSY_ERROR || result.error === BOT_START_CANCELLED_ERROR) return 0;
    await storage.updateBotInstance(instance.id, { status: 'error',
      errorMessage: result.error ?? 'Ошибка контрольного восстановления' });
    console.error(`[RestoreSweep] token=${tokenId} не поднялся`);
  } catch {
    // Отказ одного проекта не отменяет восстановление остальных проектов.
    console.error(`[RestoreSweep] project=${instance.projectId} token=${tokenId}: ошибка восстановления`);
  }
  return 0;
}
