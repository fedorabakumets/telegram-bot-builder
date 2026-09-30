/**
 * @fileoverview OpenAPI-схемы версии приложения для admin
 * @module server/swagger/schemas/admin-version
 */

import "./common";
import { z } from "zod";

/** Блок версии в ответах admin */
export const AdminVersionInfoSchema = z
  .object({
    version: z.string().openapi({ example: "2.2.1.0" }),
    releasedAt: z.string().nullable().openapi({ example: "2026-09-30" }),
    notesUrl: z.string().nullable().optional().openapi({ example: null }),
  })
  .openapi("AdminVersionInfo");

/** Ответ GET /admin/api/version */
export const AdminVersionResponseSchema = AdminVersionInfoSchema.openapi("AdminVersionResponse");

/** Ответ GET /admin/api/update-check */
export const AdminUpdateCheckResponseSchema = z
  .object({
    current: AdminVersionInfoSchema,
    latest: AdminVersionInfoSchema.nullable(),
    updateAvailable: z.boolean().openapi({ example: false }),
    checkFailed: z.boolean().openapi({ example: false }),
    deployGuideUrl: z.string().nullable().openapi({ example: "https://github.com/org/repo" }),
  })
  .openapi("AdminUpdateCheckResponse");
