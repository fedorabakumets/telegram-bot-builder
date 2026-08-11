/**
 * @fileoverview OpenAPI-схемы эндпоинтов ADMIN_IDS проекта.
 * @module server/swagger/schemas/project-admin-ids
 */

import "./common";
import { z } from "zod";

/** Path: ID проекта для /admin-ids */
export const AdminIdsProjectIdParamsSchema = z.object({
  /** ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/** Элемент списка админов в ответе GET */
export const AdminIdItemSchema = z
  .object({
    /** Telegram user id администратора */
    id: z.string().openapi({ example: "123456789" }),
  })
  .openapi("AdminIdItem");

/** Ответ GET /api/projects/{id}/admin-ids */
export const AdminIdsResponseSchema = z
  .object({
    /** ID через запятую (как в bot_projects.admin_ids / ADMIN_IDS) */
    adminIds: z.string().openapi({ example: "123456789,987654321" }),
    /** Разобранный список */
    items: z.array(AdminIdItemSchema),
    /** Количество ID */
    count: z.number().int().openapi({ example: 2 }),
  })
  .openapi("AdminIdsResponse");

/** Тело PUT /api/projects/{id}/admin-ids */
export const UpdateAdminIdsRequestSchema = z
  .object({
    /** Полный список ID через запятую (заменяет целиком) */
    adminIds: z.string().openapi({ example: "123456789,987654321" }),
  })
  .openapi("UpdateAdminIdsRequest");

/** Ответ PUT /admin-ids и POST /admin-ids/remove */
export const AdminIdsMutationResponseSchema = z
  .object({
    /** Успех операции */
    success: z.literal(true).openapi({ example: true }),
    /** Актуальный список ID через запятую */
    adminIds: z.string().openapi({ example: "123456789,987654321" }),
  })
  .openapi("AdminIdsMutationResponse");

/** Тело POST /api/projects/{id}/admin-ids/remove */
export const RemoveAdminIdRequestSchema = z
  .object({
    /**
     * ID для удаления. Допускается сырой id или callback_data
     * вида `del_admin_123` (шаблон «Менеджер ботов»).
     */
    adminId: z.string().openapi({ example: "del_admin_987654321" }),
  })
  .openapi("RemoveAdminIdRequest");

/** Ошибка 500 admin-ids */
export const AdminIdsErrorSchema = z
  .object({
    /** Текст ошибки */
    message: z.string().openapi({ example: "Ошибка чтения ADMIN_IDS" }),
    /** Детали (String(error)) */
    error: z.string().optional().openapi({ example: "Error: ..." }),
  })
  .openapi("AdminIdsError");
