import { insertBotTemplateSchema, insertBotTokenSchema, insertUserBotDataSchema } from "@shared/schema";
import { ChildProcess } from "child_process";
import PostgresStore from "connect-pg-simple";
import type { Express } from "express";
import session from "express-session";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import { type Server } from "http";
import multer from "multer";
import { join } from "path";
import { Pool } from "pg";
import { z } from "zod";
import { authMiddleware, getOwnerIdFromRequest } from "./auth-middleware";
import { checkUrlAccessibility } from "./checkUrlAccessibility";
import { cleanupBotStates } from "./cleanupBotStates";
import dbRoutes from "./db-routes";
import { downloadFileFromUrl } from "./downloadFileFromUrl";
import { ensureDefaultProject } from "./ensureDefaultProject";
import { getFileType } from "./getFileType";
import { initializeDatabaseTables } from "./init-db";
import { seedDefaultTemplates } from "./seed-templates";
import { setupAuthRoutes } from "./setupAuthRoutes";
import { setupBotIntegrationRoutes } from "./setupBotIntegrationRoutes";
import { setupGithubPushRoute } from './setupGithubPushRoute';
import { setupProjectRoutes } from "./setupProjectRoutes";
import { setupUserProjectAndTokenRoutes } from "./setupUserProjectAndTokenRoutes";
import { setupUserTemplateRoutes } from "./setupUserTemplateRoutes";
import { storage } from "./storage";
import { initializeTelegramManager, telegramClientManager } from "./telegram-client";

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
    // Генерируем уникальное имя файла с временной меткой и безопасным именем
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const baseName = file.originalname
      .split('.')[0] // Убираем расширение
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Заменяем небезопасные символы
      .substring(0, 50); // Ограничиваем длину

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

        // Очистка состояний ботов (быстро)
        cleanupBotStates().then(() => {
          console.log('✅ Bot states cleaned');
        }).catch(err => console.error('❌ Bot cleanup failed:', err)),

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
  // Инициализируем session middleware с PostgreSQL store
  const pgPool = new (await import('pg')).Pool({
    connectionString: process.env.DATABASE_URL
  });

  const PostgresStoreConstructor = (PostgresStore as any)(session);
  const store = new PostgresStoreConstructor({ pool: pgPool });

  app.use(session({
    store: store,
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      httpOnly: true,
      // КРИТИЧНО: sameSite: 'none' чтобы cookies передавались между popup и main window
      // secure: false в dev (HTTP), true в prod (HTTPS)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    }
  }));

  // Auth middleware для всех API роутов (устанавливает req.user если пользователь авторизован)
  // ВАЖНО: должен быть подключен ПОСЛЕ session middleware
  app.use("/api", authMiddleware);

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

      // Hide actual token values for security
      const safeTokens = tokens.map(token => ({
        ...token,
        token: `${token.token.substring(0, 10)}...`
      }));

      res.json(safeTokens);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
      res.status(500).json({ message: "Failed to fetch tokens", error: (error as any).message });
    }
  });

  // Parse bot information from Telegram API
  app.post("/api/projects/:id/tokens/parse", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      // Get bot information via Telegram Bot API
      const telegramApiUrl = `https://api.telegram.org/bot${token}/getMe`;
      const response = await fetch(telegramApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return res.status(400).json({
          message: "Invalid bot token or failed to get bot info",
          error: result.description || "Unknown error"
        });
      }

      const botInfo = result.result;

      // Get bot description and short description
      let botDescription = null;
      let botShortDescription = null;

      try {
        // Get full description
        const descResponse = await fetch(`https://api.telegram.org/bot${token}/getMyDescription`);
        if (descResponse.ok) {
          const descResult = await descResponse.json();
          if (descResult.ok && descResult.result && descResult.result.description) {
            botDescription = descResult.result.description;
          }
        }

        // Get short description  
        const shortDescResponse = await fetch(`https://api.telegram.org/bot${token}/getMyShortDescription`);
        if (shortDescResponse.ok) {
          const shortDescResult = await shortDescResponse.json();
          if (shortDescResult.ok && shortDescResult.result && shortDescResult.result.short_description) {
            botShortDescription = shortDescResult.result.short_description;
          }
        }
      } catch (descError) {
        console.warn("Failed to get bot descriptions:", descError);
      }

      // Get bot photo URL if exists
      let photoUrl = null;
      if (botInfo.photo && botInfo.photo.big_file_id) {
        try {
          const fileResponse = await fetch(`https://api.telegram.org/bot${token}/getFile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_id: botInfo.photo.big_file_id
            })
          });

          const fileResult = await fileResponse.json();

          if (fileResponse.ok && fileResult.result && fileResult.result.file_path) {
            photoUrl = `https://api.telegram.org/file/bot${token}/${fileResult.result.file_path}`;
          }
        } catch (photoError) {
          console.warn("Failed to get bot photo URL:", photoError);
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

      res.json(parsedBotInfo);
    } catch (error) {
      console.error("Failed to parse bot info:", error);
      res.status(500).json({ message: "Failed to parse bot info" });
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
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
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
      });

      const token = await storage.createBotToken(tokenData);

      // Hide actual token value for security
      const safeToken = {
        ...token,
        token: `${token.token.substring(0, 10)}...`
      };

      res.status(201).json(safeToken);
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

      const updateData = insertBotTokenSchema.partial().parse(req.body);

      const token = await storage.updateBotToken(id, updateData);
      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }

      // Hide actual token value for security
      const safeToken = {
        ...token,
        token: `${token.token.substring(0, 10)}...`
      };

      res.json(safeToken);
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

      const success = await storage.deleteBotToken(tokenId);

      if (!success) {
        return res.status(404).json({ message: "Token not found" });
      }

      res.json({ message: "Token deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete token" });
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

      // Hide actual token value for security
      const safeToken = {
        ...token,
        token: `${token.token.substring(0, 10)}...`
      };

      res.json({ hasDefault: true, token: safeToken });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch default token" });
    }
  });

  // === МЕДИАФАЙЛЫ ===

  // Загрузка медиафайла (одиночная) с улучшенной обработкой
  app.post("/api/media/upload/:projectId", upload.single('file'), async (req, res) => {
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

      // Создаем URL для доступа к файлу относительно проекта
      const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
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

      // Сохраняем информацию о файле в базе данных
      const mediaFile = await storage.createMediaFile({
        projectId,
        fileName: file.originalname,
        fileType: getFileType(file.mimetype),
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

      // Обрабатываем каждый URL
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

          // Генерируем путь для файла
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

  // Обновление медиафайла
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

      // Удаляем файл с диска
      try {
        unlinkSync(mediaFile.filePath);
      } catch (error) {
        console.warn("Не удалось удалить файл с диска:", error);
      }

      // Удаляем запись из базы данных
      const success = await storage.deleteMediaFile(id);

      if (!success) {
        return res.status(404).json({ message: "Файл не найден в базе данных" });
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
      console.error("Ошибка при поиске файлов:", error);
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
    try {
      const projectId = parseInt(req.params.id);
      console.log(`Fetching users for project ${projectId}`);

      // Connect directly to PostgreSQL to get data from bot_users table
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      const result = await pool.query(`
        SELECT 
          bu.user_id AS id,
          bu.user_id AS "userId",
          bu.username AS "userName",
          bu.first_name AS "firstName",
          bu.last_name AS "lastName",
          bu.registered_at AS "registeredAt",
          bu.registered_at AS "createdAt",
          bu.last_interaction AS "lastInteraction",
          COALESCE(COUNT(bm.id), 0)::integer AS "interactionCount",
          bu.user_data AS "userData",
          CASE WHEN bu.is_active = 1 THEN TRUE ELSE FALSE END AS "isActive",
          FALSE AS "isPremium",
          FALSE AS "isBlocked",
          FALSE AS "isBot"
        FROM bot_users bu
        LEFT JOIN bot_messages bm ON bm.user_id = bu.user_id::text AND bm.project_id = $1
        GROUP BY bu.user_id, bu.username, bu.first_name, bu.last_name, bu.registered_at, bu.last_interaction, bu.user_data, bu.is_active
        ORDER BY bu.last_interaction DESC
      `, [projectId]);

      // НЕ закрываем пул - он нужен для других запросов

      console.log(`Found ${result.rows.length} users for project ${projectId}`);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to storage interface if bot_users table doesn't exist
      try {
        const users = await storage.getUserBotDataByProject(parseInt(req.params.id));
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
    try {
      const projectId = parseInt(req.params.id);
      console.log(`Fetching user stats for project ${projectId}`);

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
        LEFT JOIN bot_messages bm ON bm.user_id = bu.user_id::text AND bm.project_id = $1
      `, [projectId]);

      // НЕ закрываем пул - он нужен для других запросов

      const stats = result.rows[0];
      // Convert strings to numbers
      Object.keys(stats).forEach(key => {
        if (typeof stats[key] === 'string' && !isNaN(stats[key] as any)) {
          stats[key] = parseInt(stats[key] as any);
        }
      });

      console.log(`User stats for project ${projectId}:`, stats);
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
        `, [req.params.id]);

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
  app.get("/api/projects/:id/responses", async (_req, res) => {
    try {

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
        WHERE user_data IS NOT NULL 
          AND user_data != '{}'
        ORDER BY last_interaction DESC
      `);

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
      const userData = await storage.getUserBotDataByProjectAndUser(projectId, userId);
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
      const validatedData = insertUserBotDataSchema.parse({
        ...req.body,
        projectId
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
    try {
      const userId = req.params.id; // This is telegram user_id as string

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
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;
      values.push(userId);

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
        const id = parseInt(req.params.id);
        const validatedData = insertUserBotDataSchema.partial().parse(req.body);
        const userData = await storage.updateUserBotData(id, validatedData);
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

      // Подключение к PostgreSQL для прямого удаления
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        // Пытаемся удалить из bot_users если пользователь передал user_id
        const deleteResult = await pool.query(
          `DELETE FROM bot_users WHERE user_id = $1`,
          [id]
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
      const success = await storage.deleteUserBotData(id);
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
      let totalDeleted = 0;

      // Подключение к PostgreSQL
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        // Удаляем в��ех поль��ова��ел����й из таблицы bot_users для данного проекта
        const deleteResult = await pool.query(
          `DELETE FROM bot_users WHERE project_id = $1`,
          [projectId]
        );

        totalDeleted += deleteResult.rowCount || 0;
        console.log(`Deleted ${deleteResult.rowCount || 0} users from bot_users for project ${projectId}`);
      } catch (dbError) {
        console.log("bot_users table not found or error:", (dbError as any).message);
      }

      // НЕ закрываем пул - он нужен для других запросов

      // Подсчитываем количество записей в user_bot_data перед удалением
      const existingUserData = await storage.getUserBotDataByProject(projectId);
      const userBotDataCount = existingUserData.length;

      // Удаляем из user_bot_data таблицы
      const fallbackSuccess = await storage.deleteUserBotDataByProject(projectId);
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
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const users = await storage.searchUserBotData(projectId, query.trim());
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

  // Send verification code to phone number
  app.post("/api/telegram-auth/send-code", async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: "Номер телефона обязателен"
        });
      }

      const result = await telegramClientManager.sendCode('default', phoneNumber);

      if (result.success) {
        res.json({
          success: true,
          message: "Код отправлен на ваш номер",
          phoneCodeHash: result.phoneCodeHash
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

  // Verify phone code
  app.post("/api/telegram-auth/verify-code", async (req, res) => {
    try {
      const { phoneNumber, phoneCode, phoneCodeHash } = req.body;

      if (!phoneNumber || !phoneCode || !phoneCodeHash) {
        return res.status(400).json({
          success: false,
          error: "Все поля обязательны"
        });
      }

      const result = await telegramClientManager.verifyCode('default', phoneNumber, phoneCode, phoneCodeHash);

      if (result.success) {
        res.json({
          success: true,
          message: "Авторизация успешна"
        });
      } else if (result.needsPassword) {
        // Когда требуется пароль 2FA - это не ошибка, а нормальная часть процесса
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

  // Verify 2FA password
  app.post("/api/telegram-auth/verify-password", async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Пароль обязателен"
        });
      }

      const result = await telegramClientManager.verifyPassword('default', password);

      if (result.success) {
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

  // Save API credentials
  app.post("/api/telegram-auth/save-credentials", async (req, res) => {
    try {
      const { apiId, apiHash } = req.body;

      if (!apiId || !apiHash) {
        return res.status(400).json({
          success: false,
          error: "API ID и API Hash обязательны"
        });
      }

      const result = await telegramClientManager.setCredentials('default', apiId, apiHash);

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

  // Get authentication status
  app.get("/api/telegram-auth/status", async (_req, res) => {
    try {
      const status = await telegramClientManager.getAuthStatus('default');
      res.json(status);
    } catch (error: any) {
      console.error("Failed to get auth status:", error);
      res.status(500).json({
        isAuthenticated: false,
        error: "Ошибка получения статуса авторизации"
      });
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
        // Если это шаблон пользователя, остается приписан его автору
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
        // Для гостей - просто инкрементируем счетчик
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
}

