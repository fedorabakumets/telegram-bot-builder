/**
 * @fileoverview Модуль для настройки Vite в режиме разработки и статики
 *
 * Этот модуль предоставляет функции для настройки Vite сервера
 * и раздачи статических файлов в продакшене.
 *
 * @module vite
 */

export { log } from "./viteDev/utils/log";
export { setupVite } from "./viteDev/middleware/viteMiddleware";
export { serveStatic } from "./viteDev/middleware/staticMiddleware";
