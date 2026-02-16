import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

/**
 * Логгер Vite, созданный с помощью функции createLogger из Vite.
 * Используется для логирования сообщений, связанных с процессом сборки и разработки.
 */
const viteLogger = createLogger();

/**
 * Функция для логирования сообщений с временной меткой.
 * @param message - Сообщение для логирования.
 * @param source - Источник сообщения (по умолчанию "express").
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Асинхронная функция для настройки Vite в режиме сервера.
 * Создает экземпляр Vite-сервера с необходимыми опциями и подключает его как middleware к приложению Express.
 * Также настраивает обработку запросов к корню для отдачи индексного HTML-файла с возможностью HMR.
 * @param app - Приложение Express, к которому будет подключен Vite.
 * @param server - HTTP-сервер, который будет использоваться для HMR.
 */
export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: {
      server,
      overlay: false // Отключаем overlay для ошибок
    },
    allowedHosts: true as const,
  };

  /**
   * Создание экземпляра Vite-сервера с заданными параметрами.
   * Включает настройку конфигурационного файла, режима сервера и пользовательского логгера.
   * При возникновении ошибки в логгере, процесс завершается с кодом 1.
   */
  const vite = await createViteServer({
    configFile: path.resolve(import.meta.dirname, "..", "vite.config.ts"),
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

  // Подключение middleware Vite к приложению Express
  app.use(vite.middlewares);

  /**
   * Обработка всех остальных маршрутов.
   * Читает index.html из директории клиента, обновляет ссылку на главный скрипт
   * с уникальным параметром для предотвращения кэширования и передает его клиенту.
   * Устанавливает заголовки для отключения кэширования.
   */
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // всегда перезагружаем файл index.html с диска на случай его изменений
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // обновляем путь к главному скрипту с уникальным параметром для предотвращения кэширования
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // трансформируем HTML с помощью Vite для вставки необходимых скриптов
      const page = await vite.transformIndexHtml(url, template);

      // отправляем трансформированный HTML клиенту с заголовками для отключения кэширования
      res.status(200).set({
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }).end(page);
    } catch (e) {
      // исправляем стектрейс ошибки для SSR
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * Функция для настройки статической подачи файлов из директории сборки.
 * Проверяет существование директории сборки и подключает Express middleware
 * для статических файлов. Если запрашиваемый файл не найден, возвращает index.html.
 * @param app - Приложение Express, к которому будут подключены статические файлы.
 */
export function serveStatic(app: Express) {
  // определяем путь к директории сборки (корневая папка проекта)
  const distPath = path.resolve(import.meta.dirname, "..", "..", "dist");

  // проверяем существование директории сборки
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // подключаем middleware для статических файлов
  app.use(express.static(distPath));

  /**
   * Обработка всех остальных маршрутов.
   * Если файл не найден, возвращаем index.html для поддержки клиентского роутинга.
   */
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
