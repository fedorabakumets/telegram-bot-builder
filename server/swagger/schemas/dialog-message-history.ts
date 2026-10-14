/** @fileoverview Публичные схемы истории чата и безопасных метаданных медиа. */
import './common';
import { z } from 'zod';

/** Сообщение истории без произвольных внутренних данных. */
export const DialogHistoryMessageSchema = z.object({
  /** Идентификатор записи истории. */
  id: z.number().int(),
  /** Идентификатор отправителя или владельца лички. */
  user_id: z.string(),
  /** Исходный идентификатор чата. */
  chat_id: z.string(),
  /** Исходный тип чата. */
  chat_type: z.enum(['private', 'group', 'supergroup', 'channel']),
  /** Сохранённое название группы или канала. */
  source_chat_title: z.string().nullable(),
  /** Сохранённый тип сообщения. */
  message_type: z.string(),
  /** Направление сообщения. */
  direction: z.enum(['incoming', 'outgoing']),
  /** Полный сохранённый текст. */
  message_text: z.string().nullable(),
  /** Идентификатор сообщения Telegram. */
  telegram_message_id: z.number().int().nullable(),
  /** Время UTC или отсутствие даты. */
  created_at: z.string().datetime().nullable(),
  /** Метаданные файлов из хранилища проекта. */
  media: z.array(z.object({
    /** Идентификатор медиафайла. */
    id: z.number().int(),
    /** Имя файла. */
    file_name: z.string(),
    /** Тип файла. */
    file_type: z.string(),
    /** Размер файла в байтах. */
    file_size: z.number().int(),
    /** Тип содержимого. */
    mime_type: z.string(),
    /** Тип связи с сообщением. */
    media_kind: z.string(),
    /** Порядок вложения. */
    order_index: z.number().int().nullable(),
  })),
  /** Сохранённые метаданные Telegram, ограниченные разрешёнными полями. */
  telegram_media: z.array(z.object({
    /** Тип вложения Telegram. */
    type: z.string(),
    /** Идентификатор файла Telegram, если сохранён. */
    file_id: z.string().optional(),
    /** Постоянный идентификатор файла. */
    file_unique_id: z.string().optional(),
  }).passthrough()),
});

/** Страница истории конкретного чата. */
export const DialogHistoryResponseSchema = z.object({
  /** Успешное чтение. */
  ok: z.literal(true),
  /** Проект. */
  project_id: z.number().int().positive(),
  /** Выбранный бот. */
  token_id: z.number().int().positive(),
  /** Запрошенный чат. */
  chat_id: z.string(),
  /** Запрошенный тип чата. */
  chat_type: z.enum(['private', 'group', 'supergroup', 'channel']),
  /** Включён ли контекст групп пользователя. */
  include_group_context: z.boolean(),
  /** Сообщения страницы в хронологическом порядке. */
  messages: z.array(DialogHistoryMessageSchema),
  /** Есть ли более старые сообщения. */
  has_more: z.boolean(),
  /** Курсор к более старым сообщениям. */
  next_cursor: z.string().nullable(),
});
