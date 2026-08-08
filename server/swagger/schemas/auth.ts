/**
 * @fileoverview OpenAPI-схемы auth-эндпоинтов Studio.
 * @module server/swagger/schemas/auth
 */

import "./common";
import { z } from "zod";

/** Пользователь Telegram из БД / сессии */
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
    photoUrl: z.string().nullable().optional().openapi({
      example: "https://t.me/i/userpic/320/ivan_p.jpg",
    }),
    /** Unix timestamp авторизации */
    authDate: z.number().nullable().optional().openapi({ example: 1710000000 }),
    /** Дата создания записи */
    createdAt: z.union([z.string(), z.date()]).optional().openapi({
      example: "2026-01-15T10:00:00.000Z",
    }),
    /** Дата обновления записи */
    updatedAt: z.union([z.string(), z.date()]).optional().openapi({
      example: "2026-08-08T12:00:00.000Z",
    }),
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
    photo_url: z.string().optional().openapi({
      example: "https://t.me/i/userpic/320/ivan_p.jpg",
    }),
    /** Unix timestamp auth_date */
    auth_date: z.number().optional().openapi({ example: 1710000000 }),
    /**
     * OIDC id_token. В production / режиме telegram_widget обязателен.
     * Повторный вызов с другим id = смена аккаунта.
     */
    id_token: z.string().optional().openapi({
      example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
  })
  .openapi("TelegramAuthRequest");

/** Тело POST /api/auth/dev-login */
export const DevLoginRequestSchema = z
  .object({
    /** Telegram user id (без proof — только в режиме dev-login) */
    id: z.number().openapi({ example: 123456789 }),
    /** Отображаемое имя */
    firstName: z.string().min(1).openapi({ example: "Иван" }),
    /** Опциональный @username */
    username: z.string().optional().openapi({ example: "ivan_p" }),
  })
  .openapi("DevLoginRequest");

/** Тело POST /api/auth/telegram/miniapp */
export const MiniAppAuthRequestSchema = z
  .object({
    /** Строка initData из Telegram.WebApp.initData (HMAC с bot token) */
    initData: z.string().min(1).openapi({
      example: "user=%7B%22id%22%3A123456789%7D&auth_date=1710000000&hash=abc...",
    }),
  })
  .openapi("MiniAppAuthRequest");

/** Успешный ответ POST /api/auth/telegram | miniapp | dev-login */
export const TelegramAuthResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string().optional().openapi({ example: "Авторизация успешна" }),
    user: TelegramUserSchema,
    /** true если в сессии был другой пользователь (смена аккаунта) */
    switched: z.boolean().optional().openapi({ example: false }),
  })
  .openapi("TelegramAuthResponse");

/** Успех dev-login (без message/switched) */
export const DevLoginResponseSchema = z
  .object({
    success: z.literal(true),
    user: TelegramUserSchema,
  })
  .openapi("DevLoginResponse");

/** Ответ GET /api/auth/me */
export const MeResponseSchema = z
  .object({
    /** Текущий пользователь или null */
    user: TelegramUserSchema.nullable(),
  })
  .openapi("MeResponse");

/** Ошибка чтения сессии GET /api/auth/me */
export const MeErrorResponseSchema = z
  .object({
    user: z.null(),
    error: z.string().openapi({ example: "Ошибка чтения сессии" }),
  })
  .openapi("MeErrorResponse");

/**
 * Опциональная session cookie для GET /api/auth/me.
 * Без неё ответ всё равно 200 с user: null.
 */
export const MeCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description:
        "Session cookie после login. Необязательна: без неё `{ user: null }`.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie после login. Необязательна: без неё `{ user: null }`.",
        example: "s%3Axxxx.yyyy",
      },
    }),
});

/**
 * Опциональная session cookie для POST logout.
 * Без cookie хендлер всё равно отвечает 200 (идемпотентно).
 */
export const LogoutCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description:
        "Session cookie. Необязательна: без неё ответ всё равно 200 (выход идемпотентен).",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie. Необязательна: без неё ответ всё равно 200 (выход идемпотентен).",
        example: "s%3Axxxx.yyyy",
      },
    }),
});

/** Ответ POST /api/auth/logout */
export const LogoutResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string().openapi({ example: "Выход выполнен" }),
  })
  .openapi("LogoutResponse");

/** Успешный ответ GET /api/auth/telegram/user/{id} */
export const GetTelegramUserResponseSchema = z
  .object({
    success: z.literal(true),
    user: TelegramUserSchema,
  })
  .openapi("GetTelegramUserResponse");

/** Path-параметр Telegram user id */
export const TelegramUserIdParamsSchema = z.object({
  id: z
    .string()
    .openapi({
      example: "123456789",
      description: "Числовой Telegram user id",
      param: {
        description: "Числовой Telegram user id",
        example: "123456789",
      },
    }),
});
