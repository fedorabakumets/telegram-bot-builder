/**
 * @fileoverview Экспорт хендлеров медиа
 *
 * Этот модуль экспортирует все хендлеры и утилиты для работы с медиа.
 *
 * @module botIntegration/handlers/media
 */

export { registerTelegramMediaHandler } from "./registerTelegramMediaHandler";
export { downloadMediaFromTelegram } from "./utils/downloadMedia";
export { getFileType } from "./utils/getFileType";
