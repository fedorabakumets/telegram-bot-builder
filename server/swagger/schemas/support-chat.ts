/**
 * @fileoverview OpenAPI-схемы чата поддержки платформы
 * @module server/swagger/schemas/support-chat
 */

import "./common";
import { z } from "zod";
import { SUPPORT_MESSAGE_MAX_LENGTH } from "@shared/support/support.types";

/** Контекст, в котором пользователь отправил сообщение */
export const SupportMessageContextSchema = z
  .object({
    projectId: z.number().int().nullable().optional().openapi({ example: 294 }),
    path: z.string().optional().openapi({ example: "/editor/294" }),
    userAgent: z.string().optional().openapi({ example: "Mozilla/5.0" }),
  })
  .openapi("SupportMessageContext");

/** Картинка сообщения поддержки */
export const SupportAttachmentSchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    fileName: z.string().openapi({ example: "screen.png" }),
    mime: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]).openapi({ example: "image/png" }),
    size: z.number().int().openapi({ example: 12034 }),
  })
  .openapi("SupportAttachment");

/** Сообщение чата поддержки */
export const SupportMessageSchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    sender: z.enum(["user", "admin"]).openapi({ example: "user" }),
    text: z.string().openapi({ example: "Не сохраняется сценарий" }),
    context: SupportMessageContextSchema.nullable(),
    source: z.enum(["web", "telegram"]).openapi({ example: "web" }),
    createdAt: z.string().openapi({ example: "2026-09-30T11:10:20.787Z" }),
    attachments: z.array(SupportAttachmentSchema),
  })
  .openapi("SupportMessage");

/** Диалог поддержки */
export const SupportThreadSchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    status: z.enum(["open", "closed"]).openapi({ example: "open" }),
    unreadByAdmin: z.number().int().openapi({ example: 1 }),
    unreadByUser: z.number().int().openapi({ example: 0 }),
    lastMessageAt: z.string().openapi({ example: "2026-09-30T11:10:20.787Z" }),
  })
  .openapi("SupportThread");

/** Краткий профиль автора диалога */
export const SupportUserProfileSchema = z
  .object({
    id: z.number().int().openapi({ example: 123456789 }),
    firstName: z.string().openapi({ example: "Иван" }),
    lastName: z.string().nullable().openapi({ example: null }),
    username: z.string().nullable().openapi({ example: "ivan" }),
    photoUrl: z.string().nullable(),
  })
  .openapi("SupportUserProfile");

/** Ответ GET /api/support/thread */
export const UserSupportThreadResponseSchema = z
  .object({
    thread: SupportThreadSchema.nullable(),
    messages: z.array(SupportMessageSchema),
    telegramBot: z.string().nullable().openapi({ example: "support_bot" }),
  })
  .openapi("UserSupportThreadResponse");

/** Элемент списка диалогов в админке */
export const AdminSupportThreadListItemSchema = SupportThreadSchema.extend({
  user: SupportUserProfileSchema,
  lastMessageText: z.string().nullable().openapi({ example: "Не сохраняется сценарий" }),
  lastMessageSender: z.enum(["user", "admin"]).nullable().openapi({ example: "user" }),
}).openapi("AdminSupportThreadListItem");

/** Ответ GET /admin/api/support/threads */
export const AdminSupportThreadListResponseSchema = z
  .object({ items: z.array(AdminSupportThreadListItemSchema) })
  .openapi("AdminSupportThreadListResponse");

/** Ответ GET /admin/api/support/threads/{id} */
export const AdminSupportThreadResponseSchema = z
  .object({
    thread: SupportThreadSchema,
    user: SupportUserProfileSchema,
    messages: z.array(SupportMessageSchema),
  })
  .openapi("AdminSupportThreadResponse");

/** Ответ GET /admin/api/support/unread */
export const AdminSupportUnreadResponseSchema = z
  .object({ total: z.number().int().openapi({ example: 3 }) })
  .openapi("AdminSupportUnreadResponse");

/** Поле files: картинки, тип проверяется по содержимому */
const supportImageFilesSchema = z.array(z.string().openapi({ format: "binary" })).optional().openapi({
  description: "png, jpeg, webp или gif. До 8 МБ каждая, число файлов не ограничено",
});

/** Тело POST /api/support/messages, multipart/form-data */
export const SupportUserMessageBodySchema = z
  .object({
    text: z.string().optional().openapi({
      description: `Текст до ${SUPPORT_MESSAGE_MAX_LENGTH} символов. Можно пустой, если есть files`,
      example: "Не сохраняется сценарий",
    }),
    context: z.string().optional().openapi({
      description: "JSON: projectId, path, userAgent",
      example: "{\"projectId\":294,\"path\":\"/editor/294\"}",
    }),
    files: supportImageFilesSchema,
  })
  .openapi("SupportUserMessageBody");

/** Тело POST /admin/api/support/threads/{id}/messages, multipart/form-data */
export const SupportAdminMessageBodySchema = z
  .object({
    text: z.string().optional().openapi({
      example: "Проверьте сохранение ещё раз.",
    }),
    files: supportImageFilesSchema,
  })
  .openapi("SupportAdminMessageBody");

/** Тело PATCH /admin/api/support/threads/{id} */
export const SupportStatusBodySchema = z
  .object({ status: z.enum(["open", "closed"]).openapi({ example: "closed" }) })
  .openapi("SupportStatusBody");

/** Ответ POST /api/support/read */
export const SupportReadOkSchema = z
  .object({ ok: z.literal(true).openapi({ example: true }) })
  .openapi("SupportReadOk");

/** Ошибка чата поддержки: поле error */
export const SupportErrorSchema = z
  .object({ error: z.string().openapi({ example: "Диалог не найден" }) })
  .openapi("SupportError");

/** Session cookie пользователя Studio */
export const SupportSessionCookiesSchema = z.object({
  "connect.sid": z.string().optional().openapi({
    description: "Сессия Studio. Не нужна, если задан Bearer PAT. Без обоих — 401.",
    example: "s%3Axxxx.yyyy",
  }),
});
