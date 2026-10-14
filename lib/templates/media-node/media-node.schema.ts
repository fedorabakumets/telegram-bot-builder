/**
 * @fileoverview Zod-схема валидации параметров медиа-ноды
 * @module templates/media-node/media-node.schema
 */

import { z } from 'zod';

/** Схема одного получателя медиа-сообщения */
const mediaSendRecipientSchema = z.object({
  /** Уникальный идентификатор получателя */
  id: z.string(),
  /** Тип получателя */
  type: z.enum(['user', 'chat_id', 'admin_ids']).default('user'),
  /** ID чата или канала */
  chatId: z.string().optional(),
  /** ID топика в группе */
  threadId: z.string().optional(),
  /** Добавить префикс -100 для групп/каналов */
  isGroup: z.boolean().optional().default(false),
  /** Токен бота для отправки (опционально) */
  botToken: z.string().optional(),
});

/** Схема для валидации параметров медиа-ноды */
export const mediaNodeParamsSchema = z.object({
  /** Уникальный идентификатор узла */
  nodeId: z.string(),
  /** Массив URL медиафайлов */
  attachedMedia: z.array(z.string()),
  /** Включить автопереход */
  enableAutoTransition: z.boolean().optional(),
  /** ID целевого узла автоперехода */
  autoTransitionTo: z.string().optional(),
  /** Список получателей (если пустой — отправка пользователю) */
  messageSendRecipients: z.array(mediaSendRecipientSchema).optional().default([]),
  /**
   * Словарь кэшированных Telegram file_id.
   * Ключ — URL или путь медиафайла, значение — Telegram file_id.
   */
  telegramFileIds: z.record(z.string(), z.string()).optional().default({}),
  /**
   * Словарь обложек видео: ключ — URL видео, значение — Telegram file_id обложки.
   * Передаётся как thumbnail= в answer_video при первой отправке.
   */
  thumbnailFileIds: z.record(z.string(), z.string()).optional().default({}),
  /**
   * Словарь прямых URL обложек видео: ключ — URL видео, значение — URL обложки.
   * Используется если thumbnailFileIds не содержит file_id для данного видео.
   */
  thumbnailUrls: z.record(z.string(), z.string()).optional().default({}),
  /**
   * URL видео, которые нужно отправить как GIF.
   * Пустой список — видео остаётся видео, .gif всё равно уходит как анимация.
   */
  sendAsGifUrls: z.array(z.string()).optional().default([]),
  /**
   * Подпись к анимации. В обычном медиафайле пустая.
   * Заполняется при переносе старого узла animation.
   */
  mediaCaption: z.string().optional().default(''),
});

/** Тип параметров медиа-ноды (выведен из схемы) */
export type MediaNodeParams = z.infer<typeof mediaNodeParamsSchema>;
