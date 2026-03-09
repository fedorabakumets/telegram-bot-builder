/**
 * @fileoverview Утилита логирования с временной меткой
 *
 * Этот модуль предоставляет функцию для логирования сообщений
 * с форматированной временной меткой.
 *
 * @module viteDev/utils/log
 */

/**
 * Логирует сообщение с временной меткой и источником
 *
 * @function log
 * @param {string} message - Сообщение для логирования
 * @param {string} source - Источник сообщения (по умолчанию "express")
 */
export function log(message: string, source = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("ru-RU", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}
