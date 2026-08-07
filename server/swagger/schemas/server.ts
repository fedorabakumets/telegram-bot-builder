/**
 * @fileoverview OpenAPI-схемы эндпоинтов /api/server/*
 * @module server/swagger/schemas/server
 */

import "./common";
import { z } from "zod";
import { ALLOWED_SERVER_ENV_KEYS } from "../../constants/allowed-server-env-keys";

/** Один ключ серверной переменной (без значения) */
export const ServerEnvKeyItemSchema = z
  .object({
    /** Имя переменной из whitelist, заданная в process.env сервера */
    key: z.enum(ALLOWED_SERVER_ENV_KEYS).openapi({
      example: "DATABASE_URL",
      description:
        "Ключ из фиксированного whitelist. В ответ попадают только ключи, у которых в process.env есть непустое значение.",
    }),
  })
  .openapi("ServerEnvKeyItem");

/** Ответ GET /api/server/env-keys */
export const ServerEnvKeysResponseSchema = z
  .object({
    /** Список доступных серверных ключей (без значений) */
    items: z.array(ServerEnvKeyItemSchema).openapi({
      example: [{ key: "DATABASE_URL" }, { key: "REDIS_URL" }],
    }),
  })
  .openapi("ServerEnvKeysResponse");
