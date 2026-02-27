/**
 * @fileoverview Middleware для раздачи статических файлов
 *
 * Этот модуль предоставляет функцию для настройки раздачи
 * статических файлов из директории сборки.
 *
 * @module viteDev/middleware/staticMiddleware
 */

import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Настраивает раздачу статических файлов
 *
 * @function serveStatic
 * @param {Express} app - Приложение Express
 */
export function serveStatic(app: Express): void {
  const distPath = path.resolve(import.meta.dirname, "..", "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  const uploadsPath = path.resolve(import.meta.dirname, "..", "..", "uploads");
  app.use("/uploads", express.static(uploadsPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
