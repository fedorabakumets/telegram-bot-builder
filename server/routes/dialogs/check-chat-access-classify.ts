/**
 * @fileoverview Классификация ответа Telegram sendChatAction без секретов и сырого текста.
 * @module server/routes/dialogs/check-chat-access-classify
 */

/** Итог одной проверки личного чата. */
export type ChatAccessProbeKind = 'available' | 'kicked' | 'deleted' | 'error' | 'retry' | 'unauthorized';

/** Безопасный результат разбора ответа Telegram. */
export interface ChatAccessProbe {
  /** Класс результата. */
  kind: ChatAccessProbeKind;
  /** Статус для chat_access. */
  status: 'available' | 'kicked' | 'error';
  /** Пауза Telegram при 429, секунды. */
  retryAfter?: number;
}

/**
 * Разбирает ответ sendChatAction в безопасный класс.
 * @param input - HTTP-статус и поля тела Telegram
 * @returns Класс результата без description
 */
export function classifyChatAction(input: {
  /** Успешный HTTP-статус. */
  httpOk: boolean;
  /** Поле ok тела Telegram. */
  ok?: boolean;
  /** Код ошибки Telegram. */
  errorCode?: number;
  /** Описание ошибки, только для классификации. */
  description?: string;
  /** retry_after из parameters. */
  retryAfter?: number;
}): ChatAccessProbe {
  const text = (input.description ?? '').toLowerCase();
  if (input.errorCode === 401 || text.includes('unauthorized')) {
    return { kind: 'unauthorized', status: 'error' };
  }
  if (input.errorCode === 429 || (input.retryAfter ?? 0) > 0) {
    return { kind: 'retry', status: 'error', retryAfter: Math.min(Math.max(input.retryAfter ?? 1, 1), 60) };
  }
  if (input.httpOk && input.ok) return { kind: 'available', status: 'available' };
  if (text.includes('deactivated') || text.includes('user is deleted')
    || (input.errorCode === 400 && text.includes('chat not found'))) {
    return { kind: 'deleted', status: 'error' };
  }
  if (text.includes("can't initiate") || text.includes('cannot initiate')) {
    return { kind: 'error', status: 'error' };
  }
  if (input.errorCode === 403 || text.includes('bot was blocked')) {
    return { kind: 'kicked', status: 'kicked' };
  }
  return { kind: 'error', status: 'error' };
}
