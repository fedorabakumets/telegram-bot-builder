/** @fileoverview Обработка TelegramUnauthorizedError отдельного Python с сохранением версии токена. */
import type { ChildProcess } from 'node:child_process';
import { isRuntimeTokenUnauthorized } from './is-runtime-token-unauthorized';
import { markBotTokenUnauthorized } from './mark-bot-token-unauthorized';
import { isFrozenBotError } from './frozenBotStatus';
import { handleProcessTokenFrozen } from './handle-runtime-token-frozen';

/**
 * Распознаёт ошибку класса aiogram даже при разделении stderr на несколько порций.
 * @param process - Запущенный дочерний процесс
 * @param projectId - Проект запуска
 * @param tokenId - Идентификатор токена
 * @param observedToken - Секрет именно этого запуска
 * @param launchId - Запись запуска для защиты от устаревшего stderr
 * @returns Ожидание фиксации ограничения до обработки выхода
 */
export function observeProcessTokenUnauthorized(process: ChildProcess, projectId: number, tokenId: number, observedToken: string, launchId?: number): () => Promise<void> {
  let tail = '';
  let detected = false;
  let frozenDetected = false;
  let frozenIntent = Promise.resolve();
  /** Небольшой хвост сохраняет только границу имени класса, не весь журнал. */
  const onData = (chunk: Buffer | string) => {
    if (detected && frozenDetected) return;
    const text = tail + chunk.toString();
    tail = text.slice(-128);
    if (!frozenDetected && /\bTelegramBadRequest\b/.test(text) && isFrozenBotError(text)) {
      frozenDetected = true;
      frozenIntent = handleProcessTokenFrozen(projectId, tokenId, observedToken, launchId)
        .catch(() => console.error('[BotProcess] Не удалось сохранить ограничение Telegram'));
    }
    if (detected || !isRuntimeTokenUnauthorized(text)) return;
    detected = true;
    void markBotTokenUnauthorized(projectId, tokenId, observedToken)
      .catch(() => console.error('[BotProcess] Не удалось сохранить отказ авторизации Telegram'));
  };
  process.stderr?.on('data', onData);
  process.once('close', () => { process.stderr?.off('data', onData); tail = ''; });
  return () => frozenIntent;
}
