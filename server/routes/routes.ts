/**
 * @fileoverview Основной роутер HTTP API для проектов, токенов, интеграций и базы пользователей
 */

import { insertBotTemplateSchema, insertBotTokenSchema, insertUserBotDataSchema } from "@shared/schema";
import { ChildProcess } from "child_process";
import PostgresStore from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { type Server } from "http";
import multer from "multer";
import { join } from "path";
import { Pool } from "pg";

/**
 * Экспортируемый экземпляр session middleware для использования в WebSocket.
 * Инициализируется в registerRoutes() и позволяет прикрепить сессию к WS запросам.
 */
export let exportedSessionMiddleware: RequestHandler | null = null;
import { z } from "zod";
import { eq } from "drizzle-orm";
import { cleanupBotStates } from "../bots/cleanupBotStates";
import { stopBot } from "../bots/stopBot";
import dbRoutes from "../database/db-routes";
import { db } from "../database/db";
import { initializeDatabaseTables } from "../database/init-db";
import { ensureDefaultProject } from "../utils/ensureDefaultProject";
import { downloadFileFromUrl } from "../files/downloadFileFromUrl";
import { getFileType } from "../files/getFileType";
import { setupGoogleAuthRoutes } from "../google-sheets/setupGoogleAuthRoutes";
import { seedDefaultTemplates } from "../utils/seed-templates";
import { storage } from "../storages/storage";
import { initializeTelegramManager, telegramClientManager } from "../telegram/telegram-client";
import { telegramAuthService } from "../telegram/telegram-auth-service";
import { createQRClient } from "../telegram/services/auth/create-qr-client";
import { userTelegramSettings } from "@shared/schema";
import { authMiddleware, getOwnerIdFromRequest, requireAuth } from "../telegram/auth-middleware";
import { checkUrlAccessibility } from "../utils/checkUrlAccessibility";
import { handleTelegramError } from "../utils/telegram-error-handler";
import { fetchWithProxy } from "../utils/telegram-proxy";
import { setupAuthRoutes } from "./setupAuthRoutes";
import { setupBotIntegrationRoutes } from "./setupBotIntegrationRoutes";
import { setupGithubPushRoute } from './setupGithubPushRoute';
import { setupWebhookRoutes } from './setupWebhookRoutes';
import { getRedisPublisher } from "../redis/redisClient";
import { setupProjectRoutes } from "./setupProjectRoutes";
import { setupUserProjectAndTokenRoutes } from "./setupUserProjectAndTokenRoutes";
import { setupUserTemplateRoutes } from "./setupUserTemplateRoutes";
import type { StorageBotTokenInput, StorageBotTokenUpdate } from "../storages/storageTypes";
import { createUserIdsRoutes } from "./user-ids-routes";
import { broadcastProjectEvent } from "../terminal";
import { getRequestTokenId, resolveEffectiveProjectTokenId } from "./utils/resolve-request-token";
import { getTelegramProxyAgent } from "../utils/telegram-proxy";

/**
 * Глобальное хранилище активных процессов ботов
 *
 * @type {Map<string, ChildProcess>}
 * @description
 * Карта для хранения активных процессов ботов, где ключом является строка в формате `${projectId}_${tokenId}`,
 * а значением - объект ChildProcess, представляющий запущенный процесс бота.
 *
 * @example
 * ```typescript
 * // Добавление процесса в хранилище
 * botProcesses.set(`${projectId}_${tokenId}`, childProcess);
 *
 * // Получение процесса из хранилища
 * const process = botProcesses.get(`${projectId}_${tokenId}`);
 *
 * // Удаление процесса из хранилища
 * botProcesses.delete(`${projectId}_${tokenId}`);
 * ```
 */
export const botProcesses = new Map<string, ChildProcess>();

// Расширенная настройка multer для загрузки файлов
const storage_multer = multer.diskStorage({
  destination: (req, _file, cb) => {
    const projectId = req.params.projectId;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uploadDir = join(process.cwd(), 'uploads', projectId, date);

    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Исправляем кодировку UTF-8 - декодируем URL-encoded имя
    let originalname = file.originalname;
    try {
      // Сначала пробуем декодировать URL-encoded строку
      originalname = decodeURIComponent(file.originalname);
    } catch (e) {
      // Если не URL-encoded, пробуем исправить mojibake
      try {
        if (file.originalname.includes('Ñ') || file.originalname.includes('Ã')) {
          originalname = Buffer.from(file.originalname, 'latin1').toString('utf-8');
        }
      } catch (e2) {
        console.error('Error fixing filename encoding:', e2);
      }
    }
    
    // Если имя всё ещё пустое или содержит только спецсимволы, используем дефолтное
    const baseNameRaw = originalname
      .split('.')[0]
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 50);
    
    const baseName = baseNameRaw && baseNameRaw !== '_' ? baseNameRaw : 'file';
    
    // Генерируем уникальное имя файла с временной меткой
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = originalname.split('.').pop()?.toLowerCase() || 'jpg';

    cb(null, `${uniqueSuffix}-${baseName}.${extension}`);
  }
});

// Получение расширения файла
const getFileExtension = (filename: string): string => {
  return '.' + filename.split('.').pop()?.toLowerCase() || '';
};

// Расширенная валидация файлов с детальными ограничениями
const validateFileDetailed = (file: Express.Multer.File) => {
  const fileValidation = new Map([
    // Изображения
    ['image/jpeg', { maxSize: 25 * 1024 * 1024, category: 'photo', description: 'JPEG изображение' }],
    ['image/jpg', { maxSize: 25 * 1024 * 1024, category: 'photo', description: 'JPG изображение' }],
    ['image/png', { maxSize: 25 * 1024 * 1024, category: 'photo', description: 'PNG изображение' }],
    ['image/gif', { maxSize: 15 * 1024 * 1024, category: 'photo', description: 'GIF анимация' }],
    ['image/webp', { maxSize: 20 * 1024 * 1024, category: 'photo', description: 'WebP изображение' }],
    ['image/svg+xml', { maxSize: 5 * 1024 * 1024, category: 'photo', description: 'SVG векторное изображение' }],
    ['image/bmp', { maxSize: 30 * 1024 * 1024, category: 'photo', description: 'BMP изображение' }],

    // Видео
    ['video/mp4', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'MP4 видео' }],
    ['video/webm', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'WebM видео' }],
    ['video/avi', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'AVI видео' }],
    ['video/mov', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'QuickTime видео' }],
    ['video/mkv', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'MKV видео' }],
    ['video/quicktime', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'QuickTime видео' }],

    // Аудио
    ['audio/mp3', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'MP3 аудио' }],
    ['audio/mpeg', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'MPEG аудио' }],
    ['audio/wav', { maxSize: 100 * 1024 * 1024, category: 'audio', description: 'WAV аудио' }],
    ['audio/ogg', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'OGG аудио' }],
    ['audio/aac', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'AAC аудио' }],
    ['audio/flac', { maxSize: 100 * 1024 * 1024, category: 'audio', description: 'FLAC аудио' }],
    ['audio/m4a', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'M4A аудио' }],
    ['audio/webm', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'WebM аудио' }],

    // Документы
    ['application/pdf', { maxSize: 50 * 1024 * 1024, category: 'document', description: 'PDF документ' }],
    ['application/msword', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Word документ' }],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Word документ (DOCX)' }],
    ['application/vnd.ms-excel', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Excel таблица' }],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Excel таблица (XLSX)' }],
    ['text/plain', { maxSize: 10 * 1024 * 1024, category: 'document', description: 'Текстовый файл' }],
    ['text/csv', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'CSV файл' }],

    // Дополнительные форматы документов по расширению файла
    ['.pdf', { maxSize: 50 * 1024 * 1024, category: 'document', description: 'PDF документ' }],
    ['.doc', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Word документ' }],
    ['.docx', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Word документ (DOCX)' }],
    ['.txt', { maxSize: 10 * 1024 * 1024, category: 'document', description: 'Текстовый файл' }],
    ['.xls', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Excel таблица' }],
    ['.xlsx', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Excel таблица (XLSX)' }],

    // Архивы
    ['application/zip', { maxSize: 100 * 1024 * 1024, category: 'document', description: 'ZIP архив' }],
    ['application/x-rar-compressed', { maxSize: 100 * 1024 * 1024, category: 'document', description: 'RAR архив' }],
  ]);

  // Сначала проверяем по MIME типу
  let validation = fileValidation.get(file.mimetype);

  // Если не найдено по MIME типу, проверяем по расширению файла
  if (!validation) {
    const extension = getFileExtension(file.originalname);
    validation = fileValidation.get(extension);
  }

  if (!validation) {
    const extension = getFileExtension(file.originalname);
    return {
      valid: false,
      error: `Неподдерживаемый тип файла: ${file.mimetype} (${extension}). Поддерживаются изображения (jpg, png, gif), видео (mp4, webm), аудио (mp3, wav, ogg), документы (pdf, doc, txt).`
    };
  }

  if (file.size > validation.maxSize) {
    const maxSizeMB = Math.round(validation.maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Файл "${file.originalname}" слишком большой. Максимальный размер для ${validation.description}: ${maxSizeMB}МБ`
    };
  }

  // Проверка имени файла
  if (file.originalname.length > 255) {
    return {
      valid: false,
      error: 'Имя файла слишком длинное (максимум 255 символов)'
    };
  }

  // Проверка на безопасность имени файла
  const dangerousPatterns = [/\.\./g, /[<>:"|?*]/g, /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i];
  if (dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
    return {
      valid: false,
      error: 'Небезопасное имя файла'
    };
  }

  return { valid: true, category: validation.category };
};

// Упрощенный фильтр для multer
const fileFilter = (_req: any, file: any, cb: any) => {
  const validation = validateFileDetailed(file);
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

const upload = multer({
  storage: storage_multer,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB максимальный размер файла (для больших видео)
    files: 20, // Максимум 20 файлов за раз
    fieldSize: 10 * 1024 * 1024, // 10MB для полей формы
    fieldNameSize: 300, // Максимальная длина имени поля
    fields: 50 // Максимальное количество полей формы
  }
});

/**
 * Middleware для исправления кодировки UTF-8 в именах файлов
 * Применяется только к маршрутам загрузки медиа
 */
function fixUtf8Encoding(req: any, res: any, next: any) {
  if (req.file && req.file.originalname) {
    try {
      req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf-8');
    } catch (e) {
      console.error('Error fixing filename encoding:', e);
    }
  }
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach((file: any) => {
      try {
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf-8');
      } catch (e) {
        console.error('Error fixing filename encoding:', e);
      }
    });
  }
  next();
}

/**
 * Глобальные флаги готовности компонентов системы
 *
 * @typedef {Object} readinessFlags
 * @property {boolean} isDbReady - Флаг, указывающий на готовность базы данных
 * @property {boolean} areTemplatesReady - Флаг, указывающий на готовность шаблонов
 * @property {boolean} isTelegramReady - Флаг, указывающий на готовность Telegram клиента
 */

/**
 * Флаг, указывающий на готовность базы данных
 * @type {boolean}
 */
let isDbReady = false;

/**
 * Флаг, указывающий на готовность системных шаблонов
 * @type {boolean}
 */
let areTemplatesReady = false;

/**
 * Флаг, указывающий на готовность Telegram клиента
 * @type {boolean}
 */
let isTelegramReady = false;

/**
 * Асинхронная инициализация компонентов системы
 *
 * @function initializeComponents
 * @description
 * Функция выполняет асинхронную инициализацию критических компонентов системы:
 * - Инициализирует базу данных
 * - Создает проект по умолчанию
 * - Очищает состояния ботов
 * - Инициализирует Telegram клиентов
 * - Загружает системные шаблоны
 *
 * @returns {Promise<void>} Промис, который разрешается после завершения инициализации
 *
 * @example
 * ```typescript
 * // Запуск инициализации компонентов
 * await initializeComponents();
 *
 * // Проверка готовности компонентов
 * console.log('База данных готова:', isDbReady);
 * console.log('Шаблоны готовы:', areTemplatesReady);
 * console.log('Telegram готов:', isTelegramReady);
 * ```
 */
async function initializeComponents() {
  try {
    // Инициализация базы данных
    console.log('🔧 Initializing database...');
    const dbInitSuccess = await initializeDatabaseTables();
    if (dbInitSuccess) {
      isDbReady = true;
      console.log('✅ Database ready');

      // После готовности БД запускаем критически важные компоненты сначала
      await Promise.all([
        // Создание проекта по умолчанию (быстро)
        ensureDefaultProject().then(() => {
          console.log('✅ Default project ready');
        }).catch(err => console.error('❌ Default project failed:', err)),

        // Очистка состояний ботов пропускается — восстановление выполняется
        // в restoreRunningBots после старта сервера (server/index.ts)

        // Инициализация Telegram клиентов (быстро)
        initializeTelegramManager().then(() => {
          isTelegramReady = true;
          console.log('✅ Telegram clients ready');
        }).catch(err => console.error('❌ Telegram initialization failed:', err))
      ]).catch(err => console.error('❌ Component initialization failed:', err));

      // Загрузка шаблонов в фоне (не блокирует готовность API)
      // Используем force=false чтобы не пересоздавать шаблоны каждый раз
      seedDefaultTemplates(false).then(() => {
        areTemplatesReady = true;
        console.log('✅ Templates ready');
      }).catch(err => console.error('❌ Templates failed:', err));
    } else {
      console.error('❌ Database initialization failed');
    }
  } catch (error) {
    console.error('❌ Critical initialization error:', error);
  }
}

/**
 * Регистрирует все маршруты API для приложения
 *
 * @function registerRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {Promise<Server>} Промис, который разрешается с экземпляром HTTP-сервера
 *
 * @description
 * Функция регистрирует все маршруты API для приложения, включая:
 * - Маршруты аутентификации
 * - Маршруты управления проектами ботов
 * - Маршруты управления экземплярами ботов
 * - Маршруты управления токенами
 * - Маршруты управления шаблонами
 * - Маршруты управления медиафайлами
 * - Маршруты управления пользовательскими данными
 * - Маршруты управления группами ботов
 * - Маршруты управления сообщениями
 * - Маршруты управления медиафайлами сообщений
 *
 * Также настраивает:
 * - Сессии с использованием PostgreSQL
 * - Middleware аутентификации
 * - Проверки готовности компонентов
 * - Загрузку файлов с использованием multer
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { registerRoutes } from './routes';
 *
 * const app = express();
 * const server = await registerRoutes(app);
 *
 * server.listen(3000, () => {
 *   console.log('Сервер запущен на порту 3000');
 * });
 * ```
 */
export async function registerRoutes(app: Express, httpServer?: Server): Promise<Server> {
  // Создаём pgPool — нужен для session store (fallback) и других роутов
  const pgPool = new (await import('pg')).Pool({
    connectionString: process.env.DATABASE_URL
  });

  // Создаём store: Redis если доступен, иначе PostgreSQL (fallback)
  let store: session.Store;
  const redisClient = getRedisPublisher();
  if (redisClient) {
    const { RedisStore } = await import('connect-redis');
    store = new RedisStore({ client: redisClient as any, prefix: 'sess:' });
    console.log('[Session] Хранилище сессий: Redis');
  } else {
    const PostgresStoreConstructor = (PostgresStore as any)(session);
    store = new PostgresStoreConstructor({ pool: pgPool });
    console.log('[Session] Хранилище сессий: PostgreSQL (Redis недоступен)');
  }

  const sessionMiddleware = session({
    store: store,
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      httpOnly: true,
      // В prod: secure=true + sameSite=none (для cross-origin popup авторизации)
      // В dev: secure=false + sameSite=lax (браузер не отправляет sameSite=none без secure)
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  });

  app.use(sessionMiddleware);
  // Экспортируем для использования в WebSocket (прикрепление сессии к WS запросам)
  exportedSessionMiddleware = sessionMiddleware;

  // Import projects from files in bots directory (public route - no auth required)
  app.get("/api/projects/import-from-files", async (_req, res) => {
    try {
      const importedProjects = await storage.importProjectsFromFiles();
      res.json(importedProjects);
    } catch (error) {
      console.error("Failed to import projects from files:", error);
      res.status(500).json({ message: "Failed to import projects from files" });
    }
  });

  // Auth middleware для всех API роутов (устанавливает req.user если пользователь авторизован)
  // ВАЖНО: должен быть подключен ПОСЛЕ session middleware
  app.use("/api", authMiddleware);

  // Middleware для гостевых сессий — сохраняет сессию при первом API запросе
  // Нужно чтобы sessionId был стабильным между запросами (saveUninitialized: false)
  app.use("/api", (req, _res, next) => {
    if (!req.user && req.session && !req.session.telegramUser) {
      // Помечаем сессию как инициализированную для гостя
      (req.session as any).guest = true;
      req.session.save(() => next());
    } else {
      next();
    }
  });

  // Middleware для отключения кэширования на /api/media/*
  app.use("/api/media", (_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // Запускаем инициализацию в фоне без блокировки сервера
  initializeComponents();

  // Simple API root endpoint for health checks
  app.get("/api", (_req, res) => {
    res.json({ status: "ok", ready: isDbReady });
  });

  app.head("/api", (_req, res) => {
    res.sendStatus(204);
  });

  // API для проверки готовности компонентов
  app.get("/api/health", (_req, res) => {
    res.json({
      database: isDbReady,
      templates: areTemplatesReady,
      telegram: isTelegramReady,
      ready: isDbReady  // API готово когда готова БД
    });
  });

  app.head("/api/health", (_req, res) => {
    res.sendStatus(204);
  });

  /**
 * Middleware для проверки готовности базы данных
 *
 * @function requireDbReady
 * @param {any} _req - Объект запроса Express
 * @param {any} res - Объект ответа Express
 * @param {any} next - Функция перехода к следующему middleware
 *
 * @description
 * Middleware проверяет, готова ли база данных к работе (isDbReady === true).
 * Если база данных не готова, возвращает ошибку 503 с сообщением о том,
 * что сервер еще загружается и предлагает повторить попытку позже.
 *
 * @returns {void} Ничего не возвращает, передает управление дальше через next() или отправляет ответ
 *
 * @example
 * ```typescript
 * // Использование middleware в маршруте
 * app.get('/api/projects', requireDbReady, async (req, res) => {
 *   // Этот код выполнится только если база данных готова
 *   const projects = await storage.getAllBotProjects();
 *   res.json(projects);
 * });
 * ```
 */
  const requireDbReady = (_req: any, res: any, next: any) => {
    if (!isDbReady) {
      return res.status(503).json({
        message: "Сервер еще загружается, попробуйте через несколько секунд",
        database: isDbReady,
        ready: false
      });
    }
    next();
  };

  // Register database management routes
  app.use("/api/database", dbRoutes);

  // Get all bot projects (lightweight - without data field)
  setupProjectRoutes(app, requireDbReady);

  // User IDs management routes (общая база на все проекты)
  app.use("/api/user-ids", createUserIdsRoutes(pgPool));

  // Get all bot instances
  app.get("/api/bots", async (_req, res) => {
    try {
      const instances = await storage.getAllBotInstances();
      res.json(instances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot instances" });
    }
  });

  // Template management endpoints

  // Force update templates
  setupTemplates(app, requireDbReady);

  // Token management endpoints

  // Get all tokens for a project
  app.get("/api/projects/:id/tokens", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);

      // Check project ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const project = await storage.getBotProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        if (project.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to view this project's tokens" });
        }
      }

      const tokens = await storage.getBotTokensByProject(projectId);

      const safeTokens = tokens.map(token => {
        const botId = token.token ? token.token.split(':')[0] : null;
        return { ...token, botId };
      });

      res.json(safeTokens);
      return; // Явно указываем, что функция завершается
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
      res.status(500).json({ message: "Failed to fetch tokens", error: (error as any).message });
      return; // Явно указываем, что функция завершается
    }
  });

  // Parse bot information from Telegram API
  app.post("/api/projects/:id/tokens/parse", async (req, res) => {
    console.log(`\n[📋 Routes] ==========================================`);
    console.log(`[📋 Routes] ЗАПРОС: POST /api/projects/:id/tokens/parse`);
    console.log(`[📋 Routes] Файл: server/routes/routes.ts`);
    console.log(`[📋 Routes] Время: ${new Date().toISOString()}`);
    console.log(`[📋 Routes] ==========================================`);
    
    try {
      const { token } = req.body;
      console.log(`[📋 Routes] Получены данные из req.body:`);
      console.log(`  - token: ${token ? 'есть' : 'НЕТ (ошибка!)'}`);
      console.log(`  - длина токена: ${token?.length || 0}`);

      if (!token) {
        console.log(`[❌ Routes] Ошибка: токен не предоставлен`);
        return res.status(400).json({ message: "Token is required" });
      }

      // Маскировка токена для логирования
      const maskedToken = token.length > 12
        ? `${token.slice(0, 8)}...${token.slice(-4)}`
        : '***';

      console.log(`[📋 Routes] Маскированный токен: ${maskedToken}`);
      console.log(`[📋 Routes] Вызываем fetchWithProxy для getMe...`);

      // Get bot information via Telegram Bot API
      const telegramApiUrl = `https://api.telegram.org/bot${token}/getMe`;
      const startTime = Date.now();
      console.log(`[📋 Routes] URL запроса: ${telegramApiUrl}`);
      console.log(`[📋 Routes] Таймаут: 10000ms`);

      let response;
      try {
        console.log(`[📋 Routes] Вызов fetchWithProxy...`);
        response = await fetchWithProxy(telegramApiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout signal
          signal: AbortSignal.timeout(10000),
        });
        console.log(`[📋 Routes] fetchWithProxy вернул ответ, статус: ${response.status}`);
      } catch (fetchError) {
        console.error(`[❌ Routes] fetchWithProxy выбросил ошибку!`);
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
        const errorCause = fetchError instanceof Error && 'cause' in fetchError
          ? (fetchError.cause as Error)?.message || fetchError.cause
          : 'No cause';

        console.error(`[❌ Telegram] Fetch failed for ${maskedToken}:`);
        console.error(`  - Error: ${errorMessage}`);
        console.error(`  - Cause: ${errorCause}`);
        console.error(`  - Time: ${Date.now() - startTime}ms`);
        console.error(`  - Possible reasons:`);
        console.error(`    • Telegram API is blocked in your network/region`);
        console.error(`    • DNS resolution failed`);
        console.error(`    • Firewall/antivirus blocking connection`);
        console.error(`    • Network connectivity issues`);
        console.error(`  - Solution: Set TELEGRAM_PROXY_URL in .env file`);

        return res.status(500).json({
          message: "Failed to connect to Telegram API",
          error: errorMessage,
          details: "Telegram API may be blocked in your network. Set TELEGRAM_PROXY_URL in .env file.",
          tokenMasked: maskedToken
        });
      }

      const duration = Date.now() - startTime;
      console.log(`[✅ Routes] Response received in ${duration}ms, status: ${response.status}`);

      const result = await response.json();
      console.log(`[📋 Routes] Распарсили JSON ответ:`);
      console.log(`  - ok: ${result.ok}`);
      console.log(`  - result: ${JSON.stringify(result.result, null, 2).substring(0, 200)}...`);

      if (!response.ok) {
        console.warn(`[❌ Routes] Bot token validation failed for ${maskedToken}: ${result.description || 'Unknown error'}`);
        return res.status(400).json({
          message: "Invalid bot token or failed to get bot info",
          error: result.description || "Unknown error"
        });
      }

      console.log(`[✅ Routes] Bot info retrieved successfully: @${result.result.username}`);
      const botInfo = result.result;

      // Get bot description and short description
      let botDescription = null;
      let botShortDescription = null;

      try {
        // Get full description
        const descStartTime = Date.now();
        const descResponse = await fetchWithProxy(`https://api.telegram.org/bot${token}/getMyDescription`, {
          signal: AbortSignal.timeout(5000),
        });
        console.log(`[Telegram API] Description response: ${descResponse.status} (${Date.now() - descStartTime}ms)`);
        
        if (descResponse.ok) {
          const descResult = await descResponse.json();
          if (descResult.ok && descResult.result && descResult.result.description) {
            botDescription = descResult.result.description;
            console.log(`[Telegram API] Bot description length: ${botDescription.length} chars`);
          }
        }

        // Get short description
        const shortDescStartTime = Date.now();
        const shortDescResponse = await fetchWithProxy(`https://api.telegram.org/bot${token}/getMyShortDescription`, {
          signal: AbortSignal.timeout(5000),
        });
        console.log(`[Telegram API] Short description response: ${shortDescResponse.status} (${Date.now() - shortDescStartTime}ms)`);
        
        if (shortDescResponse.ok) {
          const shortDescResult = await shortDescResponse.json();
          if (shortDescResult.ok && shortDescResult.result && shortDescResult.result.short_description) {
            botShortDescription = shortDescResult.result.short_description;
            console.log(`[Telegram API] Bot short description length: ${botShortDescription.length} chars`);
          }
        }
      } catch (descError) {
        const descErrorMessage = descError instanceof Error ? descError.message : 'Unknown error';
        console.warn(`[Telegram API] Failed to get bot descriptions for ${maskedToken}: ${descErrorMessage}`);
      }

      // Get bot photo URL if exists
      let photoUrl = null;
      if (botInfo.photo && botInfo.photo.big_file_id) {
        try {
          const photoStartTime = Date.now();
          const fileResponse = await fetchWithProxy(`https://api.telegram.org/bot${token}/getFile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_id: botInfo.photo.big_file_id
            }),
            signal: AbortSignal.timeout(5000),
          });

          const fileResult = await fileResponse.json();
          console.log(`[Telegram API] Photo file response: ${fileResponse.status} (${Date.now() - photoStartTime}ms)`);

          if (fileResponse.ok && fileResult.result && fileResult.result.file_path) {
            photoUrl = `https://api.telegram.org/file/bot${token}/${fileResult.result.file_path}`;
            console.log(`[Telegram API] Bot photo URL obtained`);
          }
        } catch (photoError) {
          const photoErrorMessage = photoError instanceof Error ? photoError.message : 'Unknown error';
          console.warn(`[Telegram API] Failed to get bot photo URL for ${maskedToken}: ${photoErrorMessage}`);
        }
      }

      // Return parsed bot information
      const parsedBotInfo = {
        botFirstName: botInfo.first_name,
        botUsername: botInfo.username,
        botDescription: botDescription,
        botShortDescription: botShortDescription,
        botPhotoUrl: photoUrl,
        botCanJoinGroups: botInfo.can_join_groups ? 1 : 0,
        botCanReadAllGroupMessages: botInfo.can_read_all_group_messages ? 1 : 0,
        botSupportsInlineQueries: botInfo.supports_inline_queries ? 1 : 0,
        botHasMainWebApp: botInfo.has_main_web_app ? 1 : 0,
      };

      console.log(`[Telegram API] Bot parsing completed successfully for @${botInfo.username}`);
      res.json(parsedBotInfo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      const errorCause = error instanceof Error && 'cause' in error 
        ? (error.cause as Error)?.message || error.cause 
        : 'No cause';
      
      console.error(`[Telegram API] Critical error parsing bot info:`);
      console.error(`  - Message: ${errorMessage}`);
      console.error(`  - Cause: ${errorCause}`);
      console.error(`  - Stack: ${errorStack}`);
      
      res.status(500).json({ 
        message: "Failed to parse bot info",
        error: errorMessage,
        details: errorCause !== 'No cause' ? errorCause : undefined
      });
    }
  });

  // Update bot information via Telegram API
  app.put("/api/projects/:id/tokens/:tokenId/bot-info", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tokenId = parseInt(req.params.tokenId);
      const { field, value } = req.body;

      if (!field || value === undefined) {
        return res.status(400).json({ message: "Field and value are required" });
      }

      // Get bot token
      const token = await storage.getBotToken(tokenId);
      if (!token || token.projectId !== projectId) {
        return res.status(404).json({ message: "Token not found" });
      }

      // Check ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null && token.ownerId !== ownerId) {
        return res.status(403).json({ message: "You don't have permission to modify this token" });
      }

      // Update bot information via Telegram API
      let telegramApiMethod;
      let requestBody: any = {};

      switch (field) {
        case 'name':
          telegramApiMethod = 'setMyName';
          requestBody = { name: value };
          break;
        case 'description':
          telegramApiMethod = 'setMyDescription';
          requestBody = { description: value };
          break;
        case 'shortDescription':
          telegramApiMethod = 'setMyShortDescription';
          requestBody = { short_description: value };
          break;
        default:
          return res.status(400).json({ message: "Invalid field" });
      }

      // Call Telegram API
      const telegramApiUrl = `https://api.telegram.org/bot${token.token}/${telegramApiMethod}`;

      if (getTelegramProxyAgent()) {
        console.log(`[Telegram API] Using proxy for update ${field}`);
      }

      const response = await fetchWithProxy(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        return res.status(400).json({
          message: `Failed to update ${field}`,
          error: result.description || "Unknown error"
        });
      }

      // Update local database with new information
      let updateData: Partial<any> = {};
      switch (field) {
        case 'name':
          updateData.botFirstName = value;
          break;
        case 'description':
          updateData.botDescription = value;
          break;
        case 'shortDescription':
          updateData.botShortDescription = value;
          break;
      }

      await storage.updateBotToken(tokenId, updateData);

      res.json({ success: true, field, value });
    } catch (error) {
      console.error(`Failed to update bot ${req.body.field}:`, error);
      res.status(500).json({ message: `Failed to update bot ${req.body.field}` });
    }
  });

  // Create a new token
  app.post("/api/projects/:id/tokens", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);

      // Check project ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const project = await storage.getBotProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        if (project.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to add tokens to this project" });
        }
      }

      // Игнорируем ownerId из body, используем только из сессии
      const { ownerId: _ignored, ...bodyData } = req.body;
      const tokenData = insertBotTokenSchema.parse({
        ...bodyData,
        projectId,
        ownerId: getOwnerIdFromRequest(req)
      }) as StorageBotTokenInput;

      // Если botUsername не передан — автоматически получаем данные бота из Telegram
      let enrichedTokenData: StorageBotTokenInput = { ...tokenData };
      if (!tokenData.botUsername && tokenData.token) {
        try {
          const tgRes = await fetchWithProxy(`https://api.telegram.org/bot${tokenData.token}/getMe`, {
            signal: AbortSignal.timeout(8000),
          });
          if (tgRes.ok) {
            const tgData = await tgRes.json();
            if (tgData.ok && tgData.result) {
              const r = tgData.result;
              enrichedTokenData = {
                ...enrichedTokenData,
                botUsername: r.username ?? enrichedTokenData.botUsername,
                botFirstName: enrichedTokenData.botFirstName || r.first_name,
                botCanJoinGroups: r.can_join_groups ? 1 : 0,
                botCanReadAllGroupMessages: r.can_read_all_group_messages ? 1 : 0,
                botSupportsInlineQueries: r.supports_inline_queries ? 1 : 0,
                lastUsedAt: new Date(),
              };
            }
          }
        } catch {
          // Не блокируем создание если Telegram недоступен
        }
      }

      const token = await storage.createBotToken(enrichedTokenData);

      broadcastProjectEvent(projectId, {
        type: 'token-created',
        projectId,
        tokenId: token.id,
        data: { tokenId: token.id, tokenName: token.name },
        timestamp: new Date().toISOString(),
      }).catch(err => console.error('[routes] broadcastProjectEvent error:', err));

      res.status(201).json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create token" });
    }
  });

  // Update a token
  app.put("/api/tokens/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Check ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const existingToken = await storage.getBotToken(id);
        if (!existingToken) {
          return res.status(404).json({ message: "Token not found" });
        }
        if (existingToken.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to modify this token" });
        }
      }

      const updateData = insertBotTokenSchema.partial().parse(req.body) as StorageBotTokenUpdate;

      const token = await storage.updateBotToken(id, updateData);
      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }

      res.json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update token" });
    }
  });

  // Update a token by project and token ID
  app.put("/api/projects/:id/tokens/:tokenId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tokenId = parseInt(req.params.tokenId);

      // Check project ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const project = await storage.getBotProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        if (project.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to modify tokens in this project" });
        }

        // Also verify that the token belongs to this project
        const token = await storage.getBotToken(tokenId);
        if (!token || token.projectId !== projectId) {
          return res.status(404).json({ message: "Token not found in this project" });
        }
      }

      const updateData = insertBotTokenSchema.partial().parse(req.body) as StorageBotTokenUpdate;

      const updatedToken = await storage.updateBotToken(tokenId, updateData);
      if (!updatedToken) {
        return res.status(404).json({ message: "Token not found" });
      }

      res.json(updatedToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update token" });
    }
  });

  // Delete a token
  app.delete("/api/tokens/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Check ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const existingToken = await storage.getBotToken(id);
        if (!existingToken) {
          return res.status(404).json({ message: "Token not found" });
        }
        if (existingToken.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to delete this token" });
        }
      }

      const success = await storage.deleteBotToken(id);

      if (!success) {
        return res.status(404).json({ message: "Token not found" });
      }

      res.json({ message: "Token deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete token" });
    }
  });

  // Delete a token for a specific project
  app.delete("/api/projects/:projectId/tokens/:tokenId", async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);

      // Check ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const existingToken = await storage.getBotToken(tokenId);
        if (!existingToken) {
          return res.status(404).json({ message: "Token not found" });
        }
        if (existingToken.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to delete this token" });
        }
      }

      // Останавливаем процесс бота перед удалением токена
      try {
        await stopBot(projectId, tokenId);
      } catch (stopError) {
        console.warn(`[DeleteToken] Не удалось остановить бота ${tokenId} перед удалением:`, stopError);
      }

      const success = await storage.deleteBotToken(tokenId);

      if (!success) {
        return res.status(404).json({ message: "Token not found" });
      }

      res.json({ message: "Token deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete token" });
    }
  });

  /**
   * Переключение настроек автоперезапуска для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/auto-restart
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/auto-restart", async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { autoRestart, maxRestartAttempts } = req.body as {
        autoRestart: number;
        maxRestartAttempts: number;
      };

      if (autoRestart !== 0 && autoRestart !== 1) {
        return res.status(400).json({ message: "autoRestart должен быть 0 или 1" });
      }
      if (maxRestartAttempts < 1 || maxRestartAttempts > 10) {
        return res.status(400).json({ message: "maxRestartAttempts должен быть от 1 до 10" });
      }

      const updated = await storage.updateBotToken(tokenId, { autoRestart, maxRestartAttempts });
      if (!updated) {
        return res.status(404).json({ message: "Токен не найден" });
      }

      res.json({ success: true, autoRestart, maxRestartAttempts });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления настроек автоперезапуска" });
    }
  });

  /**
   * Обновление уровня логирования для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/log-level
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/log-level", async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      const { logLevel } = req.body as { logLevel: string };
      const valid = ['DEBUG', 'INFO', 'WARNING', 'ERROR'] as const;
      if (!(valid as readonly string[]).includes(logLevel)) {
        return res.status(400).json({ message: "Недопустимый уровень логирования" });
      }
      const updated = await storage.updateBotToken(tokenId, { logLevel: logLevel as StorageBotTokenInput["logLevel"] });
      if (!updated) return res.status(404).json({ message: "Токен не найден" });

      // Обновляем .env файл бота если существует
      try {
        const { existsSync, readFileSync, writeFileSync, readdirSync } = await import('fs');
        const { join } = await import('path');
        const botsDir = join(process.cwd(), 'bots');
        if (existsSync(botsDir)) {
          const dirs = readdirSync(botsDir, { withFileTypes: true });
          for (const dir of dirs) {
            if (!dir.isDirectory()) continue;
            const envPath = join(botsDir, dir.name, '.env');
            if (!existsSync(envPath)) continue;
            const content = readFileSync(envPath, 'utf8');
            // Проверяем что это .env нужного проекта по PROJECT_ID
            if (!content.includes(`PROJECT_ID=${projectId}`)) continue;
            const updatedContent = content.replace(/^LOG_LEVEL=.*/m, `LOG_LEVEL=${logLevel}`);
            if (updatedContent !== content) {
              writeFileSync(envPath, updatedContent, 'utf8');
              console.log(`✅ LOG_LEVEL обновлён в ${envPath}: ${logLevel}`);
            }
          }
        }
      } catch (envErr) {
        console.warn('⚠️ Не удалось обновить .env файл бота:', envErr);
      }

      res.json({ success: true, logLevel });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления уровня логирования" });
    }
  });

  // Set default token
  app.post("/api/projects/:projectId/tokens/:tokenId/set-default", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tokenId = parseInt(req.params.tokenId);

      const success = await storage.setDefaultBotToken(projectId, tokenId);
      if (!success) {
        return res.status(404).json({ message: "Token not found" });
      }

      res.json({ message: "Default token set successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to set default token" });
    }
  });

  // Get default token for a project
  app.get("/api/projects/:id/tokens/default", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const token = await storage.getDefaultBotToken(projectId);

      if (!token) {
        return res.json({ hasDefault: false, token: null });
      }

      res.json({ hasDefault: true, token });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch default token" });
    }
  });

  // Get first token for .env generation (full token value)
  app.get("/api/projects/:id/tokens/first", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);

      // Check project ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const project = await storage.getBotProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        if (project.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to access this project's tokens" });
        }
      }

      const tokens = await storage.getBotTokensByProject(projectId);

      if (tokens.length === 0) {
        return res.json({ hasToken: false, token: null });
      }

      // Return full token value for .env generation
      res.json({ hasToken: true, token: tokens[0].token });
    } catch (error) {
      console.error("Failed to fetch first token:", error);
      res.status(500).json({ message: "Failed to fetch token", error: (error as any).message });
    }
  });

  // === МЕДИАФАЙЛЫ ===

  // Загрузка медиафайла (одиночная) с улучшенной обработкой
  app.post("/api/media/upload/:projectId", upload.single('file'), fixUtf8Encoding, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const file = req.file;
      const { description, tags, isPublic } = req.body;

      if (!file) {
        return res.status(400).json({
          message: "Файл не выбран",
          code: "NO_FILE"
        });
      }

      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        // Удаляем загруженный файл если проект не найден
        if (existsSync(file.path)) {
          unlinkSync(file.path);
        }
        return res.status(404).json({
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }

      // Дополнительная валидация файла
      const validation = validateFileDetailed(file);
      if (!validation.valid) {
        // Удаляем файл при ошибке валидации
        if (existsSync(file.path)) {
          unlinkSync(file.path);
        }
        return res.status(400).json({
          message: validation.error,
          code: "VALIDATION_ERROR"
        });
      }

      // Создаем относительный путь для file_path и URL
      // file.path имеет вид: C:\...\uploads\{projectId}\{date}\{filename}
      // Нам нужно: uploads/{projectId}/{date}/{filename} для file_path
      // и /uploads/{projectId}/{date}/{filename} для url
      const uploadsDir = join(process.cwd(), 'uploads');
      const relativePath = file.path.replace(uploadsDir, 'uploads').replace(/\\/g, '/');
      const fileUrl = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

      // Обрабатываем теги
      const processedTags = tags ?
        (Array.isArray(tags) ? tags : tags.split(','))
          .map((tag: string) => tag.trim().toLowerCase())
          .filter((tag: string) => tag.length > 0 && tag.length <= 50)
          .slice(0, 10) // Максимум 10 тегов
        : [];

      // Автоматически добавляем теги на основе типа файла
      const autoTags = [];
      if (validation.category) {
        autoTags.push(validation.category);
      }
      if (file.mimetype.includes('gif')) {
        autoTags.push('анимация');
      }
      if (file.size > 10 * 1024 * 1024) {
        autoTags.push('большой_файл');
      }

      const finalTags = Array.from(new Set([...processedTags, ...autoTags]));

      // Определяем тип файла
      const fileType = getFileType(file.mimetype);

      // Сохраняем информацию о файле в базе данных
      const mediaFile = await storage.createMediaFile({
        projectId,
        fileName: file.originalname,
        fileType: fileType,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        url: fileUrl,
        description: description || `${validation.category || 'Файл'} - ${file.originalname}`,
        tags: finalTags,
        isPublic: isPublic === 'true' || isPublic === true ? 1 : 0
      });

      // Возвращаем подробную информацию о загруженном файле
      res.json({
        ...mediaFile,
        uploadInfo: {
          category: validation.category,
          sizeMB: Math.round(file.size / (1024 * 1024) * 100) / 100,
          autoTagsAdded: autoTags.length,
          uploadDate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error);

      // Удаляем файл в случае ошибки
      if (req.file && existsSync(req.file.path)) {
        try {
          unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Ошибка при удалении файла:", unlinkError);
        }
      }

      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      res.status(500).json({
        message: "Ошибка при загрузке файла",
        error: errorMessage,
        code: "UPLOAD_ERROR"
      });
    }
  });

  // Загрузка множественных медиафайлов с улучшенной обработкой
  app.post("/api/media/upload-multiple/:projectId", upload.array('files', 20), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const files = req.files as Express.Multer.File[];

      const { isPublic, defaultDescription } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          message: "Файлы не выбраны",
          code: "NO_FILES"
        });
      }

      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        // Удаляем все файлы если проект не найден
        files.forEach(file => {
          if (existsSync(file.path)) {
            unlinkSync(file.path);
          }
        });
        return res.status(404).json({
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }

      const uploadedFiles = [];
      const errors = [];
      const warnings: string[] = [];

      // Группируем файлы по типам для статистики
      const fileStats = {
        photo: 0,
        video: 0,
        audio: 0,
        document: 0
      };

      for (const file of files) {
        try {
          // Проверяем размер файла в зависимости от типа
          const maxSize = file.mimetype.startsWith('video/') ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
          if (file.size > maxSize) {
            // Удаляем файл, если он превышает лимит
            unlinkSync(file.path);
            errors.push({
              fileName: file.originalname,
              error: `Файл слишком большой. Максимальный размер: ${file.mimetype.startsWith('video/') ? '100' : '50'}МБ`
            });
            continue;
          }

          // Создаем URL для доступа к файлу
          const fileUrl = `/uploads/${file.filename}`;

          // Сохраняем информацию о файле в базе данных
          const mediaFile = await storage.createMediaFile({
            projectId,
            fileName: file.originalname,
            fileType: getFileType(file.mimetype),
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            url: fileUrl,
            description: defaultDescription || '',
            tags: [],
            isPublic: isPublic ? 1 : 0
          });

          // Обновляем статистику по типам файлов
          const fileType = getFileType(file.mimetype);
          fileStats[fileType]++;

          uploadedFiles.push(mediaFile);
        } catch (fileError) {
          console.error(`Ошибка при обработке файла ${file.originalname}:`, fileError);

          // Удаляем файл в случае ошибки
          if (existsSync(file.path)) {
            try {
              unlinkSync(file.path);
            } catch (unlinkError) {
              console.error("Ошибка при удалении файла:", unlinkError);
            }
          }

          errors.push({
            fileName: file.originalname,
            error: "Ошибка при сохранении файла"
          });
        }
      }

      // Собираем дополнительную статистику
      const totalSize = uploadedFiles.reduce((sum, file) => sum + file.fileSize, 0);

      res.json({
        success: uploadedFiles.length,
        errors: errors.length,
        uploadedFiles,
        errorDetails: errors,
        statistics: {
          totalFiles: files.length,
          totalSize,
          fileTypes: fileStats,
          averageSize: uploadedFiles.length > 0 ? Math.round(totalSize / uploadedFiles.length) : 0
        },
        warnings: warnings.length > 0 ? warnings : undefined
      });
    } catch (error) {
      console.error("Ошибка при загрузке файлов:", error);

      // Удаляем все файлы в случае ошибки
      if (req.files) {
        (req.files as Express.Multer.File[]).forEach(file => {
          if (existsSync(file.path)) {
            try {
              unlinkSync(file.path);
            } catch (unlinkError) {
              console.error("Ошибка при удалении файла:", unlinkError);
            }
          }
        });
      }

      res.status(500).json({ message: "Ошибка при загрузке файлов" });
    }
  });

  // Проверка доступности URL перед загрузкой
  app.post("/api/media/check-url", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          message: "URL не указан",
          code: "MISSING_URL"
        });
      }

      const result = await checkUrlAccessibility(url);

      if (!result.accessible) {
        return res.status(400).json({
          accessible: false,
          error: result.error,
          code: "URL_NOT_ACCESSIBLE"
        });
      }

      // Проверяем тип файла
      const validation = validateFileDetailed({
        mimetype: result.mimeType || 'application/octet-stream',
        size: result.size || 0,
        originalname: result.fileName || 'file'
      } as any);

      if (!validation.valid) {
        return res.status(400).json({
          accessible: false,
          error: validation.error,
          code: "UNSUPPORTED_FILE_TYPE"
        });
      }

      res.json({
        accessible: true,
        fileInfo: {
          mimeType: result.mimeType,
          size: result.size,
          fileName: result.fileName,
          fileType: result.mimeType ? getFileType(result.mimeType) : 'document',
          category: validation.category,
          sizeMB: result.size ? Math.round(result.size / (1024 * 1024) * 100) / 100 : 0
        }
      });

    } catch (error) {
      console.error('Ошибка проверки URL:', error);
      res.status(500).json({
        accessible: false,
        error: "Ошибка при проверке URL",
        code: "CHECK_ERROR"
      });
    }
  });

  // Загрузка файла по URL с расширенными возможностями
  app.post("/api/media/download-url/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { url, description, tags, isPublic, customFileName } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          message: "URL не указан",
          code: "MISSING_URL"
        });
      }

      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        return res.status(404).json({
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }

      // Сначала проверяем доступность файла
      const urlCheck = await checkUrlAccessibility(url);
      if (!urlCheck.accessible) {
        return res.status(400).json({
          message: "Файл недоступен по указанной ссылке",
          error: urlCheck.error,
          code: "URL_NOT_ACCESSIBLE"
        });
      }

      // Создаем путь для сохранения
      const date = new Date().toISOString().split('T')[0];
      const uploadDir = join(process.cwd(), 'uploads', projectId.toString(), date);

      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // Генерируем уникальное имя файла
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalFileName = customFileName || urlCheck.fileName || 'downloaded-file';
      const extension = originalFileName.split('.').pop()?.toLowerCase() || 'bin';
      const baseName = originalFileName
        .split('.')[0]
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 50);

      const fileName = `${uniqueSuffix}-${baseName}.${extension}`;
      const filePath = join(uploadDir, fileName);

      // Загружаем файл
      const downloadResult = await downloadFileFromUrl(url, filePath);

      if (!downloadResult.success) {
        return res.status(400).json({
          message: "Ошибка загрузки файла",
          error: downloadResult.error,
          code: "DOWNLOAD_FAILED"
        });
      }

      // Проверяем загруженный файл
      const validation = validateFileDetailed({
        mimetype: downloadResult.mimeType || 'application/octet-stream',
        size: downloadResult.size || 0,
        originalname: originalFileName,
        path: filePath
      } as any);

      if (!validation.valid) {
        // Удаляем файл если он не прошел валидацию
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
        return res.status(400).json({
          message: validation.error,
          code: "VALIDATION_FAILED"
        });
      }

      // Создаем URL для доступа к файлу
      const fileUrl = `/uploads/${projectId}/${date}/${fileName}`;

      // Обрабатываем теги
      const processedTags = tags
        ? tags
          .split(',')
          .map((tag: string) => tag.trim().toLowerCase())
          .filter((tag: string) => tag.length > 0 && tag.length <= 50)
          .slice(0, 10)
        : [];

      // Автоматически добавляем теги
      const autoTags = ['загружено_по_url'];
      if (validation.category) {
        autoTags.push(validation.category);
      }
      if (downloadResult.mimeType?.includes('gif')) {
        autoTags.push('анимация');
      }
      if (downloadResult.size && downloadResult.size > 10 * 1024 * 1024) {
        autoTags.push('большой_файл');
      }

      const finalTags = Array.from(new Set([...processedTags, ...autoTags]));

      // Сохраняем информацию о файле в базе данных
      const mediaFile = await storage.createMediaFile({
        projectId,
        fileName: originalFileName,
        fileType: getFileType(downloadResult.mimeType || 'application/octet-stream'),
        filePath: filePath,
        fileSize: downloadResult.size || 0,
        mimeType: downloadResult.mimeType || 'application/octet-stream',
        url: fileUrl,
        description: description || `Файл загружен по ссылке: ${originalFileName}`,
        tags: finalTags,
        isPublic: isPublic === 'true' || isPublic === true ? 1 : 0
      });

      // Возвращаем подробную информацию о загруженном файле
      res.json({
        ...mediaFile,
        downloadInfo: {
          sourceUrl: url,
          category: validation.category,
          sizeMB: Math.round((downloadResult.size || 0) / (1024 * 1024) * 100) / 100,
          autoTagsAdded: autoTags.length,
          downloadDate: new Date().toISOString(),
          method: 'url_download'
        }
      });

    } catch (error) {
      console.error('Ошибка при загрузке файла по URL:', error);

      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      res.status(500).json({
        message: "Ошибка при загрузке файла по URL",
        error: errorMessage,
        code: "DOWNLOAD_ERROR"
      });
    }
  });

  // Пакетная загрузка файлов по URL (множественная загрузка)
  app.post("/api/media/download-urls/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { urls, isPublic, defaultDescription } = req.body;

      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({
          message: "URLs не указаны",
          code: "MISSING_URLS"
        });
      }

      if (urls.length > 10) {
        return res.status(400).json({
          message: "Максимум 10 URL за раз",
          code: "TOO_MANY_URLS"
        });
      }

      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        return res.status(404).json({
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }

      const downloadedFiles = [];
      const errors = [];

      // Создаем путь для сохранения
      const date = new Date().toISOString().split('T')[0];
      const uploadDir = join(process.cwd(), 'uploads', projectId.toString(), date);

      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // Обра��атываем каждый URL
      for (let i = 0; i < urls.length; i++) {
        const urlData = urls[i];
        const url = typeof urlData === 'string' ? urlData : urlData.url;
        const customFileName = typeof urlData === 'object' ? urlData.fileName : undefined;
        const customDescription = typeof urlData === 'object' ? urlData.description : undefined;

        try {
          // Проверяем доступность
          const urlCheck = await checkUrlAccessibility(url);
          if (!urlCheck.accessible) {
            errors.push({
              url: url,
              error: `Файл недоступен: ${urlCheck.error}`
            });
            continue;
          }

          // Генерируем путь для ��айла
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const originalFileName = customFileName || urlCheck.fileName || `file-${i + 1}`;
          const extension = originalFileName.split('.').pop()?.toLowerCase() || 'bin';
          const baseName = originalFileName
            .split('.')[0]
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 50);

          const fileName = `${uniqueSuffix}-${baseName}.${extension}`;
          const filePath = join(uploadDir, fileName);

          // Загружаем файл
          const downloadResult = await downloadFileFromUrl(url, filePath);

          if (!downloadResult.success) {
            errors.push({
              url: url,
              error: `Ошибка загрузки: ${downloadResult.error}`
            });
            continue;
          }

          // Валидация
          const validation = validateFileDetailed({
            mimetype: downloadResult.mimeType || 'application/octet-stream',
            size: downloadResult.size || 0,
            originalname: originalFileName,
            path: filePath
          } as any);

          if (!validation.valid) {
            if (existsSync(filePath)) {
              unlinkSync(filePath);
            }
            errors.push({
              url: url,
              error: `Валидация не пройдена: ${validation.error}`
            });
            continue;
          }

          // Создаем URL для доступа
          const fileUrl = `/uploads/${projectId}/${date}/${fileName}`;

          // Сохраняем в базе данных
          const mediaFile = await storage.createMediaFile({
            projectId,
            fileName: originalFileName,
            fileType: getFileType(downloadResult.mimeType || 'application/octet-stream'),
            filePath: filePath,
            fileSize: downloadResult.size || 0,
            mimeType: downloadResult.mimeType || 'application/octet-stream',
            url: fileUrl,
            description: customDescription || defaultDescription || `Файл загружен по ссылке: ${originalFileName}`,
            tags: ['загружено_по_url', validation.category || 'файл'],
            isPublic: isPublic ? 1 : 0
          });

          downloadedFiles.push({
            ...mediaFile,
            sourceUrl: url
          });

        } catch (error) {
          console.error(`Ошибка обработки URL ${url}:`, error);
          errors.push({
            url: url,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
          });
        }
      }

      res.json({
        success: downloadedFiles.length,
        errors: errors.length,
        downloadedFiles,
        errorDetails: errors,
        summary: {
          total: urls.length,
          successful: downloadedFiles.length,
          failed: errors.length,
          totalSize: downloadedFiles.reduce((sum, file) => sum + file.fileSize, 0)
        }
      });

    } catch (error) {
      console.error('Ошибка пакетной загрузки по URL:', error);
      res.status(500).json({
        message: "Ошибка при пакетной загрузке файлов по URL",
        code: "BATCH_DOWNLOAD_ERROR"
      });
    }
  });

  // Получение всех медиафайлов проекта
  app.get("/api/media/project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const fileType = req.query.type as string;

      let mediaFiles;
      if (fileType && ['photo', 'video', 'audio', 'document'].includes(fileType)) {
        mediaFiles = await storage.getMediaFilesByType(projectId, fileType);
      } else {
        mediaFiles = await storage.getMediaFilesByProject(projectId);
      }

      res.json(mediaFiles);
    } catch (error) {
      console.error("Ошибка при получении медиафайлов:", error);
      res.status(500).json({ message: "Ошибка при получении медиафайлов" });
    }
  });

  // Получение конкретного медиафайла
  app.get("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mediaFile = await storage.getMediaFile(id);

      if (!mediaFile) {
        return res.status(404).json({ message: "Файл не найден" });
      }

      res.json(mediaFile);
    } catch (error) {
      console.error("Ошибка при получении файла:", error);
      res.status(500).json({ message: "Ошибка при получении файла" });
    }
  });

  // Обно��ление медиафайла
  app.put("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const mediaFile = await storage.updateMediaFile(id, updates);

      if (!mediaFile) {
        return res.status(404).json({ message: "Файл не найден" });
      }

      res.json(mediaFile);
    } catch (error) {
      console.error("Ошибка при обновлении файла:", error);
      res.status(500).json({ message: "Ошибка при обновлении файла" });
    }
  });

  // Удаление медиафайла
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Получаем информацию о файле перед удалением
      const mediaFile = await storage.getMediaFile(id);
      if (!mediaFile) {
        return res.status(404).json({ message: "Файл не найден" });
      }

      // Удал��ем файл с диска
      try {
        unlinkSync(mediaFile.filePath);
      } catch (error) {
        console.warn("Не удалось удалить файл с диска:", error);
      }

      // Удаляем запись из базы данных
      const success = await storage.deleteMediaFile(id);

      if (!success) {
        return res.status(404).json({ message: "Фай�� не найден в базе данных" });
      }

      res.json({ message: "Файл успешно удален" });
    } catch (error) {
      console.error("Ошибка при удалении файла:", error);
      res.status(500).json({ message: "Ошибка при удалении файла" });
    }
  });

  // Поиск медиафайлов
  app.get("/api/media/search/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({ message: "Поисковый запрос не может быть пустым" });
      }

      const mediaFiles = await storage.searchMediaFiles(projectId, query);
      res.json(mediaFiles);
    } catch (error) {
      console.error("Оши������ка при п����иске ������������йлов:", error);
      res.status(500).json({ message: "Ошибка при поиске файлов" });
    }
  });

  // Увеличение счетчика использования файла
  app.post("/api/media/:id/use", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementMediaFileUsage(id);

      if (!success) {
        return res.status(404).json({ message: "Файл не найден" });
      }

      res.json({ message: "Использование файла отмечено" });
    } catch (error) {
      console.error("Ошибка при обновлении использования файла:", error);
      res.status(500).json({ message: "Ошибка при обновлении использования файла" });
    }
  });

  // User Bot Data Management endpoints

  // Get all user data for a project
  app.get("/api/projects/:id/users", async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);

    try {
      console.log(`Fetching users for project ${projectId}`);

      // Connect directly to PostgreSQL to get data from bot_users table
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      const result = await pool.query(`
        SELECT
          ROW_NUMBER() OVER (ORDER BY bu.last_interaction DESC) AS id,
          bu.user_id::text AS "userId",
          bu.username AS "userName",
          bu.first_name AS "firstName",
          bu.last_name AS "lastName",
          bu.avatar_url AS "avatarUrl",
          bu.registered_at AS "registeredAt",
          bu.registered_at AS "createdAt",
          bu.last_interaction AS "lastInteraction",
          COALESCE(COUNT(bm.id), 0)::integer AS "interactionCount",
          bu.user_data AS "userData",
          CASE WHEN bu.is_active = 1 THEN TRUE ELSE FALSE END AS "isActive",
          FALSE AS "isPremium",
          FALSE AS "isBlocked",
          CASE WHEN bu.is_bot = 1 THEN TRUE ELSE FALSE END AS "isBot"
        FROM bot_users bu
        LEFT JOIN bot_messages bm
          ON bm.user_id = bu.user_id::text
          AND bm.project_id = $1
          AND ($2::integer IS NULL OR bm.token_id = $2)
        WHERE bu.is_bot = 0
          AND bu.project_id = $1
          AND ($2::integer IS NULL OR bu.token_id = $2)
        GROUP BY bu.user_id, bu.username, bu.first_name, bu.last_name, bu.avatar_url, bu.registered_at, bu.last_interaction, bu.user_data, bu.is_active, bu.is_bot
        ORDER BY bu.last_interaction DESC
      `, [projectId, tokenId]);

      // НЕ закрываем пул - он нужен для других запросов

      console.log(`Found ${result.rows.length} users for project ${projectId}`);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to storage interface if bot_users table doesn't exist
      try {
        const users = await storage.getUserBotDataByProject(parseInt(req.params.id), tokenId);
        const projectId = parseInt(req.params.id);
        console.log(`Found ${users.length} users for project ${projectId} from fallback`);
        res.json(users);
      } catch (fallbackError) {
        res.status(500).json({ message: "Failed to fetch user data" });
      }
    }
  });

  // Get user data stats for a project
  app.get("/api/projects/:id/users/stats", async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);

    try {
      // Use direct PostgreSQL query on bot_users table
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      const result = await pool.query(`
        SELECT
          COUNT(DISTINCT bu.user_id) as "totalUsers",
          COUNT(DISTINCT bu.user_id) FILTER (WHERE bu.is_active = 1) as "activeUsers",
          COUNT(DISTINCT bu.user_id) FILTER (WHERE bu.is_active = 0) as "blockedUsers",
          0 as "premiumUsers",
          COUNT(DISTINCT bu.user_id) FILTER (WHERE bu.user_data IS NOT NULL AND bu.user_data != '{}') as "usersWithResponses",
          COALESCE(COUNT(bm.id), 0) as "totalInteractions",
          CASE WHEN COUNT(DISTINCT bu.user_id) > 0 THEN COALESCE(COUNT(bm.id)::float / COUNT(DISTINCT bu.user_id), 0) ELSE 0 END as "avgInteractionsPerUser"
        FROM bot_users bu
        LEFT JOIN bot_messages bm
          ON bm.user_id = bu.user_id::text
          AND bm.project_id = $1
          AND ($2::integer IS NULL OR bm.token_id = $2)
        WHERE bu.project_id = $1
          AND ($2::integer IS NULL OR bu.token_id = $2)
      `, [projectId, tokenId]);

      const stats = result.rows[0];
      // Convert strings to numbers
      Object.keys(stats).forEach(key => {
        if (typeof stats[key] === 'string' && !isNaN(stats[key] as any)) {
          stats[key] = parseInt(stats[key] as any);
        }
      });

      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      // Fallback to user_bot_data table if bot_users doesn't exist
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL
        });

        const result = await pool.query(`
          SELECT 
            COUNT(*) as "totalUsers",
            COUNT(*) FILTER (WHERE is_active = 1) as "activeUsers",
            COUNT(*) FILTER (WHERE is_active = 0) as "blockedUsers",
            COUNT(*) FILTER (WHERE is_premium = 1) as "premiumUsers",
            COUNT(*) FILTER (WHERE user_data IS NOT NULL AND user_data != '{}') as "usersWithResponses",
            COALESCE(SUM(interaction_count), 0) as "totalInteractions",
            COALESCE(AVG(interaction_count), 0) as "avgInteractionsPerUser"
          FROM user_bot_data
          WHERE project_id = $1
            AND ($2::integer IS NULL OR token_id = $2)
        `, [req.params.id, tokenId]);

        // НЕ закрываем пул - он нужен для других запросов

        const stats = result.rows[0];
        Object.keys(stats).forEach(key => {
          if (typeof stats[key] === 'string' && !isNaN(stats[key] as any)) {
            stats[key] = parseInt(stats[key] as any);
          }
        });

        res.json(stats);
      } catch (fallbackError) {
        res.status(500).json({ message: "Failed to fetch user stats" });
      }
    }
  });

  // Get detailed user responses for a project
  app.get("/api/projects/:id/responses", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);

      // Подключаемся напрямую к PostgreSQL для получения ответов пользователей из bot_users
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      const result = await pool.query(`
        SELECT 
          user_id,
          username,
          first_name,
          last_name,
          user_data,
          registered_at,
          last_interaction
        FROM bot_users 
        WHERE project_id = $1
          AND user_data IS NOT NULL 
          AND user_data != '{}'
        ORDER BY last_interaction DESC
      `, [projectId]);

      // НЕ закрываем пул - он нужен для других запросов

      // Обрабатываем и структурируем ответы
      const processedResponses = result.rows.map(user => {
        const responses: any[] = [];

        if (user.user_data && typeof user.user_data === 'object') {
          Object.entries(user.user_data).forEach(([key, value]) => {
            // Принимаем все переменные кроме служебных и generic button clicks
            if (!key.startsWith('input_') && !key.startsWith('waiting_') && key !== 'button_click' && key !== 'last_button_click') {
              let responseData;
              let responseType = 'text';
              let timestamp = null;
              let nodeId = null;
              let responseValue = value;

              try {
                // Если value является объектом, извлекаем данные
                if (typeof value === 'object' && value !== null) {
                  responseData = value as any;
                  responseValue = responseData.value || value;
                  responseType = responseData.type || 'text';
                  timestamp = responseData.timestamp;
                  nodeId = responseData.nodeId;
                } else {
                  // Простое значение
                  responseValue = value;
                  responseType = 'text';
                }

                // Определяем тип ответа по контексту
                if (key === 'button_click') {
                  responseType = 'button';
                  // Если это callback data (выглядит как node ID), заменяем на понятное название
                  if (typeof responseValue === 'string' &&
                    (responseValue.match(/^[a-zA-Z0-9_-]{15,25}$/) ||
                      responseValue.match(/^--[a-zA-Z0-9_-]{10,}$/) ||
                      responseValue.includes('-') && responseValue.length > 10)) {
                    responseValue = 'Переход к следующему шагу';
                  }
                } else if (key.includes('желание') || key.includes('пол') || key.includes('choice')) {
                  responseType = 'button';
                } else if (typeof responseValue === 'string' &&
                  (responseValue === 'Да' || responseValue === 'Нет' ||
                    responseValue === 'Женщина' || responseValue === 'Мужчина')) {
                  responseType = 'button';
                }

                // Дополнительная проверка для замены node IDs на понятные названия
                if (typeof responseValue === 'string') {
                  // Проверяем различные форматы node ID
                  if (responseValue.match(/^--[a-zA-Z0-9_-]{10,}$/) ||
                    responseValue.match(/^[a-zA-Z0-9_-]{15,}$/) ||
                    responseValue.match(/^[a-zA-Z0-9-]{20,}$/)) {
                    responseValue = 'Переход к следующему шагу';
                    responseType = 'button';
                  }
                }

                // Если нет временной метки, используем последнее взаимодействие
                if (!timestamp) {
                  timestamp = user.last_interaction;
                }

              } catch (error) {
                // Если не удается обработать, создаем простую структуру
                responseValue = value;
                responseType = 'text';
                timestamp = user.last_interaction;
              }

              responses.push({
                key,
                value: responseValue,
                type: responseType,
                timestamp: timestamp,
                nodeId: nodeId,
                variable: key
              });
            }
          });
        }

        return {
          user_id: user.user_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          registered_at: user.registered_at,
          last_interaction: user.last_interaction,
          responses: responses.sort((a, b) =>
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          ),
          responseCount: responses.length
        };
      }).filter(user => user.responses.length > 0); // Показываем только пользователей с ответами

      res.json(processedResponses);
    } catch (error) {
      console.error("Ошибка получения ответов пользователей:", error);
      res.status(500).json({ message: "Failed to fetch user responses" });
    }
  });

  // Get specific user data by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = await storage.getUserBotData(id);
      if (!userData) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Get user data by project and telegram user ID
  app.get("/api/projects/:projectId/users/:userId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.params.userId;
      const tokenId = getRequestTokenId(req);
      const userData = await storage.getUserBotDataByProjectAndUser(projectId, userId, tokenId);
      if (!userData) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Create new user data
  app.post("/api/projects/:id/users", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tokenId = getRequestTokenId(req) ?? 0;
      const validatedData = insertUserBotDataSchema.parse({
        ...req.body,
        projectId,
        tokenId,
      });
      const userData = await storage.createUserBotData(validatedData);
      res.status(201).json(userData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user data" });
    }
  });

  // Update user data in bot_users table
  app.put("/api/users/:id", async (req, res) => {
    const userId = req.params.id; // This is telegram user_id as string
    const projectId = Number(req.body.projectId ?? 0);
    const requestedTokenId = getRequestTokenId(req);
    let effectiveTokenId: number | null = null;

    try {
      effectiveTokenId = await resolveEffectiveProjectTokenId(projectId, requestedTokenId);
      // Подключаемся напрямую к PostgreSQL для обновления данных в bot_users
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      // Проверяем какие поля можно обновить
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (req.body.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        // Convert to integer 1 or 0 for PostgreSQL
        values.push(req.body.isActive === 1 || req.body.isActive === true || req.body.isActive === '1' ? 1 : 0);
      }

      // Note: is_blocked and is_premium columns don't exist in bot_users table
      // These fields are handled through user_data JSON field if needed

      if (updateFields.length === 0) {
        // НЕ закрываем пул - он нужен для других запросов
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const query = `
        UPDATE bot_users 
        SET ${updateFields.join(', ')}, last_interaction = NOW()
        WHERE user_id = $${paramIndex} AND project_id = $${paramIndex + 1} AND token_id = $${paramIndex + 2}
        RETURNING *
      `;
      values.push(userId);
      values.push(projectId);
      values.push(effectiveTokenId);

      console.log('Updating user:', userId, 'with query:', query, 'values:', values);

      const result = await pool.query(query, values);
      // НЕ закрываем пул - он нужен для других запросов

      console.log('Update result:', result.rows.length, 'rows affected');

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Ошибка обновления пользователя в bot_users:", error);
      // Fallback to regular update if bot_users table doesn't exist
      try {
        const validatedData = insertUserBotDataSchema.partial().parse({
          ...req.body,
          projectId,
          tokenId: effectiveTokenId ?? requestedTokenId ?? 0,
        });
        const existingUserData = await storage.getUserBotDataByProjectAndUser(
          projectId,
          userId,
          effectiveTokenId ?? requestedTokenId
        );
        const userData = existingUserData
          ? await storage.updateUserBotData(existingUserData.id, validatedData)
          : undefined;
        if (!userData) {
          return res.status(404).json({ message: "User data not found" });
        }
        res.json(userData);
      } catch (fallbackError) {
        res.status(500).json({ message: "Failed to update user data" });
      }
    }
  });

  // Delete user data
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const projectId = Number(req.body?.projectId ?? 0);
      const requestedTokenId = getRequestTokenId(req);
      const tokenId = await resolveEffectiveProjectTokenId(projectId, requestedTokenId);

      // Подключение к PostgreSQL для прямого удаления
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        // Удаляем сообщения пользователя из таблицы bot_messages
        try {
          const deleteMessagesResult = await pool.query(
            `DELETE FROM bot_messages WHERE user_id = $1 AND project_id = $2 AND token_id = $3`,
            [id, projectId, tokenId]
          );

          console.log(`Deleted ${deleteMessagesResult.rowCount || 0} messages from bot_messages for user ${id}`);
        } catch (dbError) {
          console.log("bot_messages table not found or error:", (dbError as any).message);
        }

        // Пытаемся удалить из bot_users если пользователь передал user_id
        const deleteResult = await pool.query(
          `DELETE FROM bot_users WHERE user_id = $1 AND project_id = $2 AND token_id = $3`,
          [id, projectId, tokenId]
        );

        // НЕ закрываем пул - он нужен для других запросов

        if (deleteResult.rowCount && deleteResult.rowCount > 0) {
          console.log(`Deleted user ${id} from bot_users table`);
          return res.json({ message: "User data deleted successfully" });
        }
      } catch (dbError) {
        // НЕ закрываем пул - он нужен для других запросов
        console.log("bot_users table not found, falling back to user_bot_data");
      }

      // Fallback: удаляем из user_bot_data таблицы
      const existingUserData = await storage.getUserBotDataByProjectAndUser(
        projectId,
        String(id),
        tokenId ?? requestedTokenId
      );
      const success = existingUserData
        ? await storage.deleteUserBotData(existingUserData.id)
        : false;
      if (!success) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json({ message: "User data deleted successfully" });
    } catch (error) {
      console.error("Failed to delete user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  // Delete all user data for a project
  app.delete("/api/projects/:id/users", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tokenId = getRequestTokenId(req);
      let totalDeleted = 0;

      // Подключение к PostgreSQL
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        // Удаляем в??ех поль??ова??ел????й из таблицы bot_users для данного проекта
        const deleteResult = await pool.query(
          tokenId
            ? `DELETE FROM bot_users WHERE project_id = $1 AND token_id = $2`
            : `DELETE FROM bot_users WHERE project_id = $1`,
          tokenId ? [projectId, tokenId] : [projectId]
        );

        totalDeleted += deleteResult.rowCount || 0;
        console.log(`Deleted ${deleteResult.rowCount || 0} users from bot_users for project ${projectId}`);
      } catch (dbError) {
        console.log("bot_users table not found or error:", (dbError as any).message);
      }

      // НЕ закрываем пул - он нужен для других запросов

      // Удаляем сообщения из таблицы bot_messages
      try {
        const deleteMessagesResult = await pool.query(
          tokenId
            ? `DELETE FROM bot_messages WHERE project_id = $1 AND token_id = $2`
            : `DELETE FROM bot_messages WHERE project_id = $1`,
          tokenId ? [projectId, tokenId] : [projectId]
        );

        totalDeleted += deleteMessagesResult.rowCount || 0;
        console.log(`Deleted ${deleteMessagesResult.rowCount || 0} messages from bot_messages for project ${projectId}`);
      } catch (dbError) {
        console.log("bot_messages table not found or error:", (dbError as any).message);
      }

      // Подсчитываем количество записей в user_bot_data перед удалением
      const existingUserData = await storage.getUserBotDataByProject(projectId, tokenId);
      const userBotDataCount = existingUserData.length;

      // Удаляем из user_bot_data таблицы
      const fallbackSuccess = await storage.deleteUserBotDataByProject(projectId, tokenId);
      if (fallbackSuccess) {
        totalDeleted += userBotDataCount;
        console.log(`Deleted ${userBotDataCount} users from user_bot_data for project ${projectId}`);
      }

      res.json({
        message: "All user data deleted successfully",
        deleted: true,
        deletedCount: totalDeleted
      });
    } catch (error) {
      console.error("Failed to delete user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  // Search user data
  app.get("/api/projects/:id/users/search", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tokenId = getRequestTokenId(req);
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const users = await storage.searchUserBotData(projectId, query.trim(), tokenId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to search user data" });
    }
  });

  // Increment user interaction count
  app.post("/api/users/:id/interaction", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementUserInteraction(id);
      if (!success) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json({ message: "Interaction count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment interaction" });
    }
  });

  // Update user state
  app.put("/api/users/:id/state", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { state } = req.body;

      if (!state || typeof state !== 'string') {
        return res.status(400).json({ message: "State is required and must be a string" });
      }

      const success = await storage.updateUserState(id, state);
      if (!success) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json({ message: "User state updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user state" });
    }
  });

  // Bot Messages endpoints

  // Get message history for a user with media
  setupBotIntegrationRoutes(app);

  // Send verification code to phone number (общая база)
  app.post("/api/telegram-auth/send-code", async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: "Номер телефона обязателен"
        });
      }

      const userId = 'default';

      // Загружаем credentials из БД
      const credentials = await telegramAuthService.loadCredentials(userId);
      if (!credentials || !credentials.apiId || !credentials.apiHash) {
        return res.status(400).json({
          success: false,
          error: "API credentials не настроены. Сначала сохраните API ID и API Hash."
        });
      }

      // Используем новый сервис для отправки кода
      const result = await telegramAuthService.sendCode(
        credentials.apiId,
        credentials.apiHash,
        phoneNumber
      );

      if (result.success) {
        // Сохраняем клиент для последующей проверки кода
        const client = await createQRClient(credentials.apiId, credentials.apiHash);
        telegramClientManager.getClients().set(userId, client);

        res.json({
          success: true,
          message: `Код отправлен через ${result.codeType || 'SMS'}`,
          phoneCodeHash: result.phoneCodeHash,
          codeType: result.codeType,
          nextType: result.nextType
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to send verification code:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка отправки кода"
      });
    }
  });

  // Verify phone code (общая база)
  app.post("/api/telegram-auth/verify-code", async (req, res) => {
    try {
      const { phoneNumber, phoneCode, phoneCodeHash } = req.body;

      if (!phoneNumber || !phoneCode || !phoneCodeHash) {
        return res.status(400).json({
          success: false,
          error: "Все поля обязательны"
        });
      }

      const userId = 'default';
      const client = telegramClientManager.getClients().get(userId);

      if (!client) {
        return res.status(400).json({
          success: false,
          error: "Сначала отправьте код подтверждения"
        });
      }

      const credentials = await telegramAuthService.loadCredentials(userId);
      if (!credentials || !credentials.apiId || !credentials.apiHash) {
        return res.status(400).json({
          success: false,
          error: "API credentials не найдены"
        });
      }

      // Используем новый сервис для проверки кода
      const result = await telegramAuthService.verifyCode(
        client,
        phoneNumber,
        phoneCode,
        phoneCodeHash
      );

      if (result.success) {
        // Сохраняем сессию
        const sessionString = client.session.save();
        await db
          .insert(userTelegramSettings)
          .values({
            userId,
            apiId: credentials.apiId,
            apiHash: credentials.apiHash,
            sessionString: String(sessionString),
            phoneNumber,
            isActive: 1,
          })
          .onConflictDoUpdate({
            target: userTelegramSettings.userId,
            set: {
              sessionString: String(sessionString),
              phoneNumber,
              isActive: 1,
              updatedAt: new Date(),
            },
          });

        console.log(`✅ Авторизация успешна для ${phoneNumber}`);
        res.json({ success: true, message: "Авторизация успешна" });
      } else if (result.needsPassword) {
        res.json({
          success: false,
          error: result.error,
          needsPassword: true
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to verify code:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка проверки кода"
      });
    }
  });

  // Resend verification code via call (общая база)
  app.post("/api/telegram-auth/resend-code", async (req, res) => {
    try {
      const { phoneNumber, phoneCodeHash } = req.body;

      if (!phoneNumber || !phoneCodeHash) {
        return res.status(400).json({
          success: false,
          error: "Номер телефона и хеш кода обязательны"
        });
      }

      const userId = 'default';
      const client = telegramClientManager.getClients().get(userId);

      if (!client) {
        return res.status(400).json({
          success: false,
          error: "Сначала отправьте код подтверждения"
        });
      }

      // Используем новый сервис для повторной отправки
      const result = await telegramAuthService.resendCode(client, phoneNumber, phoneCodeHash);

      if (result.success) {
        // Определяем тип доставки
        const deliveryType = result.codeType || 'голосовой звонок';
        const message = result.codeType 
          ? `Код отправлен через ${deliveryType}`
          : 'Код отправлен через голосовой звонок';
        
        res.json({
          success: true,
          message,
          phoneCodeHash: result.phoneCodeHash,
          codeType: result.codeType,
          nextType: result.nextType
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to resend code:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка повторной отправки кода"
      });
    }
  });

  // Resend verification code via SMS (общая база)
  app.post("/api/telegram-auth/resend-sms", async (req, res) => {
    try {
      const { phoneNumber, phoneCodeHash } = req.body;

      if (!phoneNumber || !phoneCodeHash) {
        return res.status(400).json({
          success: false,
          error: "Номер телефона и хеш кода обязательны"
        });
      }

      const userId = 'default';
      const client = telegramClientManager.getClients().get(userId);

      if (!client) {
        return res.status(400).json({
          success: false,
          error: "Сначала отправьте код подтверждения"
        });
      }

      // Используем новый сервис для повторной отправки
      const result = await telegramAuthService.resendCode(client, phoneNumber, phoneCodeHash);

      if (result.success) {
        const deliveryType = result.codeType || 'SMS';
        const message = result.codeType 
          ? `Код отправлен через ${deliveryType}`
          : 'Код отправлен через SMS';
        
        res.json({
          success: true,
          message,
          phoneCodeHash: result.phoneCodeHash,
          codeType: result.codeType,
          nextType: result.nextType
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to resend SMS:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка отправки SMS"
      });
    }
  });

  // Generate QR code for authentication
  app.post("/api/telegram-auth/qr-generate", async (req, res) => {
    try {
      const { projectId } = req.body;
      const userId = projectId ? String(projectId) : 'default';

      // Загружаем credentials из БД
      const credentials = await telegramAuthService.loadCredentials(userId);
      if (!credentials || !credentials.apiId || !credentials.apiHash) {
        return res.status(400).json({
          success: false,
          error: "API credentials не настроены"
        });
      }

      // Получаем или создаём клиент для генерации QR
      let client = telegramClientManager.getClients().get(`${userId}_qr`);

      if (!client) {
        // Создаём новый клиент для QR-авторизации с параметрами устройства
        client = await createQRClient(credentials.apiId, credentials.apiHash);

        // Отключаем updateLoop чтобы не было TIMEOUT ошибок
        (client as any)._updateLoop = () => {};

        // Сохраняем клиента для последующего обновления токена
        telegramClientManager.getClients().set(`${userId}_qr`, client);
        console.log('💾 QR-клиент создан для пользователя', userId, '- Система:', process.platform, '- Устройство: Server Bot Builder');
      } else {
        console.log('♻️ QR-клиент найден для пользователя', userId, '- Система:', process.platform);
      }

      // Генерируем QR-токен через современный метод
      const result = await telegramAuthService.generateQRToken(
        client,
        credentials.apiId,
        credentials.apiHash
      );

      if (result.success && result.token) {
        res.json({
          success: true,
          qrUrl: result.qrUrl,
          token: result.token,
          expires: result.expires,
        });
      } else {
        // Проверяем, не требуется ли 2FA
        if (result.error?.includes('SESSION_PASSWORD_NEEDED')) {
          console.log('🔐 Требуется 2FA для генерации QR');
          return res.json({
            success: true,
            requiresPassword: true,
            message: 'Требуется ввод 2FA пароля'
          });
        }
        
        // НЕ отключаем клиента при ошибке — он может ещё понадобиться
        console.log('⚠️ Ошибка генерации QR, но клиент сохранён');
        
        res.status(400).json({
          success: false,
          error: result.error || 'Не удалось создать QR-код'
        });
      }
    } catch (error: any) {
      const errorResult = handleTelegramError(error, 'Генерация QR');
      
      if (errorResult.code === 'TIMEOUT') {
        return res.status(503).json(errorResult);
      }
      
      res.status(500).json({
        success: false,
        error: errorResult.error
      });
    }
  });

  // Refresh QR token (обновление токена каждые 30 сек)
  app.post("/api/telegram-auth/qr-refresh", async (req, res) => {
    console.log('📥 /api/telegram-auth/qr-refresh вызван');
    try {
      const { projectId } = req.body;
      const userId = projectId ? String(projectId) : 'default';

      console.log('🔍 Загрузка credentials для пользователя:', userId);
      const credentials = await telegramAuthService.loadCredentials(userId);
      if (!credentials || !credentials.apiId || !credentials.apiHash) {
        return res.status(400).json({
          success: false,
          error: "API credentials не найдены"
        });
      }

      // Получаем существующего клиента
      const client = telegramClientManager.getClients().get(`${userId}_qr`);
      console.log('🔍 Поиск клиента:', `${userId}_qr`, '- найден:', !!client);

      if (!client) {
        return res.status(400).json({
          success: false,
          error: "QR-сессия не найдена. Сгенерируйте новый QR-код."
        });
      }

      // Обновляем токен
      console.log('🔄 Генерация нового QR-токена...');
      const result = await telegramAuthService.generateQRToken(
        client,
        credentials.apiId,
        credentials.apiHash
      );

      if (result.success && result.token) {
        console.log(`🔄 QR-токен обновлён (expires: ${result.expires}с)`);
        res.json({
          success: true,
          qrUrl: result.qrUrl,
          token: result.token,
          expires: result.expires,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Не удалось обновить QR-токен'
        });
      }
    } catch (error: any) {
      console.error("Failed to refresh QR:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка обновления QR-токена"
      });
    }
  });

  // Check QR code status (polling endpoint)
  app.post("/api/telegram-auth/qr-check", async (req, res) => {
    try {
      const { projectId, token, password } = req.body;
      const userId = projectId ? String(projectId) : 'default';

      console.log('📥 /api/telegram-auth/qr-check:', {
        projectId,
        token: token ? token.substring(0, 20) + '...' : 'нет',
        password: password ? '***' + password.slice(-3) : 'нет',
      });

      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Токен обязателен"
        });
      }

      const credentials = await telegramAuthService.loadCredentials(userId);
      if (!credentials || !credentials.apiId || !credentials.apiHash) {
        return res.status(400).json({
          success: false,
          error: "API credentials не найдены"
        });
      }

      // Получаем существующего клиента
      let client = telegramClientManager.getClients().get(`${userId}_qr`);
      const existingClient = client; // Запоминаем был ли клиент
      
      // Проверяем статус токена (с паролем 2FA если есть)
      const result = await telegramAuthService.checkQRStatus(
        credentials.apiId,
        credentials.apiHash,
        token,
        password, // Передаём пароль если есть
        client // Передаём существующий клиент для повторного использования
      );

      // Сохраняем клиент только если он новый
      if (result.client && !existingClient) {
        telegramClientManager.getClients().set(`${userId}_qr`, result.client);
        console.log('💾 QR-клиент сохранён для пользователя', userId);
      }

      if (result.success) {
        // Если требуется 2FA пароль
        if (result.needsPassword) {
          console.log('🔐 Ожидание ввода 2FA пароля...');
          return res.json({
            success: true,
            isAuthenticated: false,
            needsPassword: true,
          });
        }

        // Если авторизация успешна и есть сессия — сохраняем
        if (result.isAuthenticated && result.sessionString) {
          await db
            .insert(userTelegramSettings)
            .values({
              userId,
              apiId: credentials.apiId,
              apiHash: credentials.apiHash,
              sessionString: result.sessionString,
              isActive: 1, // integer, не boolean!
            })
            .onConflictDoUpdate({
              target: userTelegramSettings.userId,
              set: {
                sessionString: result.sessionString,
                isActive: 1,
                updatedAt: new Date(),
              },
            });

          console.log(`✅ QR-авторизация успешна для пользователя ${userId}`);

          // Очищаем клиента после успешной авторизации
          if (result.client) {
            await result.client.disconnect();
          }
          telegramClientManager.getClients().delete(`${userId}_qr`);
          console.log('🗑️ QR-клиент удалён после успешной авторизации');
          
          // Возвращаем успех
          return res.json({
            success: true,
            isAuthenticated: true,
            message: 'Авторизация успешна',
          });
        }

        // Если сессии нет, но isAuthenticated=true — проверяем, есть ли уже сессия в БД
        if (result.isAuthenticated && !result.sessionString) {
          // AUTH_TOKEN_EXPIRED — значит сессия уже должна быть в БД
          const existingSession = await db
            .select()
            .from(userTelegramSettings)
            .where(eq(userTelegramSettings.userId, userId))
            .limit(1);

          const hasSession = existingSession.length > 0 && existingSession[0].sessionString;
          
          console.log(`ℹ️ QR-токен истёк, сессия в БД: ${hasSession ? 'есть' : 'нет'}`);
          
          res.json({
            success: true,
            isAuthenticated: hasSession,
          });
          return;
        }

        res.json({
          success: true,
          isAuthenticated: result.isAuthenticated || false,
          needsPassword: result.needsPassword || false,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to check QR status:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка проверки статуса QR"
      });
    }
  });

  // Verify 2FA password (общая база)
  app.post("/api/telegram-auth/verify-password", async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Пароль обязателен"
        });
      }

      const userId = 'default';
      const client = telegramClientManager.getClients().get(userId);

      if (!client) {
        return res.status(400).json({
          success: false,
          error: "Сначала отправьте код подтверждения"
        });
      }

      // Используем новый сервис для проверки пароля
      const result = await telegramAuthService.verifyPassword(client, password);

      if (result.success) {
        // Сохраняем сессию после успешной 2FA проверки
        const credentials = await telegramAuthService.loadCredentials(userId);
        if (credentials) {
          const sessionString = client.session.save();
          await db
            .insert(userTelegramSettings)
            .values({
              userId,
              apiId: credentials.apiId,
              apiHash: credentials.apiHash,
              sessionString: String(sessionString),
              isActive: 1,
            })
            .onConflictDoUpdate({
              target: userTelegramSettings.userId,
              set: {
                sessionString: String(sessionString),
                isActive: 1,
                updatedAt: new Date(),
              },
            });
        }

        res.json({
          success: true,
          message: "Авторизация с 2FA успешна"
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to verify password:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка проверки пароля"
      });
    }
  });

  // Save API credentials (общая база)
  app.post("/api/telegram-auth/save-credentials", async (req, res) => {
    try {
      const { apiId, apiHash } = req.body;

      if (!apiId || !apiHash) {
        return res.status(400).json({
          success: false,
          error: "API ID и API Hash обязательны"
        });
      }

      // Используем 'default' как userId для общей базы
      const userId = 'default';

      // Используем новый сервис для сохранения credentials
      const result = await telegramAuthService.saveCredentials(userId, apiId, apiHash);

      if (result.success) {
        res.json({
          success: true,
          message: "API credentials сохранены"
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to save credentials:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка сохранения credentials"
      });
    }
  });

  // Get authentication status (общая база)
  app.get("/api/telegram-auth/status", async (_req, res) => {
    try {
      // Используем 'default' как userId для общей базы
      const userId = 'default';
      const status = await telegramClientManager.getAuthStatus(userId);
      res.json(status);
    } catch (error: any) {
      console.error("Failed to get auth status:", error);
      res.status(500).json({
        isAuthenticated: false,
        error: "Ошибка получения статуса авторизации"
      });
    }
  });

  // Logout from Client API (общая база)
  app.post("/api/telegram-auth/logout", async (_req, res) => {
    try {
      const userId = 'default';
      const result = await telegramClientManager.logout(userId);
      if (result.success) {
        res.json({ success: true, message: "Выполнен выход из аккаунта" });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      console.error("Failed to logout:", error);
      res.status(500).json({ success: false, error: "Ошибка при выходе из аккаунта" });
    }
  });

  // Reset API credentials (общая база)
  app.post("/api/telegram-auth/reset-credentials", async (_req, res) => {
    try {
      const userId = 'default';

      // Удаляем credentials из БД
      await db.delete(userTelegramSettings).where(eq(userTelegramSettings.userId, userId));

      // Отключаем и удаляем клиент
      const client = telegramClientManager.getClients().get(userId);
      if (client) {
        await client.disconnect();
        telegramClientManager.getClients().delete(userId);
      }

      res.json({ success: true, message: "API credentials сброшены" });
    } catch (error: any) {
      console.error("Failed to reset credentials:", error);
      res.status(500).json({ success: false, error: "Ошибка при сбросе credentials" });
    }
  });

  // Client API роуты для управления участниками

  // Исключить участника через Client API
  app.post("/api/projects/:projectId/telegram-client/kick-member", async (req, res) => {
    try {
      const { groupId, userId } = req.body;

      if (!groupId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Group ID и User ID обязательны"
        });
      }


      res.json({
        success: true,
        message: "Участник успешно исключен через Client API"
      });
    } catch (error: any) {
      console.error("Failed to kick member via Client API:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при исключении участника",
        error: error.message || "Unknown error"
      });
    }
  });

  // Заблокировать участника через Client API
  app.post("/api/projects/:projectId/telegram-client/ban-member", async (req, res) => {
    try {
      const { groupId, userId } = req.body;

      if (!groupId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Group ID и User ID обязательны"
        });
      }


      res.json({
        success: true,
        message: "Участник успешно заблокирован через Client API"
      });
    } catch (error: any) {
      console.error("Failed to ban member via Client API:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при блокировке участника",
        error: error.message || "Unknown error"
      });
    }
  });

  // Замутить участника через Client API
  app.post("/api/projects/:projectId/telegram-client/restrict-member", async (req, res) => {
    try {
      const { groupId, userId } = req.body;

      if (!groupId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Group ID и User ID обязательны"
        });
      }


      res.json({
        success: true,
        message: "Участник успешно замучен через Client API"
      });
    } catch (error: any) {
      console.error("Failed to restrict member via Client API:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при заглушении участника",
        error: error.message || "Unknown error"
      });
    }
  });

  // Назначить администратора через Client API
  app.post("/api/projects/:projectId/telegram-client/promote-member", async (req, res) => {
    try {
      const { groupId, userId } = req.body;

      if (!groupId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Group ID и User ID обязательны"
        });
      }


      res.json({
        success: true,
        message: "Участник успешно назначен администратором через Client API"
      });
    } catch (error: any) {
      console.error("Failed to promote member via Client API:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при назначении администратора",
        error: error.message || "Unknown error"
      });
    }
  });

  // Снять администраторские права через Client API
  app.post("/api/projects/:projectId/telegram-client/demote-member", async (req, res) => {
    try {
      const { groupId, userId } = req.body;

      if (!groupId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Group ID и User ID обязательны"
        });
      }


      res.json({
        success: true,
        message: "Администраторские права успешно сняты через Client API"
      });
    } catch (error: any) {
      console.error("Failed to demote member via Client API:", error);
      res.status(500).json({
        success: false,
        message: "Ошибка при снятии администраторских прав",
        error: error.message || "Unknown error"
      });
    }
  });

  // Force update templates - Admin endpoint to refresh all system templates
  app.post("/api/templates/refresh", async (_req, res) => {
    try {
      console.log("🔄 Принудительное обновление шаблонов...");
      await seedDefaultTemplates(true); // force = true
      console.log("✅ Шаблоны обновлены успешно");
      res.json({
        message: "Templates updated successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Ошибка обновления шаблонов:", error);
      res.status(500).json({
        message: "Failed to update templates",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // HTML страница со встроенным Telegram Login Widget для авторизации в отдельном окне
  setupAuthRoutes(app);

  // User-specific endpoints
  // Get user's projects
  setupUserProjectAndTokenRoutes(app);

  // Get user's templates
  setupUserTemplateRoutes(app);

  // GitHub push endpoint
  setupGithubPushRoute(app);

  // Webhook роут: приём апдейтов от Telegram и проксирование в Python-процесс бота
  setupWebhookRoutes(app);

  // Если сервер передан извне, используем его, иначе создаем новый
  if (httpServer) {
    return httpServer;
  } else {
    const { createServer } = await import('http');
    const newHttpServer = createServer(app);
    return newHttpServer;
  }
}










function setupTemplates(app: Express, requireDbReady: (_req: any, res: any, next: any) => any) {
  app.post("/api/templates/refresh", async (_req, res) => {
    try {
      console.log('🔄 Принудительное обновление шаблонов по API запросу');
      await seedDefaultTemplates(true);
      res.json({ message: "Templates refreshed successfully" });
    } catch (error) {
      console.error('❌ Ошибка обновления шаблонов:', error);
      res.status(500).json({ message: "Failed to refresh templates" });
    }
  });

  // Recreate templates with hierarchy
  app.post("/api/templates/recreate", async (_req, res) => {
    try {
      console.log('🔄 Пересоздание шаблонов с иерархией по API запросу');
      await seedDefaultTemplates(true);
      res.json({ message: "Templates recreated with hierarchy successfully" });
    } catch (error) {
      console.error('❌ Ошибка пересоздания шаблонов:', error);
      res.status(500).json({ message: "Failed to recreate templates" });
    }
  });

  // Get all templates
  app.get("/api/templates", requireDbReady, async (_req, res) => {
    try {
      const allTemplates = await storage.getAllBotTemplates();
      // Показываем только: системные шаблоны + публичные шаблоны (других пользователей)
      // НЕ показываем личные шаблоны пользователя - они только в "Мои" вкладке
      let templates = allTemplates.filter(t => t.ownerId === null || t.isPublic === 1);

      // Маппинг data -> flow_data для совместимости с фронтендом
      const mappedTemplates = templates.map(template => ({
        ...template,
        flow_data: template.data
      }));
      res.json(mappedTemplates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Get featured templates (must be before /api/templates/:id)
  app.get("/api/templates/featured", async (req, res) => {
    try {
      const ownerId = getOwnerIdFromRequest(req);
      let templates = await storage.getFeaturedTemplates();
      // Фильтруем приватные шаблоны - показываем только публичные + системные + свои
      templates = templates.filter(t => t.isPublic === 1 || t.ownerId === null || (ownerId !== null && t.ownerId === ownerId)
      );
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured templates" });
    }
  });

  // Get templates by category (must be before /api/templates/:id)
  app.get("/api/templates/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { ids } = req.query;
      const ownerId = getOwnerIdFromRequest(req);

      console.log(`📋 Templates category: ${category}, ownerId: ${ownerId}, session: ${req.session?.telegramUser?.id || 'none'}`);

      // Для категории "custom" - показываем только личные шаблоны
      if (category === 'custom') {
        if (ownerId !== null) {
          // Авторизованный пользователь - его шаблоны (ВСЕ, включая приватные)
          console.log(`🔐 Getting custom templates for user: ${ownerId}`);
          const templates = await storage.getUserBotTemplates(ownerId);
          const filtered = templates.filter(t => t.category === 'custom');
          console.log(`✅ Found ${filtered.length} custom templates for user ${ownerId}:`, filtered.map(t => ({ id: t.id, name: t.name, isPublic: t.isPublic })));
          res.json(filtered);
        } else {
          // Гость - шаблоны с owner_id = null, или указанные в query параметре ids
          let templates = await storage.getTemplatesByCategory(category);
          templates = templates.filter(t => t.ownerId === null);

          // Если гость передал IDs - дополняем список его сохраненными шаблонами
          if (ids && typeof ids === 'string') {
            const requestedIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            if (requestedIds.length > 0) {
              const allTemplates = await storage.getAllBotTemplates();
              const userTemplates = allTemplates.filter(t => requestedIds.includes(t.id));
              templates = [...templates, ...userTemplates];
              // Удаляем дубликаты
              templates = templates.filter((t, idx, arr) => arr.findIndex(item => item.id === t.id) === idx);
            }
          }
          res.json(templates);
        }
      } else {
        // Для остальных категорий - только публичные шаблоны + системные
        let templates = await storage.getTemplatesByCategory(category);
        templates = templates.filter(t => t.isPublic === 1 || t.ownerId === null);
        res.json(templates);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates by category" });
    }
  });

  // Search templates (must be before /api/templates/:id)
  app.get("/api/templates/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const ownerId = getOwnerIdFromRequest(req);
      let templates = await storage.searchTemplates(q);
      // Фильтруем приватные шаблоны - показываем только публичные + системные + свои
      templates = templates.filter(t => t.isPublic === 1 || t.ownerId === null || (ownerId !== null && t.ownerId === ownerId)
      );
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to search templates" });
    }
  });

  // Get single template
  app.get("/api/templates/:id", requireDbReady, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getBotTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Check ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        // Allow access to own templates or system templates (ownerId=null)
        if (template.ownerId !== ownerId && template.ownerId !== null) {
          return res.status(403).json({ message: "You don't have permission to access this template" });
        }
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Create new template
  app.post("/api/templates", requireDbReady, async (req, res) => {
    try {
      // Игнорируем ownerId из body, используем только из сессии
      const { ownerId: _ignored, ...bodyData } = req.body;
      console.log('📝 Создание шаблона, isPublic из body:', bodyData.isPublic, 'тип:', typeof bodyData.isPublic);
      const validatedData = insertBotTemplateSchema.parse(bodyData);
      // Автоматически устанавливаем ownerId из авторизованного пользователя
      const templateData = {
        ...validatedData,
        ownerId: getOwnerIdFromRequest(req),
        isPublic: validatedData.isPublic || 0 // Убеждаемся что isPublic имеет значение
      };
      console.log('✅ Финальный templateData.isPublic:', templateData.isPublic);
      const template = await storage.createBotTemplate(templateData);
      console.log('✅ Шаблон создан с isPublic:', template.isPublic);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Update template
  app.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Check ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const existingTemplate = await storage.getBotTemplate(id);
        if (!existingTemplate) {
          return res.status(404).json({ message: "Template not found" });
        }
        // System templates (ownerId=null) can't be modified by users
        if (existingTemplate.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to modify this template" });
        }
      }

      const validatedData = insertBotTemplateSchema.partial().parse(req.body);
      const template = await storage.updateBotTemplate(id, validatedData);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Delete template
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Check ownership if user is authenticated
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId !== null) {
        const existingTemplate = await storage.getBotTemplate(id);
        if (!existingTemplate) {
          return res.status(404).json({ message: "Template not found" });
        }
        // System templates (ownerId=null) can't be deleted by users
        if (existingTemplate.ownerId !== ownerId) {
          return res.status(403).json({ message: "You don't have permission to delete this template" });
        }
      }

      const success = await storage.deleteBotTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Use template (increment use count + create project AND template copy for authenticated user)
  app.post("/api/templates/:id/use", requireDbReady, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ownerId = getOwnerIdFromRequest(req);

      // Получаем исходный шаблон
      const template = await storage.getBotTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Увеличиваем счетчик использований
      await storage.incrementTemplateUseCount(id);

      // Если пользователь авторизован, создаем проект И копию шаблона
      if (ownerId !== null) {
        // Создаем проект
        const newProject = await storage.createBotProject({
          name: template.name,
          description: template.description ?? undefined,
          data: template.data as any,
          ownerId: ownerId,
          userDatabaseEnabled: 1
        });

        // Создаем копию шаблона, сохраняя оригинального владельца
        // Если это официальный шаблон (ownerId=null), он останется официальным
        // Если это шаблон польз��вателя, остается приписан его автору
        // ВАЖНО: новый шаблон всегда создаётся как приватный (isPublic: 0)
        const copiedTemplate = await storage.createBotTemplate({
          name: template.name,
          description: template.description,
          category: 'custom',
          data: template.data as any,
          ownerId: template.ownerId, // Сохраняем оригинального владельца шаблона!
          tags: template.tags,
          isPublic: 0, // Новые шаблоны всегда приватные
          difficulty: (template.difficulty || 'easy') as 'easy' | 'medium' | 'hard',
          language: (template.language || 'ru') as 'ru' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko',
          complexity: template.complexity || 1,
          estimatedTime: template.estimatedTime || 5
        });

        res.json({
          message: "Template copied to your projects and collection",
          project: newProject,
          copiedTemplate
        });
      } else {
        // Для гостей - просто ��нкрементируем счетчик
        res.json({ message: "Template use count incremented" });
      }
    } catch (error) {
      console.error("Template use error:", error);
      res.status(500).json({ message: "Failed to use template" });
    }
  });

  // Rate template
  app.post("/api/templates/:id/rate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const success = await storage.rateTemplate(id, rating);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template rated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to rate template" });
    }
  });

  // Increment template view count
  app.post("/api/templates/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementTemplateViewCount(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "View count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });

  // Increment template download count
  app.post("/api/templates/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementTemplateDownloadCount(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Download count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment download count" });
    }
  });

  // Toggle template like
  app.post("/api/templates/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { liked } = req.body;

      if (typeof liked !== 'boolean') {
        return res.status(400).json({ message: "liked must be a boolean" });
      }

      const success = await storage.toggleTemplateLike(id, liked);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json({ message: liked ? "Template liked" : "Template unliked" });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Toggle template bookmark
  app.post("/api/templates/:id/bookmark", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { bookmarked } = req.body;

      if (typeof bookmarked !== 'boolean') {
        return res.status(400).json({ message: "bookmarked must be a boolean" });
      }

      const success = await storage.toggleTemplateBookmark(id, bookmarked);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json({ message: bookmarked ? "Template bookmarked" : "Template unbookmarked" });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // Callback route for Google OAuth - redirects to proper API endpoint
  app.get('/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      console.error('Google OAuth error:', error);
      return res.status(400).json({ error: 'Authentication failed', details: error });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Redirect to the proper API endpoint to handle the code
    res.redirect(`/api/google-auth/callback?code=${encodeURIComponent(code)}`);
  });

  // Setup Google Auth routes
  setupGoogleAuthRoutes(app);
}

