/**
 * @fileoverview OpenAPI-схемы сессии admin (login / status).
 * @module server/swagger/schemas/admin-auth
 */

import "./common";
import { z } from "zod";

/** Form-body POST /admin/api/login */
export const AdminLoginFormSchema = z
  .object({
    /** Значение `ADMIN_API_KEY` из env */
    key: z.string().min(1).openapi({
      example: "YOUR_ADMIN_API_KEY",
      description: "Ключ админки (`ADMIN_API_KEY`)",
    }),
  })
  .openapi("AdminLoginForm");

/** Ответ GET /admin/api/status */
export const AdminStatusResponseSchema = z
  .object({
    /** Есть ли валидная cookie admin_auth */
    authenticated: z.boolean().openapi({ example: true }),
    /** Админка смонтирована (ключ задан / dev-fallback) */
    adminEnabled: z.literal(true).openapi({ example: true }),
  })
  .openapi("AdminStatusResponse");
