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
  /**
   * Словарь кэшированных Telegram file_id.
   * Ключ — URL или путь медиафайла, значение — Telegram file_id.
   * Если для URL есть file_id — отправляем через него напрямую.
   */
  telegramFileIds?: Record<string, string>;
  /**
   * Словарь обложек видео: ключ — URL видео, значение — Telegram file_id обложки.
   * Передаётся как thumbnail= в answer_video при первой отправке.
   */
  thumbnailFileIds?: Record<string, string>;
  /**
   * Словарь прямых URL обложек видео: ключ — URL видео, значение — URL обложки.
   * Используется если thumbnailFileIds не содержит file_id для данного видео.
   */
  thumbnailUrls?: Record<string, string>;
  /**
   * URL видео, которые нужно отправить как GIF (sendAnimation).
   * Файл .gif и так всегда анимация, в список его класть не нужно.
   */
  sendAsGifUrls?: string[];
  /**
   * Подпись только для анимации.
   * У блока «Медиафайл» своего текста нет: поле живёт для переноса старого узла animation.
   */
  mediaCaption?: string;
}
