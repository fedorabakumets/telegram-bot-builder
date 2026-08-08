/**
 * @fileoverview OpenAPI-схемы admin cleanup папок bots/.
 * @module server/swagger/schemas/bot-folders
 */

import "./common";
import { z } from "zod";

/** Успех POST /admin/api/bot-folders/cleanup */
export const AdminBotFoldersCleanupOkSchema = z
  .object({
    /** Имена удалённых директорий */
    deleted: z.array(z.string()).openapi({
      example: ["bot_999_1", "faq_888_2"],
    }),
    /** Папки с нераспознанным именем (не трогали) */
    skipped: z.array(z.string()).openapi({ example: ["README"] }),
    /** Число удалённых */
    count: z.number().int().openapi({ example: 2 }),
    /** Краткий итог */
    message: z.string().openapi({ example: "Удалено 2 папок" }),
  })
  .openapi("AdminBotFoldersCleanupOk");
