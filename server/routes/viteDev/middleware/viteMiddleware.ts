/**
 * @fileoverview Vite middleware для разработки
 *
 * Этот модуль предоставляет функцию для настройки Vite сервера
 * и обработки маршрутов в режиме разработки.
 *
 * @module viteDev/middleware/viteMiddleware
 */

import type { Express } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

/**
 * Настраивает Vite сервер и middleware
 *
 * @function setupVite
 * @param {Express} app - Приложение Express
 * @param {Server} server - HTTP сервер для HMR
 * @returns {Promise<void>}
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
  // Динамический импорт vite — только в dev режиме, не грузится в продакшне
  const { createServer: createViteServer, createLogger } = await import('vite');
  const viteLogger = createLogger();
  
  const serverOptions = {
    middlewareMode: true,
    hmr: {
      server,
      overlay: false
    },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    configFile: path.resolve(import.meta.dirname, "..", "..", "..", "..", "vite.config.ts"),
    server: serverOptions,
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
  });

  // Обработка WebSocket upgrade для Vite HMR
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.includes('__vite_hmr')) {
      vite.ws.server.handleUpgrade(req, socket, head);
    }
  });

  app.use(vite.middlewares);

  // Раздача файлов из public в режиме разработки
  const publicPath = path.resolve(import.meta.dirname, "..", "..", "..", "..", "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Раздача файлов из uploads в режиме разработки
  const uploadsPath = path.resolve(import.meta.dirname, "..", "..", "..", "..", "uploads");
  if (fs.existsSync(uploadsPath)) {
    app.use("/uploads", express.static(uploadsPath));
  }

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "..",
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      template = template.replace(
        `src="/main.tsx"`,
        `src="/main.tsx?v=${nanoid()}"`,
      );

      const page = await vite.transformIndexHtml(url, template);

      res.status(200).set({
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
