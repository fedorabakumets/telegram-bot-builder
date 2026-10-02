/**
 * @fileoverview OpenAPI-схемы эндпоинтов /api/server/*
 * @module server/swagger/schemas/server
 */

import "./common";
import { z } from "zod";

/** Один ключ серверной переменной (без значения) */
export const ServerEnvKeyItemSchema = z
  .object({
    /** Имя переменной из WORKER_ENV_PASSTHROUGH (вне denylist), заданной в process.env сервера */
    key: z.string().openapi({
      example: "OPENAI_API_KEY",
      description:
        "Ключ из WORKER_ENV_PASSTHROUGH, не попавший в denylist (botEnvPolicy). " +
        "В ответ попадают только ключи, у которых в process.env есть непустое значение.",
    }),
  })
  .openapi("ServerEnvKeyItem");

/** Ответ GET /api/server/env-keys */
export const ServerEnvKeysResponseSchema = z
  .object({
    /** Список доступных серверных ключей (без значений) */
    items: z.array(ServerEnvKeyItemSchema).openapi({
      example: [{ key: "OPENAI_API_KEY" }, { key: "WEBHOOK_BASE_URL" }],
    }),
  })
  .openapi("ServerEnvKeysResponse");
