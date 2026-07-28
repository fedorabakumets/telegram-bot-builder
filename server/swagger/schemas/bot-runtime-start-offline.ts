/**
 * @fileoverview OpenAPI schemas: массовый запуск офлайн-ботов
 * @module server/swagger/schemas/bot-runtime-start-offline
 */

import "./common";
import { z } from "zod";

/** Результат по одному токену (без секретов) */
export const StartOfflineTokenResultSchema = z
  .object({
    tokenId: z.number().int(),
    success: z.boolean(),
    processId: z.string().optional(),
    error: z.string().optional(),
  })
  .openapi("StartOfflineTokenResult");

/** Ответ POST start-offline-all */
export const StartOfflineAllResponseSchema = z
  .object({
    message: z.string().optional().openapi({ example: "Нет офлайн-ботов" }),
    started: z.number().int(),
    failed: z.number().int(),
    skippedRunning: z.number().int(),
    results: z.array(StartOfflineTokenResultSchema),
  })
  .openapi("StartOfflineAllResponse");

/** data события start-offline-progress */
export const StartOfflineProgressEventDataSchema = z
  .object({
    started: z.number().int(),
    failed: z.number().int(),
    skipped: z.number().int(),
    total: z.number().int(),
    currentTokenId: z.number().int().optional(),
    status: z.enum(["running", "done"]),
    source: z.enum(["ui", "mcp", "api"]).optional(),
  })
  .openapi("StartOfflineProgressEventData");
