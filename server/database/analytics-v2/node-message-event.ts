/** @fileoverview Безопасное преобразование подтверждённой серверной отправки в минимальное событие аналитики. */
import type { BotMessage } from '../../../shared/schema/tables/bot-messages';
/**
 * Создаёт факт только при наличии подтверждённого Telegram message ID либо служебной записи.
 * @param message - Сохранённая запись диалога.
 * @param explicitChatType - Тип чата, явно переданный писателем до применения значения по умолчанию.
 * @returns Минимальный payload без текста и произвольного message_data либо null.
 */
export function nodeMessageAnalyticsEvent(message: BotMessage, explicitChatType?: string | null): Record<string, unknown> | null {
  if (!message.tokenId || message.tokenId <= 0) return null;
  const data = message.messageData as Record<string, unknown> | null;
  const callback = message.messageType === 'user' && data?.button_clicked === true;
  const kind = message.messageType === 'user' ? callback ? 'callback' : 'message_in' : message.messageType === 'bot' ? 'message_out' : 'system';
  if (kind !== 'system' && (!message.telegramMessageId || callback)) return null;
  const chat = message.chatId || message.userId;
  const privateChat = explicitChatType === 'private' || Boolean(message.chatId && message.chatId === message.userId && /^[1-9][0-9]*$/.test(message.userId));
  const eventKey = kind === 'system' ? `system:storage:${message.id}`
    : `${kind === 'message_out' ? 'msg_out' : 'msg'}:${chat}:${message.telegramMessageId}`;
  return { project_id: message.projectId, token_id: message.tokenId, event_key: eventKey, kind,
    user_id: /^[1-9][0-9]{0,19}$/.test(message.userId) ? message.userId : null,
    chat_id: chat, chat_type: explicitChatType || (privateChat ? 'private' : 'unknown'), directed: kind === 'message_in' && privateChat,
    occurred_at: (message.createdAt || new Date()).toISOString(), metadata: kind === 'system' ? { system_kind: message.messageType } : {} };
}
