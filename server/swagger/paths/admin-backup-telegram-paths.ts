/**
 * @fileoverview OpenAPI проверки сохранённых реквизитов доставки бэкапов в Telegram.
 */
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ADMIN_SECURITY, AdminCookiesSchema } from "../schemas/admin-common";

/**
 * Регистрирует отправку проверочного файла без содержимого базы.
 * @param registry - Реестр OpenAPI
 */
export function registerAdminBackupTelegramPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "post", path: "/admin/api/runtime-settings/backups/telegram/test", tags: ["admin"],
    summary: "Проверить доставку бэкапов в Telegram",
    description: "Отправляет небольшой файл по сохранённым DB_BACKUP_TELEGRAM_BOT_TOKEN и DB_BACKUP_TELEGRAM_CHAT_ID. " +
      "Работает и при выключенной автоматической доставке. Данных базы в файле нет, токен в ответ не возвращается.",
    security: ADMIN_SECURITY, request: { cookies: AdminCookiesSchema },
    responses: {
      200: { description: "Проверочный файл отправлен", content: { "application/json": { schema: z.object({ ok: z.literal(true) }) } } },
      400: { description: "Некорректные настройки или ошибка Telegram", content: { "application/json": { schema: z.object({ message: z.string() }) } } },
      401: { description: "Нет admin-сессии" },
    },
  });
}
