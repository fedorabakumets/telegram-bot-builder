/**
 * @fileoverview OpenAPI: GET /api/projects/{projectId}/collaborators (Files UI).
 * @module server/swagger/schemas/project-collaborators-info
 */

import "./common";
import { z } from "zod";

/** Path projectId */
export const CollaboratorsInfoParamsSchema = z.object({
  /** Числовой ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/** Участник проекта для аватара / фильтра «Сотрудник» */
export const CollaboratorInfoSchema = z
  .object({
    /** telegram_users.id */
    userId: z.number().int().openapi({ example: 123456789 }),
    /** Отображаемое имя (ФИО, @username или «Пользователь #id») */
    name: z.string().openapi({ example: "Иван Иванов" }),
    /** URL аватарки Telegram или null */
    photoUrl: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "https://t.me/i/userpic/..." }),
  })
  .openapi("CollaboratorInfo");

/** Ответ — владелец + коллабораторы без дублей */
export const CollaboratorInfoListSchema = z
  .array(CollaboratorInfoSchema)
  .openapi("CollaboratorInfoList");
