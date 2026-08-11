/**
 * @fileoverview Path-параметры OpenAPI для `/api/projects/…/tokens*`.
 * @module server/swagger/schemas/project-tokens-params
 */

import "./common";
import { z } from "zod";

/** Path `:id` проекта (legacy-имя в Express) */
export const ProjectTokensIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/** Path `:id` + `:tokenId` */
export const ProjectTokensIdTokenParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
  /** Числовой ID токена бота */
  tokenId: z.string().openapi({
    example: "7",
    description: "Числовой ID токена бота",
    param: { description: "Числовой ID токена бота", example: "7" },
  }),
});

/** Path `:projectId` + `:tokenId` (настройки / env / logs) */
export const ProjectTokensProjectTokenParamsSchema = z.object({
  /** Числовой ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
  /** Числовой ID токена бота */
  tokenId: z.string().openapi({
    example: "7",
    description: "Числовой ID токена бота",
    param: { description: "Числовой ID токена бота", example: "7" },
  }),
});

/** Path проекта + токена + id env-переменной */
export const ProjectTokensEnvIdParamsSchema = z.object({
  /** Числовой ID проекта */
  projectId: z.string().openapi({
    example: "42",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
  /** Числовой ID токена */
  tokenId: z.string().openapi({
    example: "7",
    param: { description: "Числовой ID токена бота", example: "7" },
  }),
  /** ID записи bot_env_variables */
  id: z.string().openapi({
    example: "15",
    param: { description: "ID переменной env", example: "15" },
  }),
});
