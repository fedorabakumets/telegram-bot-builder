import dotenv from "dotenv";
dotenv.config({ debug: false });
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { stopCleanup } from "./cache";
import { shutdownAllBots } from "./graceful-shutdown";
import { initializeTerminalWebSocket } from "./terminal-websocket";
import { startFileMonitoring } from "./file-monitoring";
import { storage } from "./storage";

/**
 * Основное приложение Express
 *
 * @description
 * Создает экземпляр приложения Express и настраивает основные middleware:
 * - парсинг JSON с лимитом 50MB
 * - парсинг URL-encoded данных с лимитом 50MB
 * - обслуживание статических файлов из директории uploads
 */
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Отдача загруженных файлов
app.use('/uploads', express.static('uploads'));

/**
 * Middleware для логирования запросов к API
 *
 * @description
 * Этот middleware записывает информацию о каждом запросе к API,
 * включая метод, путь, код ответа и время выполнения.
 * Также захватывает JSON-ответы для логирования.
 *
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @param next - Функция перехода к следующему middleware
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Пропускаем логирование частых HEAD-запросов к /api и /api/health для уменьшения шума
      if (req.method === "HEAD" && (path === "/api" || path === "/api/health")) {
        return;
      }

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Основной асинхронный блок инициализации сервера
 *
 * @description
 * Этот блок регистрирует маршруты, настраивает Vite в режиме разработки,
 * устанавливает обработчик ошибок и запускает сервер на порту 5000.
 * Также настраивает корректное завершение работы сервера при получении сигнала SIGTERM.
 */
(async () => {
  const httpServer = createServer(app);
  await registerRoutes(app, httpServer);

  /**
   * Глобальный обработчик ошибок
   *
   * @description
   * Обрабатывает все ошибки, возникающие в приложении.
   * Отправляет клиенту JSON-ответ с кодом состояния и сообщением об ошибке.
   *
   * @param err - Объект ошибки
   * @param _req - Объект запроса (не используется)
   * @param res - Объект ответа
   * @param _next - Функция перехода (не используется)
   */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Внутренняя ошибка сервера";

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    throw err;
  });

  // Инициализируем WebSocket-сервер для терминала
  initializeTerminalWebSocket(httpServer);

  // Важно настраивать Vite только в режиме разработки и после
  // настройки всех остальных маршрутов, чтобы маршрут catch-all
  // не мешал работе других маршрутов
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Запускаем мониторинг файлов
  startFileMonitoring(storage).then(stopMonitoring => {
    log('Мониторинг файлов запущен');
    
    // Функция остановки мониторинга при завершении работы
    const stopMonitoringOnExit = async () => {
      log('Остановка мониторинга файлов...');
      stopMonitoring();
    };
    
    process.on('SIGTERM', async () => {
      await stopMonitoringOnExit();
      log('получен сигнал SIGTERM: закрытие HTTP-сервера');
      await shutdownAllBots();
      stopCleanup();
      httpServer.close(() => {
        log('HTTP-сервер закрыт');
      });
    });

    process.on('SIGINT', async () => {
      await stopMonitoringOnExit();
      log('получен сигнал SIGINT (Ctrl+C): закрытие HTTP-сервера');
      await shutdownAllBots();
      stopCleanup();
      httpServer.close(() => {
        log('HTTP-сервер закрыт');
        process.exit(0);
      });
    });

    // Обработка SIGHUP (часто используется в терминалах)
    process.on('SIGHUP', async () => {
      await stopMonitoringOnExit();
      log('получен сигнал SIGHUP: закрытие HTTP-сервера');
      await shutdownAllBots();
      stopCleanup();
      httpServer.close(() => {
        log('HTTP-сервер закрыт');
        process.exit(0);
      });
    });
  }).catch(error => {
    log(`Ошибка при запуске мониторинга файлов: ${error.message}`);
  });

  // ВСЕГДА запускаем приложение на порту 5000
  // это обслуживает как API, так и клиент.
  // Это единственный порт, который не заблокирован брандмауэром.
  const port = process.env.PORT || 5000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  httpServer.listen(Number(port), host, () => {
    // Отображаем localhost в логах даже при привязке к 0.0.0.0 для внешних подключений
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    log(`сервер запущен на http://${displayHost}:${port}`);
  });

  // Корректное завершение работы
  process.on('SIGTERM', async () => {
    log('получен сигнал SIGTERM: закрытие HTTP-сервера');
    await shutdownAllBots();
    stopCleanup();
    httpServer.close(() => {
      log('HTTP-сервер закрыт');
    });
  });

  process.on('SIGINT', async () => {
    log('получен сигнал SIGINT (Ctrl+C): закрытие HTTP-сервера');
    await shutdownAllBots();
    stopCleanup();
    httpServer.close(() => {
      log('HTTP-сервер закрыт');
      process.exit(0);
    });
  });

  // Обработка SIGHUP (часто используется в терминалах)
  process.on('SIGHUP', async () => {
    log('получен сигнал SIGHUP: закрытие HTTP-сервера');
    await shutdownAllBots();
    stopCleanup();
    httpServer.close(() => {
      log('HTTP-сервер закрыт');
      process.exit(0);
    });
  });
})();
