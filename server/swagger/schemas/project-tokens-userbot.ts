/**
 * @fileoverview Схемы Telethon userbot и auth-шагов.
 * @module server/swagger/schemas/project-tokens-userbot
 */

import "./common";
import { z } from "zod";

/** PUT …/userbot */
export const UserbotPutRequestSchema = z
  .object({
    /** 0/1 включить userbot */
    userbotEnabled: z.union([z.literal(0), z.literal(1)]).openapi({ example: 1 }),
    /** API ID my.telegram.org */
    userbotApiId: z.string().nullable().openapi({ example: "12345" }),
    /** API Hash (секрет) */
    userbotApiHash: z.string().nullable().openapi({ example: "abcdef0123456789" }),
    /** Session string (секрет) */
    userbotSessionString: z.string().nullable().optional(),
  })
  .openapi("UserbotPutRequest");

/** Ответ PUT userbot */
export const UserbotPutResponseSchema = z
  .object({
    success: z.literal(true),
    userbotEnabled: z.union([z.literal(0), z.literal(1)]),
  })
  .openapi("UserbotPutResponse");

/** POST send-code */
export const UserbotSendCodeRequestSchema = z
  .object({
    /** API ID */
    apiId: z.string().openapi({ example: "12345" }),
    /** API Hash */
    apiHash: z.string().openapi({ example: "abcdef0123456789" }),
    /** Телефон +E.164 */
    phone: z.string().openapi({ example: "+79001234567" }),
  })
  .openapi("UserbotSendCodeRequest");

/** POST sign-in */
export const UserbotSignInRequestSchema = z
  .object({
    /** Телефон */
    phone: z.string().openapi({ example: "+79001234567" }),
    /** Код из Telegram */
    code: z.string().openapi({ example: "12345" }),
  })
  .openapi("UserbotSignInRequest");

/** POST sign-in-2fa */
export const UserbotSignIn2faRequestSchema = z
  .object({
    /** Пароль 2FA */
    password: z.string().openapi({ example: "cloud-password" }),
  })
  .openapi("UserbotSignIn2faRequest");

/**
 * Ответ auth-шага (прокси из Python userbotAuth).
 * При ok + session_string сервер сохраняет сессию и userbotEnabled=1.
 */
export const UserbotAuthResultSchema = z
  .object({
    /** Успех шага */
    ok: z.boolean().openapi({ example: true }),
    /** Текст ошибки / статуса */
    message: z.string().optional(),
    /** Код ошибки (timeout, …) */
    error: z.string().optional(),
    /** Нужен 2FA */
    needs_2fa: z.boolean().optional(),
    /** Session string при успехе */
    session_string: z.string().optional(),
  })
  .passthrough()
  .openapi("UserbotAuthResult");
