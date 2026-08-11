/**
 * @fileoverview DTO ответов и тел запросов project-messages.
 * @module server/swagger/schemas/project-messages-dto
 */

import "./common";
import { z } from "zod";

/** Элемент списка GET …/messages/all (текст обрезан до 100 символов) */
export const ProjectMessageListItemSchema = z
  .object({
    /** ID строки bot_messages */
    id: z.number().int().openapi({ example: 501 }),
    /** Telegram user_id / chat id владельца диалога */
    userId: z.string().openapi({ example: "123456789" }),
    /** Тип: user | bot */
    messageType: z.string().openapi({ example: "bot" }),
    /** Текст сообщения (SUBSTRING 100) */
    messageText: z.string().openapi({ example: "Привет! Чем могу помочь?" }),
    /** Тип чата (private/group/…) */
    chatType: z.string().nullable().optional().openapi({ example: "private" }),
    /** ID чата Telegram */
    chatId: z.string().nullable().optional().openapi({ example: "123456789" }),
    /** Время создания */
    createdAt: z.union([z.string(), z.date()]).openapi({
      example: "2026-08-11T15:00:00.000Z",
    }),
  })
  .openapi("ProjectMessageListItem");

/** Ответ GET …/messages/all */
export const ProjectMessageListSchema = z
  .array(ProjectMessageListItemSchema)
  .openapi("ProjectMessageList");

/** Точка активности: суммарный count */
export const MessageActivityCountPointSchema = z
  .object({
    /** ISO datetime или YYYY-MM-DD */
    date: z.string().openapi({ example: "2026-08-11T14:00:00.000Z" }),
    /** Число сообщений в слоте */
    count: z.number().int().openapi({ example: 12 }),
  })
  .openapi("MessageActivityCountPoint");

/** Точка активности при split=true */
export const MessageActivitySplitPointSchema = z
  .object({
    /** ISO datetime или YYYY-MM-DD */
    date: z.string().openapi({ example: "2026-08-11T14:00:00.000Z" }),
    /** Входящие (message_type=user) */
    incoming: z.number().int().openapi({ example: 7 }),
    /** Исходящие (message_type=bot) */
    outgoing: z.number().int().openapi({ example: 5 }),
  })
  .openapi("MessageActivitySplitPoint");

/** Ответ GET …/messages/activity (count или split) */
export const MessageActivityListSchema = z
  .array(
    z.union([MessageActivityCountPointSchema, MessageActivitySplitPointSchema]),
  )
  .openapi("MessageActivityList");

/** Успех DELETE …/messages/{messageId} */
export const DeleteMessageSuccessSchema = z
  .object({
    /** Операция успешна */
    success: z.literal(true).openapi({ example: true }),
    /** Удалено и в Telegram */
    deletedFromTelegram: z.literal(true).openapi({ example: true }),
  })
  .openapi("DeleteMessageSuccess");

/** Тело PATCH …/messages/{messageId} */
export const EditMessageRequestSchema = z
  .object({
    /** Новый текст (обязателен, не пустой) */
    messageText: z.string().min(1).openapi({
      example: "Обновлённый текст сообщения",
    }),
    /** Inline-кнопки; [] снимает клавиатуру */
    buttons: z.array(z.unknown()).optional().openapi({ example: [] }),
    /** Кнопок в ряду (0 — авто) */
    buttonsPerRow: z.number().int().optional().openapi({ example: 0 }),
  })
  .openapi("EditMessageRequest");

/** Успех PATCH …/messages/{messageId} */
export const EditMessageSuccessSchema = z
  .object({
    /** Операция успешна */
    success: z.literal(true).openapi({ example: true }),
    /** Отредактировано и в Telegram */
    editedInTelegram: z.literal(true).openapi({ example: true }),
  })
  .openapi("EditMessageSuccess");
