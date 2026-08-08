/**
 * @fileoverview Общие OpenAPI-схемы admin API (cookie, 401).
 * @module server/swagger/schemas/admin-common
 */

import "./common";
import { z } from "zod";

/**
 * Cookie admin_auth после POST /admin/api/login.
 * Без неё JSON API → 401 ADMIN_UNAUTHORIZED.
 */
export const AdminCookiesSchema = z.object({
  admin_auth: z
    .string()
    .optional()
    .openapi({
      description:
        "Admin cookie после `/admin/login` (ключ `ADMIN_API_KEY`). Без неё — 401.",
      example: "eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0",
      param: {
        description:
          "Admin cookie после `/admin/login` (`ADMIN_API_KEY`). Без неё — 401 ADMIN_UNAUTHORIZED.",
        example: "eyJib2R5IjoiLi4uIiwic2lnIjoiLi4uIn0",
      },
    }),
});

/** Ответ 401 admin API */
export const AdminUnauthorizedSchema = z
  .object({
    error: z.literal("ADMIN_UNAUTHORIZED").openapi({ example: "ADMIN_UNAUTHORIZED" }),
  })
  .openapi("AdminUnauthorized");

/** Security requirement admin cookie */
export const ADMIN_SECURITY = [{ adminCookie: [] as string[] }];
