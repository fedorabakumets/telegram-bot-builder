/**
 * @fileoverview Проверка одного личного чата через sendChatAction и запись статусов.
 * @module server/routes/dialogs/check-chat-access-core
 */
import { pool } from '../../database/db';
import { storage } from '../../storages/storage';
import { fetchWithProxy } from '../../utils/telegram-proxy';
import { saveChatAccess } from './access-store';
import { classifyChatAction, type ChatAccessProbe } from './check-chat-access-classify';

/**
 * Вызывает sendChatAction и классифицирует ответ, ничего не сохраняя.
 * @param botToken - Токен бота, не логируется и не возвращается
 * @param chatId - Идентификатор личного чата
 * @returns Безопасный класс результата
 */
export async function probePrivateChatAccess(botToken: string, chatId: string): Promise<ChatAccessProbe> {
  try {
    const response = await fetchWithProxy(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
      signal: AbortSignal.timeout(12_000),
    });
    const telegram = await response.json().catch(() => ({}));
    return classifyChatAction({
      httpOk: response.ok,
      ok: Boolean(telegram?.ok),
      errorCode: typeof telegram?.error_code === 'number' ? telegram.error_code : undefined,
      description: typeof telegram?.description === 'string' ? telegram.description : undefined,
      retryAfter: typeof telegram?.parameters?.retry_after === 'number' ? telegram.parameters.retry_after : undefined,
    });
  } catch {
    return { kind: 'error', status: 'error' };
  }
}

/**
 * Пишет chat_access и синхронизирует is_blocked / is_deleted.
 * @param projectId - Проект
 * @param tokenId - Токен бота
 * @param chatId - Личный чат
 * @param probe - Уже классифицированный результат
 * @returns Сохранённый статус и время проверки
 */
export async function persistChatAccessOutcome(
  projectId: number, tokenId: number, chatId: string, probe: ChatAccessProbe,
) {
  const access = await saveChatAccess(projectId, tokenId, chatId, probe.status);
  const userId = Number(chatId);
  if (!Number.isSafeInteger(userId)) return access;
  if (probe.kind === 'available') {
    await pool.query(
      `UPDATE bot_users SET is_blocked = 0 WHERE project_id = $1 AND token_id = $2 AND user_id = $3`,
      [projectId, tokenId, userId],
    );
  } else if (probe.kind === 'kicked') {
    await storage.markBotUserBlocked(projectId, tokenId, userId);
  } else if (probe.kind === 'deleted') {
    await storage.markBotUserDeleted(projectId, tokenId, userId);
  }
  return access;
}
