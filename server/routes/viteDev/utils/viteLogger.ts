/**
 * @fileoverview Логгер Vite
 *
 * Этот модуль предоставляет логгер для Vite, созданный с помощью
 * функции createLogger из Vite.
 *
 * @module viteDev/utils/viteLogger
 */

import { createLogger } from "vite";

/**
 * Логгер Vite для сообщений сборки и разработки
 */
export const viteLogger = createLogger();
