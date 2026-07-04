/**
 * @fileoverview OpenAPI-схемы healthcheck
 * @module server/swagger/schemas/health
 */

import "./common";
import { z } from "zod";

/** Ответ GET /api/health */
export const HealthResponseSchema = z
  .object({
    /** База данных готова */
    database: z.boolean().openapi({ example: true }),
    /** Шаблоны загружены */
    templates: z.boolean().openapi({ example: true }),
    /** Telegram-клиент инициализирован */
    telegram: z.boolean().openapi({ example: false }),
    /** API готово к работе (равно database) */
    ready: z.boolean().openapi({ example: true }),
  })
  .openapi("HealthResponse");
