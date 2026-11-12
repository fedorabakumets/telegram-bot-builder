/** @fileoverview Каноническая запись режима через альтернативное API переменных бота. */

import { storage } from '../../../../storages/storage';
import { saveRuntimeModeSettings } from '../../../../bots/runtimeModeSettings';
import { emitTokenUpdated } from '../../../../terminal/emitTokenUpdated';

/** Отклоняет переименование специального ключа через произвольное редактирование переменных. */
export function validateRuntimeModeRename(previousKey: string, nextKey: unknown): void {
  if (nextKey !== undefined && nextKey !== previousKey
    && (previousKey === 'BOT_POLLING_MODE' || nextKey === 'BOT_POLLING_MODE')) {
    throw Object.assign(new Error('Настройку режима нельзя переименовать'), { status: 400 });
  }
}

/** Сохраняет либо сбрасывает режим под блокировкой токена и отправляет безопасное событие. */
export async function writeRuntimeModeEnv(tokenId: number, projectId: number, mode: unknown, resetMode = false) {
  const settings = await saveRuntimeModeSettings(tokenId, resetMode ? { resetMode } : { mode }, projectId);
  if (!settings) throw Object.assign(new Error('Токен не найден'), { status: 404 });
  void emitTokenUpdated({ projectId, tokenId, changedFields: ['pollingMode'], source: 'api' })
    .catch(() => console.error('[runtime-settings] Не удалось уведомить подписчиков'));
  if (resetMode) return undefined;
  return (await storage.getEnvVariables(tokenId)).find((row) => row.key === 'BOT_POLLING_MODE');
}
