/**
 * @fileoverview Middleware для раздачи статических файлов
 *
 * Этот модуль предоставляет функцию для настройки раздачи
 * статических файлов из директории сборки и public.
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
  const distPath = path.resolve(import.meta.dirname, "..", "..", "..", "..", "dist");
  const publicPath = path.resolve(import.meta.dirname, "..", "..", "..", "..", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Не найдена директория сборки: ${distPath}. Убедитесь, что клиент собран (npm run build)`,
    );
  }

  // Раздача файлов из public
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Раздача файлов из dist
  app.use(express.static(distPath));

  const uploadsPath = path.resolve(import.meta.dirname, "..", "..", "..", "..", "uploads");
  app.use("/uploads", express.static(uploadsPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
