/**
 * @fileoverview Сохранение успешного входа юзербота с уведомлением всех вкладок.
 * @module server/routes/botTokens/save-userbot-auth-result
 */
import { storage } from '../../storages/storage';
import { emitTokenUpdated } from '../../terminal/emitTokenUpdated';
import { emitUserbotAuthProgress } from './emit-userbot-auth-progress';

/** Минимальный результат шага авторизации */
interface UserbotAuthResult {
  /** Успешность шага */
  ok?: boolean;
  /** Полученная сессия; передаётся только хранилищу */
  session_string?: string;
}

/**
 * Сохраняет сессию и уведомляет клиентов только после успешной записи.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param result - Ответ процесса авторизации
 * @returns Ничего; неуспешные и промежуточные шаги не меняют настройки
 */
export async function saveUserbotAuthResult(
  projectId: number, tokenId: number, result: UserbotAuthResult,
): Promise<void> {
  if (!result.ok || !result.session_string) return;
  const updated = await storage.updateBotToken(tokenId, {
    userbotSessionString: result.session_string,
    userbotEnabled: 1,
  });
  if (!updated) throw new Error('Токен не найден при сохранении авторизации');
  await emitTokenUpdated({
    projectId,
    tokenId,
    changedFields: ['userbotEnabled', 'userbotSessionString'],
    source: 'api',
  }).catch(() => console.error('[userbot] Не удалось отправить уведомление об авторизации'));
  /** Завершение переавторизации синхронизируется даже при неизменённой маске сессии */
  await emitUserbotAuthProgress(projectId, tokenId, { step: 'done' });
}
