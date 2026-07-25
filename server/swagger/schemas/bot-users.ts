/**
 * @fileoverview OpenAPI-схемы пользователей бота (bot_users / диалоги)
 * @module server/swagger/schemas/bot-users
 */

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/** Элемент списка диалогов / пользователей проекта */
export const BotUserDialogItemSchema = z
  .object({
    /** Внутренний id строки (для групп — отрицательный) */
    id: z.number().optional().openapi({ example: 1 }),
    /** Telegram user_id или chat_id группы */
    userId: z.string().openapi({ example: "123456789" }),
    /** Username без @ */
    userName: z.string().nullable().optional().openapi({ example: "ivan" }),
    /** Имя или название группы */
    firstName: z.string().nullable().optional().openapi({ example: "Иван" }),
    /** Фамилия */
    lastName: z.string().nullable().optional().openapi({ example: "Петров" }),
    /** URL аватара */
    avatarUrl: z.string().nullable().optional(),
    /** Время регистрации / первого сообщения */
    registeredAt: z.string().datetime().optional(),
    /** Последнее взаимодействие */
    lastInteraction: z.string().datetime().nullable().optional(),
    /** Число взаимодействий */
    interactionCount: z.number().int().optional().openapi({ example: 12 }),
    /** Активен ли пользователь */
    isActive: z.boolean().optional(),
    /** Флаг группового диалога */
    isGroup: z.boolean().optional().openapi({ example: false }),
    /** Тип чата: private отсутствует; group | supergroup | channel */
    chatType: z.string().nullable().optional().openapi({ example: null }),
    /** Превью последнего сообщения */
    lastMessageText: z.string().nullable().optional(),
    /** Время последнего сообщения */
    lastMessageAt: z.string().datetime().nullable().optional(),
  })
  .openapi("BotUserDialogItem");

/** Пагинированный ответ GET /users */
export const BotUsersPageSchema = z
  .object({
    /** Страница диалогов */
    users: z.array(BotUserDialogItemSchema),
    /** Всего записей с учётом фильтра */
    total: z.number().int().openapi({ example: 120 }),
    /** Есть ли следующая страница */
    hasMore: z.boolean().openapi({ example: true }),
  })
  .openapi("BotUsersPage");

/** Тело POST — создать / upsert пользователя бота */
export const CreateBotUserRequestSchema = z
  .object({
    /** Telegram user_id (обязателен) */
    userId: z.union([z.string(), z.number()]).openapi({
      example: "123456789",
      description: "ID пользователя в Telegram",
    }),
    /** Опциональный tokenId бота (иначе из query) */
    tokenId: z.number().int().positive().optional().openapi({ example: 7 }),
    /** Username без @ */
    username: z.string().optional().openapi({ example: "ivan" }),
    /** Имя */
    firstName: z.string().optional().openapi({ example: "Иван" }),
    /** Фамилия */
    lastName: z.string().optional().openapi({ example: "Петров" }),
    /** Код языка Telegram */
    languageCode: z.string().optional().openapi({ example: "ru" }),
    /** 1 если это бот */
    isBot: z.number().int().optional().openapi({ example: 0 }),
    /** 1 если Telegram Premium */
    isPremium: z.number().int().optional().openapi({ example: 0 }),
  })
  .openapi("CreateBotUserRequest");

/** Строка bot_users после INSERT/UPSERT */
export const BotUserRowSchema = z
  .object({
    user_id: z.union([z.string(), z.number()]).openapi({ example: "123456789" }),
    project_id: z.number().int().openapi({ example: 42 }),
    token_id: z.number().int().openapi({ example: 7 }),
    username: z.string().nullable().optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    language_code: z.string().nullable().optional(),
    is_bot: z.number().int().optional(),
    is_premium: z.number().int().optional(),
    registered_at: z.string().optional(),
    last_interaction: z.string().optional(),
  })
  .passthrough()
  .openapi("BotUserRow");
