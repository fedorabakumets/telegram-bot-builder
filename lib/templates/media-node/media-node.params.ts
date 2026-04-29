/**
 * @fileoverview Параметры для шаблона медиа-ноды
 * @module templates/media-node/media-node.params
 */

/** Тип получателя медиа-сообщения */
export type MediaSendRecipientType = 'user' | 'chat_id' | 'admin_ids';

/** Один получатель медиа-сообщения */
export interface MediaSendRecipient {
  /** Уникальный идентификатор получателя */
  id: string;
  /** Тип получателя: пользователь, по ID чата или администраторам */
  type: MediaSendRecipientType;
  /** ID чата или канала (только для типа chat_id) */
  chatId?: string;
  /** ID топика в группе (опционально) */
  threadId?: string;
  /** Добавить префикс -100 для групп/каналов */
  isGroup?: boolean;
  /** Токен бота для отправки (опционально). По умолчанию — глобальный bot */
  botToken?: string;
}

/** Параметры для генерации обработчика медиа-ноды */
export interface MediaNodeTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Массив URL медиафайлов для отправки */
  attachedMedia: string[];
  /** Включить автопереход после отправки медиа */
  enableAutoTransition?: boolean;
  /** ID целевого узла для автоперехода */
  autoTransitionTo?: string;
  /** Список получателей (если пустой — отправка пользователю) */
  messageSendRecipients?: MediaSendRecipient[];
}
