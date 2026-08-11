/**
 * @fileoverview Общие 401/403 для эндпоинтов project-tables.
 * @module server/swagger/paths/project-tables-errors
 */

import {
  ForbiddenSchema,
  UnauthorizedSchema,
} from "../schemas/common";

/** Auth-ошибки requireDbReady + requireProjectAccess */
export const PROJECT_TABLES_AUTH_ERRORS = {
  401: {
    description: "Нет session cookie и Bearer PAT",
    content: {
      "application/json": {
        schema: UnauthorizedSchema,
        example: { error: "UNAUTHORIZED" },
      },
    },
  },
  403: {
    description: "Нет доступа к проекту",
    content: {
      "application/json": {
        schema: ForbiddenSchema,
        example: { message: "Нет доступа к проекту" },
      },
    },
  },
} as const;
