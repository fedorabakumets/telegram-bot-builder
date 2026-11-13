/** @fileoverview Привязывает структурированную заморозку Telegram к текущему запуску и версии секрета. */
import { storage } from '../storages/storage';
import { getActiveLaunchId } from '../terminal/activeLaunchIds';
import { bindFrozenBotIdentity, recordFrozenBotError } from './frozenBotStatus';
import { confirmFrozenBotStop } from './frozenAutoStop';
import { isRuntimeAuthorizationForToken, type RuntimeAuthorizationError } from './handle-runtime-token-unauthorized';

/**
 * Проверяет отпечаток токена и не позволяет запоздавшему событию остановить новый запуск.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор слота бота
 * @param event - Структурированная ошибка от исполнителя
 * @param launchId - Запуск, активный при получении события
 */
export async function handleRuntimeTokenFrozen(projectId: number, tokenId: number, event: RuntimeAuthorizationError, launchId?: number): Promise<void> {
  if (launchId === undefined || event.launch_id !== launchId || getActiveLaunchId(tokenId) !== launchId) return;
  const current = await storage.getBotToken(tokenId);
  if (!current?.token || current.projectId !== projectId || getActiveLaunchId(tokenId) !== launchId
    || !isRuntimeAuthorizationForToken(event, current.token, 'telegram_frozen')) return;
  bindFrozenBotIdentity(projectId, tokenId, current.token);
  recordFrozenBotError(projectId, tokenId, 'FROZEN_METHOD_INVALID');
  await confirmFrozenBotStop({ projectId, tokenId, launchId, expectedToken: current.token });
}

/**
 * Проверяет версию секрета отдельного Python перед фиксацией заморозки.
 * @param projectId - Проект запуска
 * @param tokenId - Идентификатор токена
 * @param observedToken - Секрет, использованный именно этим процессом
 * @param launchId - Запись запуска наблюдаемого процесса
 */
export async function handleProcessTokenFrozen(projectId: number, tokenId: number, observedToken: string, launchId?: number): Promise<void> {
  if (launchId === undefined || getActiveLaunchId(tokenId) !== launchId) return;
  const current = await storage.getBotToken(tokenId);
  if (!current || current.projectId !== projectId || current.token !== observedToken
    || getActiveLaunchId(tokenId) !== launchId) return;
  bindFrozenBotIdentity(projectId, tokenId, observedToken);
  recordFrozenBotError(projectId, tokenId, 'FROZEN_METHOD_INVALID');
  await confirmFrozenBotStop({ projectId, tokenId, launchId, expectedToken: observedToken });
}
