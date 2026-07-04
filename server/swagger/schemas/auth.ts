/**
 * @fileoverview OpenAPI-схемы auth-эндпоинтов
 * @module server/swagger/schemas/auth
 */

import "./common";
import { z } from "zod";

/** Пользователь Telegram из БД */
export const TelegramUserSchema = z
  .object({
    /** Telegram user id */
    id: z.number().openapi({ example: 123456789 }),
    /** Имя */
    firstName: z.string().openapi({ example: "Иван" }),
    /** Фамилия */
    lastName: z.string().nullable().optional().openapi({ example: "Петров" }),
    /** @username */
    username: z.string().nullable().optional().openapi({ example: "ivan_p" }),
    /** URL аватара */
    photoUrl: z.string().nullable().optional(),
    /** Unix timestamp авторизации */
    authDate: z.number().nullable().optional(),
    /** Дата создания записи */
    createdAt: z.union([z.string(), z.date()]).optional(),
    /** Дата обновления записи */
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .openapi("TelegramUser");

/** Тело POST /api/auth/telegram (Telegram Login Widget) */
export const TelegramAuthRequestSchema = z
  .object({
    /** Telegram user id */
    id: z.number().openapi({ example: 123456789 }),
    /** Имя из виджета */
    first_name: z.string().openapi({ example: "Иван" }),
    /** Фамилия из виджета */
    last_name: z.string().optional().openapi({ example: "Петров" }),
    /** Username из виджета */
    username: z.string().optional().openapi({ example: "ivan_p" }),
    /** URL фото из виджета */
    photo_url: z.string().optional(),
    /** Unix timestamp auth_date */
    auth_date: z.number().optional().openapi({ example: 1710000000 }),
    /** OIDC id_token (опционально) */
    id_token: z.string().optional(),
  })
  .openapi("TelegramAuthRequest");

/** Успешный ответ POST /api/auth/telegram */
export const TelegramAuthResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string().openapi({ example: "Авторизация успешна" }),
    user: TelegramUserSchema,
  })
  .openapi("TelegramAuthResponse");

/** Успешный ответ GET /api/auth/telegram/user/{id} */
export const GetTelegramUserResponseSchema = z
  .object({
    success: z.literal(true),
    user: TelegramUserSchema,
  })
  .openapi("GetTelegramUserResponse");
