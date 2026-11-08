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
import { appPath } from "../../../utils/app-root";
import { protectServerBundle } from "../../../utils/protect-server-bundle";

import { createRegisteredUploadsFallback } from "../../media/registered-uploads-fallback";

/**
 * Настраивает раздачу статических файлов
 *
 * @function serveStatic
 * @param {Express} app - Приложение Express
 */
export function serveStatic(app: Express): void {
  const distPath = appPath("dist");
  const publicPath = appPath("public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Не найдена директория сборки: ${distPath}. Убедитесь, что клиент собран (npm run build)`,
    );
  }

  // Раздача файлов из public
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Серверный бандл хранится в dist/server и не должен раздаваться браузеру.
  app.use(protectServerBundle);

  // Раздача файлов из dist
  app.use(express.static(distPath));

  // Зарегистрированные файлы читаются из их хранилища до статической раздачи.
  app.use("/uploads", createRegisteredUploadsFallback());
  // Раздача файлов из основной папки uploads
  const uploadsPath = appPath("uploads");
  if (fs.existsSync(uploadsPath)) {
    app.use("/uploads", express.static(uploadsPath));
  }

  // Раздача файлов из assets (скриншоты, изображения для UI)
  const assetsPath = appPath("assets");
  if (fs.existsSync(assetsPath)) {
    app.use("/assets", express.static(assetsPath));
  }

  // Раздача файлов из папок uploads в директории bots/
  const botsPath = appPath("bots");
  if (fs.existsSync(botsPath)) {
    const botProjects = fs.readdirSync(botsPath);
    botProjects.forEach(project => {
      const projectUploadsPath = path.join(botsPath, project, "uploads");
      if (fs.existsSync(projectUploadsPath)) {
        // Извлекаем project_id из имени папки (например, "импортированный_проект_2106_53_46" -> "53")
        // Формат: {name}_{project_id}_{owner_id}
        const match = project.match(/_(\d+)_(\d+)$/);
        if (match) {
          const projectId = match[1]; // Используем первое число (project_id)
          // Маппим /uploads/{projectId}/... на папку проекта
          app.use(`/uploads/${projectId}`, express.static(projectUploadsPath));
        }
      }
    });
  }


  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
