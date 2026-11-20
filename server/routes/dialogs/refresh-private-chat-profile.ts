/** @fileoverview Безопасное обновление профиля личного чата через Telegram getChat без изменения доступности и активности. */
import { pool } from '../../database/db';
import { fetchWithProxy } from '../../utils/telegram-proxy';
import { getTelegramApiBaseUrl } from '../../utils/telegram-api-url';
/** Обновляет профиль только по успешному полному ответу нужного личного чата. @param projectId - Разрешённый проект. @param tokenId - Проверенный бот. @param chatId - Telegram ID пользователя. @param botToken - Секрет, не возвращается и не логируется. @returns Успешно ли получен профиль. */
export async function refreshPrivateChatProfile(projectId: number, tokenId: number, chatId: string, botToken: string): Promise<boolean> {
  if (!/^[1-9]\d*$/.test(chatId) || !Number.isSafeInteger(Number(chatId))) return false;
  try {
    const response = await fetchWithProxy(`${getTelegramApiBaseUrl()}/bot${botToken}/getChat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId }), signal: AbortSignal.timeout(2500),
    });
    const body = await response.json();
    const chat = body?.result;
    if (!response.ok || body?.ok !== true || !chat || chat.type !== 'private'
      || !Number.isSafeInteger(chat.id) || String(chat.id) !== chatId
      || typeof chat.first_name !== 'string' || !chat.first_name || chat.first_name.length > 1024) return false;
    for (const key of ['username', 'last_name']) {
      if (chat[key] !== undefined && (typeof chat[key] !== 'string' || chat[key].length > 1024)) return false;
    }
    /** Отсутствующий username в успешном ответе означает, что пользователь его удалил. */
    await pool.query(`UPDATE bot_users SET username=$4,first_name=$5,last_name=$6
      WHERE project_id=$1 AND token_id=$2 AND user_id=$3`,
    [projectId, tokenId, chatId, chat.username || null, chat.first_name, chat.last_name || null]);
    return true;
  } catch {
    /** Ошибка профиля не стирает данные и не меняет результат проверки отправки. */
    return false;
  }
}
