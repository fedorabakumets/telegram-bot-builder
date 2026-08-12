/**
 * @fileoverview OpenAPI-схемы project-groups: список, sync, диалог группы.
 * @module server/swagger/schemas/project-groups
 */

import "./common";
import { z } from "zod";
import { DialogMessageListSchema } from "./project-user-dialog";

/** Path: ID проекта (`:projectId`) */
export const ProjectGroupsProjectIdParamsSchema = z.object({
  /** ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "ID проекта",
    param: { description: "ID проекта", example: "42" },
  }),
});

/** Path: проект + Telegram chat_id группы */
export const ProjectGroupsGroupParamsSchema = ProjectGroupsProjectIdParamsSchema.extend({
  /** Telegram chat_id группы / канала */
  groupId: z.string().openapi({
    example: "-1001234567890",
    description: "Telegram chat_id группы",
    param: { description: "Telegram chat_id группы", example: "-1001234567890" },
  }),
});

/** Query tokenId для sync / messages / send */
export const ProjectGroupsTokenQuerySchema = z.object({
  /** ID токена бота проекта */
  tokenId: z.string().optional().openapi({
    example: "7",
    description: "Токен бота. Без него — default/first токен проекта.",
    param: { description: "ID токена бота проекта", example: "7" },
  }),
});

/** Query GET …/groups/{groupId}/messages */
export const ProjectGroupsMessagesQuerySchema = ProjectGroupsTokenQuerySchema.extend({
  /** Лимит последних сообщений (default 100) */
  limit: z.string().optional().openapi({
    example: "100",
    description: "Сколько последних сообщений вернуть (default 100)",
  }),
});

/** Запись группы в `bot_groups` (ответ списка / sync) */
export const BotGroupSchema = z
  .object({
    id: z.number().int().openapi({ example: 15 }),
    projectId: z.number().int().openapi({ example: 42 }),
    groupId: z.string().nullable().optional().openapi({ example: "-1001234567890" }),
    tokenId: z.number().int().nullable().optional().openapi({
      example: 7,
      description: "ID токена бота, который состоит в этой группе",
    }),
    name: z.string().openapi({ example: "Поддержка клиентов" }),
    url: z.string().openapi({ example: "https://t.me/support_chat" }),
    isAdmin: z.number().int().nullable().optional().openapi({ example: 1 }),
    memberCount: z.number().int().nullable().optional(),
    isActive: z.number().int().nullable().optional().openapi({ example: 1 }),
    avatarUrl: z.string().nullable().optional().openapi({
      example: "/api/projects/42/telegram-file?fileId=AgAC&tokenId=7",
    }),
    chatType: z.string().nullable().optional().openapi({ example: "supergroup" }),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotGroup");

/** Ответ GET …/groups */
export const BotGroupListSchema = z.array(BotGroupSchema).openapi("BotGroupList");

/** Ответ POST …/groups/{groupId}/sync */
export const SyncGroupResponseSchema = z
  .object({
    synced: z.literal(true).openapi({ example: true }),
    group: BotGroupSchema,
  })
  .openapi("SyncGroupResponse");

/** История сообщений группы — тот же формат, что личный диалог */
export const GroupDialogMessageListSchema = DialogMessageListSchema;

/** Тело POST …/bot/send-group-message */
export const SendGroupMessageRequestSchema = z
  .object({
    /** Telegram chat_id группы */
    groupId: z.string().min(1).openapi({ example: "-1001234567890" }),
    /** Текст (можно пустой, если есть media/buttons) */
    message: z.string().max(4096).optional().openapi({ example: "Здравствуйте!" }),
    /** URL / пути медиа */
    mediaUrls: z
      .array(z.string())
      .optional()
      .openapi({ example: ["/uploads/42/photo.jpg"] }),
    /** Инлайн-кнопки (формат Button фронтенда) */
    buttons: z.array(z.unknown()).optional().openapi({ example: [] }),
    /** Кнопок в ряду (0 = все в один ряд) */
    buttonsPerRow: z.number().int().optional().openapi({ example: 0 }),
  })
  .openapi("SendGroupMessageRequest");

/** Успех отправки в группу */
export const SendGroupMessageResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Сообщение успешно отправлено" }),
    messageId: z.number().int().nullable().openapi({ example: 98765 }),
  })
  .openapi("SendGroupMessageResponse");
