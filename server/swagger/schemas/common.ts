/**
 * @fileoverview Общие OpenAPI-схемы ошибок и ответов API
 * @module server/swagger/schemas/common
 */

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/** Тело ответа при ошибке валидации Zod */
export const ValidationErrorSchema = z
  .object({
    /** Сообщение об ошибке */
    message: z.string().openapi({ example: "Неверные данные" }),
    /** Детали ошибок Zod */
    errors: z.array(z.unknown()).openapi({ example: [{ path: ["name"], message: "Required" }] }),
  })
  .openapi("ValidationError");

/** Простое сообщение об ошибке */
export const MessageErrorSchema = z
  .object({
    /** Текст ошибки */
    message: z.string().openapi({ example: "Проект не найден" }),
  })
  .openapi("MessageError");

/** Ответ API без авторизации */
export const UnauthorizedSchema = z
  .object({
    /** Код ошибки */
    error: z.string().openapi({ example: "UNAUTHORIZED" }),
  })
  .openapi("UnauthorizedError");

/** Ответ auth-хендлеров с флагом success */
export const AuthErrorSchema = z
  .object({
    /** Успешность операции */
    success: z.literal(false),
    /** Текст ошибки */
    error: z.string().openapi({ example: "Пользователь не найден" }),
  })
  .openapi("AuthError");
