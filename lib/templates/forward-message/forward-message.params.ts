/**
 * @fileoverview Параметры шаблона пересылки сообщения
 * @module templates/forward-message/forward-message.params
 */

/** Режим определения исходного сообщения */
export type ForwardMessageSourceMode = 'current_message' | 'last_message' | 'manual' | 'variable';
/** Режим определения чата назначения */
export type ForwardMessageTargetMode = 'manual' | 'variable' | 'admin_ids';

/** Один получатель пересылки сообщения */
export interface ForwardMessageTargetRecipient {
  /** ID получателя внутри узла */
  id: string;
  /** Способ указания чата назначения */
  targetChatIdSource: ForwardMessageTargetMode;
  /** ID или username чата */
  targetChatId?: string;
  /** Имя переменной с ID чата */
  targetChatVariableName?: string;
  /** Тип получателя: "user" — пользователь, "group" — группа или канал */
  targetChatType?: 'user' | 'group';
  /** ID топика (message_thread_id) для форум-групп */
  targetThreadId?: string;
  /** Источник ID топика: "manual" — вручную, "variable" — из переменной */
  targetThreadIdSource?: 'manual' | 'variable';
  /** Имя переменной с ID топика */
  targetThreadIdVariable?: string;
}

/** Параметры шаблона forward_message */
export interface ForwardMessageTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя функции */
  safeName: string;
  /** Источник message_id сообщения */
  sourceMessageIdSource?: ForwardMessageSourceMode;
  /** Ручной message_id сообщения */
  sourceMessageId?: string;
  /** Имя переменной с message_id сообщения */
  sourceMessageVariableName?: string;
  /** ID узла-источника */
  sourceMessageNodeId?: string;
  /** Список получателей пересылки */
  targetRecipients: ForwardMessageTargetRecipient[];
  /** Отправлять без уведомления */
  disableNotification?: boolean;
  /** Скрыть автора — использует copy_message вместо forward_message */
  hideAuthor?: boolean;
}
