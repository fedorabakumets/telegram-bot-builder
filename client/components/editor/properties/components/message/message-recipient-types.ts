/**
 * @fileoverview Типы и утилиты для списка получателей узла отправки сообщения
 */

/** Тип получателя сообщения */
export type MessageSendRecipientType = 'user' | 'chat_id' | 'admin_ids';

/** Один получатель в узле отправки сообщения */
export interface MessageSendRecipient {
  /** Уникальный идентификатор получателя */
  id: string;
  /** Тип получателя */
  type: MessageSendRecipientType;
  /** Chat ID или переменная вида {var} */
  chatId?: string;
  /** ID топика или переменная вида {var} */
  threadId?: string;
  /** Это группа или канал (добавляет -100 к ID автоматически) */
  isGroup?: boolean;
}

/**
 * Создаёт нового получателя с дефолтными значениями
 * @param type - Тип получателя
 * @returns Новый получатель
 */
export function createRecipient(type: MessageSendRecipientType = 'user'): MessageSendRecipient {
  return {
    id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    chatId: '',
    threadId: '',
  };
}

/**
 * Нормализует получателя, заполняя отсутствующие поля
 * @param raw - Сырые данные получателя
 * @param index - Индекс в массиве
 * @returns Нормализованный получатель
 */
export function normalizeRecipient(raw: Partial<MessageSendRecipient>, index: number): MessageSendRecipient {
  const validTypes: MessageSendRecipientType[] = ['user', 'chat_id', 'admin_ids'];
  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : `r-${index + 1}`,
    type: validTypes.includes(raw.type as MessageSendRecipientType) ? raw.type! : 'user',
    chatId: typeof raw.chatId === 'string' ? raw.chatId : '',
    threadId: typeof raw.threadId === 'string' ? raw.threadId : '',
    isGroup: raw.isGroup === true,
  };
}

/**
 * Извлекает список получателей из данных узла с поддержкой legacy-полей
 * @param data - Данные узла
 * @returns Список нормализованных получателей
 */
export function getRecipients(data: any): MessageSendRecipient[] {
  if (Array.isArray(data.messageSendRecipients) && data.messageSendRecipients.length > 0) {
    return data.messageSendRecipients.map(
      (r: Partial<MessageSendRecipient>, i: number) => normalizeRecipient(r, i)
    );
  }
  // Обратная совместимость со старыми полями
  const legacyType: MessageSendRecipientType =
    data.messageSendTarget === 'chat_id' ? 'chat_id' : 'user';
  return [
    normalizeRecipient(
      { id: 'legacy', type: legacyType, chatId: data.messageSendChatId || '', threadId: data.messageSendThreadId || '' },
      0
    ),
  ];
}
