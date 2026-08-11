/**
 * @fileoverview OpenAPI-схемы диалогов: messages / send / avatar.
 * @module server/swagger/schemas/project-user-dialog
 */

import "./common";
import { z } from "zod";

/** Path: projectId + userId (Telegram) */
export const DialogProjectUserParamsSchema = z.object({
  /** ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "ID проекта",
    param: { description: "ID проекта", example: "42" },
  }),
  /** Telegram user_id или `bot` для аватарки бота */
  userId: z.string().openapi({
    example: "123456789",
    description: "Telegram user_id. Для аватарки бота — `bot` или id бота.",
    param: {
      description: "Telegram user_id (или `bot` для аватара бота)",
      example: "123456789",
    },
  }),
});

/** Query tokenId (+ опции для GET messages) */
export const DialogTokenQuerySchema = z.object({
  /** ID токена бота (скоуп данных / отправки) */
  tokenId: z.string().optional().openapi({
    example: "7",
    description:
      "Токен бота. Без него — resolveEffectiveProjectToken (default/first).",
    param: {
      description: "ID токена бота проекта",
      example: "7",
    },
  }),
});

/** Query GET …/messages */
export const DialogMessagesQuerySchema = DialogTokenQuerySchema.extend({
  /** Сколько последних сообщений вернуть (по умолчанию 100) */
  limit: z.string().optional().openapi({
    example: "100",
    description: "Лимит последних сообщений (default 100)",
  }),
  /** Фильтр: только user или только bot */
  messageType: z.enum(["user", "bot"]).optional().openapi({
    example: "bot",
    description: "Фильтр по типу сообщения",
  }),
});

/** Элемент медиа в сообщении */
export const DialogMessageMediaSchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    url: z.string().openapi({ example: "/uploads/42/photo.jpg" }),
    type: z.string().openapi({ example: "photo" }),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
  })
  .openapi("DialogMessageMedia");

/** Сообщение диалога (bot_messages + media) */
export const DialogMessageSchema = z
  .object({
    id: z.number().int().openapi({ example: 501 }),
    projectId: z.number().int().openapi({ example: 42 }),
    tokenId: z.number().int().nullable().optional().openapi({ example: 7 }),
    userId: z.string().openapi({ example: "123456789" }),
    messageType: z.enum(["user", "bot"]).openapi({ example: "bot" }),
    messageText: z.string().nullable().optional().openapi({
      example: "Привет! Чем могу помочь?",
    }),
    messageData: z.unknown().nullable().optional().openapi({
      example: { sentFromAdmin: true },
    }),
    telegramMessageId: z.number().int().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional().openapi({
      example: "2026-08-11T15:00:00.000Z",
    }),
    media: z.array(DialogMessageMediaSchema).optional(),
  })
  .openapi("DialogMessage");

/** Ответ GET …/messages */
export const DialogMessageListSchema = z
  .array(DialogMessageSchema)
  .openapi("DialogMessageList");

/** Тело POST …/send-message */
export const SendDialogMessageRequestSchema = z
  .object({
    /** Текст (до 4096); можно пустой, если есть media/buttons */
    messageText: z.string().max(4096).optional().default("").openapi({
      example: "Здравствуйте!",
    }),
    /** URL медиа для отправки */
    mediaUrls: z
      .array(z.string())
      .optional()
      .openapi({ example: ["/uploads/42/photo.jpg"] }),
    /** Инлайн-кнопки (формат Button фронтенда) */
    buttons: z.array(z.unknown()).optional().openapi({ example: [] }),
    /** Кнопок в ряду (0 = все в один ряд) */
    buttonsPerRow: z.number().int().optional().openapi({ example: 0 }),
  })
  .openapi("SendDialogMessageRequest");

/** Тело POST …/send-node-message */
export const SendNodeMessageRequestSchema = z
  .object({
    /** ID узла на канвасе */
    nodeId: z.string().min(1).openapi({ example: "welcome-msg" }),
    /** Доп. user_data для подстановки переменных */
    userData: z.record(z.unknown()).optional().openapi({
      example: { order_id: "A-100" },
    }),
  })
  .openapi("SendNodeMessageRequest");

/** Успех отправки в Telegram */
export const SendDialogMessageResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Сообщение успешно отправлено" }),
    /** Ответ Telegram Bot API (sendMessage / sendMediaGroup) */
    result: z.unknown().optional(),
  })
  .openapi("SendDialogMessageResponse");

/** Успех DELETE …/messages */
export const DeleteDialogMessagesResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Сообщения успешно удалены" }),
    deleted: z.boolean().openapi({ example: true }),
  })
  .openapi("DeleteDialogMessagesResponse");

/** Ошибка отправки (Telegram / валидация) */
export const SendDialogMessageErrorSchema = z
  .object({
    message: z.string().openapi({
      example: "Бот заблокирован пользователем",
    }),
    errorType: z.string().optional().openapi({ example: "bot_blocked" }),
    details: z.string().optional(),
    errors: z.array(z.unknown()).optional(),
  })
  .openapi("SendDialogMessageError");
