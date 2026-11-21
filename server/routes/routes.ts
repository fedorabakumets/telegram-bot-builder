/**
 * @fileoverview Основной роутер HTTP API для проектов, токенов, интеграций и базы пользователей
 */
import { hasDialogProfileConstraints, dialogProfileFacetSelection, dialogActivityConditions } from './dialogs/dialog-user-filters';
import { uniqueDialogUsersSql } from './dialogs/unique-dialog-users-sql';
import { enrichDialogBotMemberships } from './dialogs/enrich-dialog-bots';
import { foundBroadcastAudienceSql } from './users/found-broadcast-audience';
import { registerDeleteWithoutPrivateRoutes } from './users/delete-without-private-routes';
import { userContactOriginSql, firstSavedMessageSql } from './users/user-contact-origin-sql';
import { getTelegramApiBaseUrl } from '../utils/telegram-api-url';
import { validateRuntimeModeBatch } from '../bots/runtimeModeBatch';
import { saveRuntimeMode, saveRuntimeModeSettings } from '../bots/runtimeModeSettings';
import { buildLaunchSettingsPatch } from '../bots/launchSettingsPatch';
import { buildBotAutoRestartPatch, parseBotAutoRestartBatch } from '../bots/botAutoRestartPatch';
import { saveBotAutoRestartSettings } from '../bots/saveBotAutoRestartSettings';
import { saveBotInheritedSetting } from '../bots/saveBotInheritedSetting';
import { inheritedBotSettingForEnv, parseBotInheritedSettingsBatch } from '../bots/botInheritedSettingsPatch';
import { encodeAdminIdsForStorage } from '../bots/adminIdsStorage';
import { resolveBotLaunchMode } from '../../shared/bot-launch-mode';

import { requireBotSettingBody, requireBotProfileBody } from "../middleware/require-bot-setting-body";
import { updateMediaMetadataSchema } from "../../shared/schema/media-metadata-contracts";
import { querySourcesAllTime } from './analytics/sources-all-time-query';
import { insertBotTokenSchema } from "@shared/schema";
import { ChildProcess } from "child_process";
import PostgresStore from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { UsersRateLimitStore } from "./userProjectsTokens/users-rate-limit-store";
import { type Server } from "http";
import multer from "multer";
import { join } from "path";

/**
 * Экспортируемый экземпляр session middleware для использования в WebSocket.
 * Инициализируется в registerRoutes() и позволяет прикрепить сессию к WS запросам.
 */
export let exportedSessionMiddleware: RequestHandler | null = null;
import { z } from "zod";
import { pool as dbPool } from "../database/db";
import { initializeDatabaseTables } from "../database/init-db";
import { enrichDialogAccess } from './dialogs/access-store';
import { enrichUserMetrics } from './users/enrich-user-metrics';
import { userActionCountSql, userSourceSql, userSourcePopularitySql, userVariableCountSql, userStatusSortSql } from './users/user-directory-sql';
import { userStatusPredicate } from './users/user-status-filter';
import { userStatusCountsSql } from './users/user-status-counts';
import { userSourceCountsSql, userPremiumCountsSql, userLanguageCountsSql } from './users/user-facet-counts';
import { advancedUserFiltersSchema } from '@shared/user-advanced-filters';
import { advancedUserWhere, userLanguageCondition } from './users/user-advanced-filter-sql';
import { userVariableCountsSql, userVariableValuesSql } from './users/user-variable-counts';
import { userDirectorySearchSql, userDirectorySearchPattern } from './users/user-directory-search';
import { uniqueProjectUsersSql } from './users/unique-project-users';
import { userContactEligibility, hasPrivateMessagesSql } from './users/user-contact-eligibility';
import { registerUsersTransferRoutes } from './users/register-users-transfer-routes';
import { registerBotAudienceCounts } from './users/bot-audience-counts';
import { registerChatAccessBatchRoutes } from './dialogs/chat-access-batch-routes';
/** Подключает сохранённые связи пользователя с ботами общей карточки. */
import { registerDialogProfileBotsRoutes } from './dialogs/dialog-profile-bots-routes';
import { registerProjectTelegramAccountsRoutes } from './projectTelegramAccounts/project-telegram-accounts-routes';
/** Подключает сохранённые группы пользователя общей карточки. */
import { registerDialogProfileGroupsRoutes } from './dialogs/dialog-profile-groups-routes';
/** Подключает сохранённые материалы общей карточки пользователя. */
import { registerDialogProfileContentRoutes } from './dialogs/dialog-profile-content-routes';
import { userBotUnavailableSql, userHasOtherBotsSql } from './users/user-bot-unavailable-sql';
import { downloadFileFromUrl } from "../files/downloadFileFromUrl";
import { getFileType } from "../files/getFileType";
import { seedDefaultTemplates } from "../utils/seed-templates";
import { storage } from "../storages/storage";
import { authMiddleware, getOwnerIdFromRequest } from "../telegram/auth-middleware";
import { setupGuard } from "../middleware/setup-guard";
import { getShareableServerEnvKeys } from "../bots/botEnvPolicy";
import { identifyAgent } from "../middleware/agentTokenMiddleware";
import { requireApiAuth } from "../middleware/requireApiAuth";
import { requireProjectAccess } from "../middleware/requireProjectAccess";
import { registerGroupsAnalyticsRoutes } from "./analytics/groups-analytics-handlers";
import { registerUnavailableUsersRoutes } from "./analytics/unavailable-users-handlers";
import { queryUsersByChatKind } from "./analytics/users-by-chat-kind-query";
import { requireTokenOwnership } from "../middleware/requireResourceOwnership";
import { requireMediaOwnership } from "../middleware/mediaOwnership";
import { setupTemplatesRoutes } from "./templates/setupTemplatesRoutes";
import { clearBotUsersHandler } from "./botUsers/handlers/clearBotUsersHandler";
import { deleteBotUserHandler } from "./botUsers/handlers/deleteBotUserHandler";
import { updateBotUserHandler } from "./botUsers/handlers/updateBotUserHandler";
import { botTokenWriteReceipt } from "./botTokens/token-write-receipt";
import { guardLegacyUserbotMutation } from './botTokens/guard-legacy-userbot-mutation';
import { updateProjectTokenHandler } from "./botTokens/handlers/updateProjectTokenHandler";
import { deleteProjectTokenHandler } from "./botTokens/handlers/deleteProjectTokenHandler";
import { isMaskedOrPlaceholderToken, toPublicBotToken } from "./botTokens/to-public-bot-token";
import { checkUrlAccessibility } from "../utils/checkUrlAccessibility";
import { validateExternalUrl } from "../utils/validateExternalUrl";
import { applySessionCookiePolicy, SESSION_COOKIE_MAX_AGE_MS } from "../utils/resolveSessionCookie";
import { resolveSessionSecret } from "../utils/resolveSessionSecret";
import { fetchWithProxy } from "../utils/telegram-proxy";
import { describeTelegramError } from "../admin/telegram-connection-test";
import { setupAuthRoutes } from "./setupAuthRoutes";
import {
  resolveDialogKind,
  wantsUsers,
  wantsGroups,
  groupChatTypesSql,
  buildGroupsSelectSql,
} from "./botUsers/dialogListKind";
import { setupBotIntegrationRoutes } from "./setupBotIntegrationRoutes";
import { setupWebhookRoutes } from './setupWebhookRoutes';
import { setupHooksRoutes } from './hooks/setupHooksRoutes';
import { getRedisPublisher, waitForRedisInit } from "../redis/redisClient";
import { setupProjectRoutes } from "./setupProjectRoutes";
import { setupUserProjectAndTokenRoutes } from "./setupUserProjectAndTokenRoutes";
import { setupAgentTokenRoutes } from "./setupAgentTokenRoutes";
import { setupUserSupportRoutes } from "../support/setup-support-routes";
import { setupMcpRoutes } from "./mcp/setupMcpRoutes";
import { setupStorageConfigRoutes } from "./setupStorageConfigRoutes";
import { setupS3ProxyRoute } from "./media/s3-proxy-route";
import { setupRuntimeMediaRoute } from "./media/runtime-media-route";
import { setupRuntimeMediaUploadRoute } from "./media/runtime-media-upload-route";
import { setupInvoiceMediaRoute } from "./media/invoice-media-route";
import { deleteMediaObject } from "./media/delete-media-object";
import type { StorageBotTokenInput } from "../storages/storageTypes";
import { ensureStorageRegistryLoaded } from "../storage/storage-registry";
import { readStorageLimitBytes } from "../storage/storage-config";
import {
  computeLocalUsedBytes,
  isQuotaExceeded,
  persistUploadToBackend,
  resolveUploadBackend,
  StorageBackendWriteError,
} from "./media/upload-storage-helper";
import { enrichMediaFilesWithTokens } from "./media/enrich-media-files-with-tokens";
import { createRegisteredUpload } from "./media/create-registered-upload";
import { listSelectedMedia } from "./media/selected-media-list";
import { SelectedStorageUnavailableError } from "../storage/selected-media-storage";
import { broadcastProjectEvent, emitTokenUpdated } from "../terminal";
import { getRequestTokenId } from "./utils/resolve-request-token";
import { cleanupProjectUpload, createProjectUploadName, ensureProjectUploadDirectory, parseProjectUploadId } from './media/project-upload-path';
import { getTelegramProxyAgent } from "../utils/telegram-proxy";
import { sessionActivityMiddleware } from "../auth/session-registry";
import { attachAdminAudit } from "../admin/admin-audit";
import { setupSwagger } from "../swagger/setup-swagger";
import { cookieCsrf } from '../middleware/cookie-csrf';
import { registerProjectTelegramRunnerRoute } from './project-telegram-runner-route';
import {
  CHART_WINDOW_INTERVAL,
  getChartSeriesGranularity,
} from "./messages/chart-granularity-config";
import {
  isDailyActivityGranularity,
  queryActivityFromDaily,
} from "./messages/queryActivityFromDaily";
import { queryActivityFromDailyPeriod } from "./messages/queryActivityFromDailyPeriod";
import { handleUserActivity } from "./users/handle-user-activity";
import { setupAnalyticsRangeRoutes } from './analytics/setup-range-routes';
import { setupAcquisitionRoutes } from './analytics/acquisition/routes';
import { updateMessagesRetentionHandler } from "./userProjectsTokens/handlers/tokens/updateMessagesRetentionHandler";
import { getFirstProjectTokenHandler } from "./projectRoutes/handlers/getFirstProjectTokenHandler";

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
    /** Разрешаем запись только в проверенный каталог числового проекта. */
    void Promise.resolve()
      .then(() => ensureProjectUploadDirectory(parseProjectUploadId(req.params.projectId), new Date().toISOString().slice(0, 10)))
      .then((directory) => cb(null, directory), (error: Error) => cb(error, ''));
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
    
    /** Имя для диска не содержит каталогов и не совпадает с именем клиента. */
    cb(null, createProjectUploadName(originalname, 'jpg'));
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
function fixUtf8Encoding(req: any, _res: any, next: any) {
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
 * Асинхронная инициализация компонентов системы
 *
 * @function initializeComponents
 * @description
 * Функция выполняет асинхронную инициализацию критических компонентов системы:
 * - Инициализирует базу данных
 * - Создает проект по умолчанию
 * - Очищает состояния ботов
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
  // Ждём завершения инициализации Redis перед проверкой — иначе race condition
  await waitForRedisInit();
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

  const loadSession = session({
    store: store,
    secret: resolveSessionSecret(),
    resave: false,
    saveUninitialized: false,
    /** Сессия создаётся с безопасными флагами до проверки локального исключения. */
    cookie: { secure: true, httpOnly: true, sameSite: "none", maxAge: SESSION_COOKIE_MAX_AGE_MS },
  });

  /** При загрузке старой сессии флаги обновляются для текущего соединения. */
  const sessionMiddleware: RequestHandler = (req, res, next) => {
    loadSession(req, res, (error?: unknown) => {
      if (!error) applySessionCookiePolicy(req);
      next(error);
    });
  };

  app.use(sessionMiddleware);
  registerProjectTelegramRunnerRoute(app);
  /** Проверяет источник изменений через cookie до API и административных обработчиков. */
  app.use(['/api', '/admin/api'], cookieCsrf);
  // Экспортируем для использования в WebSocket (прикрепление сессии к WS запросам)
  exportedSessionMiddleware = sessionMiddleware;

  // Auth middleware для всех API роутов (устанавливает req.user если пользователь авторизован)
  // ВАЖНО: должен быть подключен ПОСЛЕ session middleware
  setupRuntimeMediaRoute(app);
  setupRuntimeMediaUploadRoute(app);
  setupInvoiceMediaRoute(app);
  app.use("/api", setupGuard);
  app.use("/api", authMiddleware);
  app.use("/uploads", authMiddleware);
  app.use("/api", sessionActivityMiddleware);

  /** Ограничивает проверки личности без воздействия на поток событий ботов и проверку готовности. */
  const apiIdentityLimit = rateLimit({
    windowMs: 60_000, limit: 1800, store: new UsersRateLimitStore("editor-api-identity"),
    standardHeaders: "draft-7", legacyHeaders: false,
    skip: (req) => req.path === "/health" || req.path.startsWith("/webhook/") || req.path.startsWith("/hooks/"),
    message: { message: "Слишком много запросов к API. Повторите позже." },
  });
  /** Использует подтверждённого пользователя, а в режиме администрирования — адрес соединения. */
  const editorActorKey = (req: Parameters<RequestHandler>[0]) => {
    const ownerId = getOwnerIdFromRequest(req);
    return ownerId == null ? ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown") : `owner:${ownerId}`;
  };
  /** Общая квота охватывает все этапы входа в Telegram через юзербота. */
  const userbotSignInLimit = rateLimit({
    windowMs: 60_000, limit: 20, keyGenerator: editorActorKey, store: new UsersRateLimitStore("editor-userbot-sign-in"),
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { message: "Слишком много попыток входа в Telegram. Повторите позже." },
  });
  /** Один запрос может содержать пакет файлов; квота действует перед обработкой файлов. */
  const editorMediaWriteLimit = rateLimit({
    windowMs: 60_000, limit: 120, keyGenerator: editorActorKey, store: new UsersRateLimitStore("editor-media-write"),
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { message: "Слишком много загрузок медиа. Повторите позже." },
  });
  /** Запросы списков и отчётов делят бюджет, сохраняя запас на постраничное чтение. */
  const projectDataReadLimit = rateLimit({
    windowMs: 60_000, limit: 240, keyGenerator: editorActorKey, store: new UsersRateLimitStore("editor-project-data-read"),
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { message: "Слишком много запросов данных проекта. Повторите позже." },
  });
  /** Изменение пользователя не расходует бюджет чтения. */
  const projectUserWriteLimit = rateLimit({
    windowMs: 60_000, limit: 120, keyGenerator: editorActorKey, store: new UsersRateLimitStore("editor-project-user-write"),
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { message: "Слишком много изменений пользователей. Повторите позже." },
  });

  // Резолвер личности по персональному токену агента (PAT) — Authorization: Bearer.
  // После определения личности API закрыт для всех, кроме публичного списка путей.
  app.use("/api", apiIdentityLimit, identifyAgent, requireApiAuth);
  app.use("/api", attachAdminAudit);
  /** Подключает точные временные диапазоны после общей авторизации. */
  setupAnalyticsRangeRoutes(app, dbPool, requireProjectAccess);
  /** Источники и расходы используют те же права проекта, что и аналитика. */
  setupAcquisitionRoutes(app, dbPool, requireProjectAccess);

  // Отключаем HTTP-кеширование для API — ответы зависят от сессии.
  // Успешные аватарки/telegram-file перезаписывают заголовки в setPrivateMediaCacheHeaders
  // (снимают Pragma/Expires). Ошибки 4xx/5xx остаются no-store — иначе браузер кэширует 404.
  app.use("/api", (_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // Запускаем инициализацию в фоне без блокировки сервера
  initializeComponents();

  // API для проверки готовности компонентов (healthcheck для UI, Railway, балансировщиков)
  app.get("/api/health", (_req, res) => {
    res.json({
      database: isDbReady,
      templates: areTemplatesReady,
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

  // Get all bot projects (lightweight - without data field)
  setupProjectRoutes(app, requireDbReady);

  // Get all bot instances (без секрета token)
  app.get("/api/bots", async (req, res) => {
    try {
      const instances = await storage.getAllBotInstances();
      // Скоупинг под владельца: отдаём только инстансы проектов запросившего
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId === null) {
        return res.json([]);
      }
      const ownProjects = await storage.getUserBotProjects(ownerId, { ignoreArchive: true });
      const ownProjectIds = new Set(ownProjects.map(p => p.id));
      const scoped = instances
        .filter((inst) => ownProjectIds.has(inst.projectId))
        .map(({ token: _token, ...safe }) => safe);
      res.json(scoped);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot instances" });
    }
    return;
  });

  // Template management endpoints (seed — только /admin/api/templates/*)
  setupTemplatesRoutes(app, requireDbReady);
  setupTokenEnvVariableRoutes(app);

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
        const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to view this project's tokens" });
        }
      }

      const tokens = await storage.getBotTokensByProject(projectId);

      const safeTokens = tokens.map((token) => {
        const publicToken = toPublicBotToken(token);
        const botId = token.token ? token.token.split(':')[0] : null;
        return { ...publicToken, botId };
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
      const telegramApiUrl = `${getTelegramApiBaseUrl()}/bot${token}/getMe`;
      const startTime = Date.now();
      console.log(`[📋 Routes] Запрос getMe для ${maskedToken}`);
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
        return res.status(502).json({
          message: "Не удалось подключиться к Telegram",
          details: describeTelegramError(fetchError),
          tokenMasked: maskedToken
        });
      }

      const duration = Date.now() - startTime;
      console.log(`[✅ Routes] Response received in ${duration}ms, status: ${response.status}`);

      const result = await response.json();
      console.log(`[📋 Routes] Распарсили JSON ответ:`);
      console.log(`  - ok: ${result?.ok}`);
      const resultPreview =
        result?.result != null
          ? JSON.stringify(result.result, null, 2).slice(0, 200)
          : String(result?.description ?? result?.error ?? '(нет result)');
      console.log(`  - result: ${resultPreview}...`);

      // HTTP-ошибка Telegram или ok:false / пустой result → 400, не 500
      if (!response.ok || !result?.ok || !result?.result) {
        console.warn(
          `[❌ Routes] Bot token validation failed for ${maskedToken}: ${result?.description || 'Unknown error'}`,
        );
        return res.status(400).json({
          message: "Invalid bot token or failed to get bot info",
          error: result?.description || "Unknown error",
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
        const descResponse = await fetchWithProxy(`${getTelegramApiBaseUrl()}/bot${token}/getMyDescription`, {
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
        const shortDescResponse = await fetchWithProxy(`${getTelegramApiBaseUrl()}/bot${token}/getMyShortDescription`, {
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
          const fileResponse = await fetchWithProxy(`${getTelegramApiBaseUrl()}/bot${token}/getFile`, {
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
            photoUrl = `${getTelegramApiBaseUrl()}/file/bot${token}/${fileResult.result.file_path}`;
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
    return;
  });

  // Update bot information via Telegram API
  app.put("/api/projects/:id/tokens/:tokenId/bot-info", requireTokenOwnership, requireBotProfileBody, async (req, res) => {
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
      const telegramApiUrl = `${getTelegramApiBaseUrl()}/bot${token.token}/${telegramApiMethod}`;

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
      /** Передаёт имя поля как значение, сохраняя фиксированный формат журнала. */
      console.error('Failed to update bot %s:', req.body.field, error);
      res.status(500).json({ message: `Failed to update bot ${req.body.field}` });
    }
    return;
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
        const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have permission to add tokens to this project" });
        }
      }

      // Игнорируем ownerId из body, используем только из сессии
      // Fallback: если сессия не читается — берём owner_id из проекта
      const { ownerId: _ignored, ...bodyData } = req.body;
      const sessionOwnerId = getOwnerIdFromRequest(req);
      let resolvedOwnerId: number | null = sessionOwnerId;
      if (resolvedOwnerId === null) {
        const proj = await storage.getBotProject(projectId);
        resolvedOwnerId = proj?.ownerId ?? null;
      }
      const tokenData = insertBotTokenSchema.parse({
        ...bodyData,
        projectId,
        ownerId: resolvedOwnerId
      }) as StorageBotTokenInput;

      // Если botUsername не передан — автоматически получаем данные бота из Telegram
      let enrichedTokenData: StorageBotTokenInput = { ...tokenData };
      if (!tokenData.botUsername && tokenData.token) {
        try {
          const tgRes = await fetchWithProxy(`${getTelegramApiBaseUrl()}/bot${tokenData.token}/getMe`, {
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

      // Проверяем дубли: если токен с таким значением уже есть в проекте — возвращаем существующий
      if (enrichedTokenData.token) {
        const existingTokens = await storage.getBotTokensByProject(projectId);
        const duplicate = existingTokens.find(t => t.token === enrichedTokenData.token);
        if (duplicate) {
          console.log(`[routes] Токен уже существует в проекте (id=${duplicate.id}), возвращаем существующий`);
          return res.status(200).json({ ...toPublicBotToken(duplicate), ...botTokenWriteReceipt(duplicate, projectId, enrichedTokenData.token ?? undefined) });
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

      res.status(201).json({ ...toPublicBotToken(token), ...botTokenWriteReceipt(token, projectId, enrichedTokenData.token ?? undefined) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.issues });
      }
      console.error('[routes] createBotToken error:', error);
      res.status(500).json({ message: "Failed to create token" });
    }
    return;
  });

  /** Обновление токена использует явный whitelist и повторную проверку принадлежности проекту. */
  app.put("/api/projects/:id/tokens/:tokenId", updateProjectTokenHandler);

  // Delete a token for a specific project (hasProjectAccess + сверка projectId)
  app.delete(
    "/api/projects/:projectId/tokens/:tokenId",
    requireTokenOwnership,
    deleteProjectTokenHandler,
  );

  /**
   * Переключение настроек автоперезапуска для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/auto-restart
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/auto-restart", requireTokenOwnership, requireBotSettingBody("auto-restart"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      const { autoRestart, maxRestartAttempts } = req.body as {
        autoRestart?: 0 | 1 | 'inherit';
        maxRestartAttempts?: number | 'inherit';
      };
      /** Проверка тела уже выполнена, пустое частичное изменение не принимается. */
      if (autoRestart === undefined && maxRestartAttempts === undefined) {
        return res.status(400).json({ message: "Укажите настройки автоперезапуска" });
      }

      const patch = buildBotAutoRestartPatch(autoRestart, maxRestartAttempts);
      const updated = await saveBotAutoRestartSettings(projectId, tokenId, patch);
      if (!updated) {
        return res.status(404).json({ message: "Токен не найден" });
      }

      void emitTokenUpdated({
        projectId,
        tokenId,
        changedFields: Object.keys(patch),
        source: 'api',
      }).catch((err) => console.error('[auto-restart] emitTokenUpdated:', err));

      res.json({ success: true, ...updated });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления настроек автоперезапуска" });
    }
    return;
  });

  /**
   * Обновление защиты контента для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/protect-content
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/protect-content", requireTokenOwnership, requireBotSettingBody("protect-content"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      /** Сохраняет индивидуальное значение или возвращает наследование проекта. */
      const updated = await saveBotInheritedSetting(projectId, tokenId, 'protectContent', req.body.protectContent);
      if (!updated) {
        return res.status(404).json({ message: "Токен не найден" });
      }

      void emitTokenUpdated({
        projectId,
        tokenId,
        changedFields: ['protectContent', 'inheritBotSettings'],
        source: 'api',
      }).catch((err) => console.error('[protect-content] emitTokenUpdated:', err));

      res.json({ success: true, protectContent: updated.botSettings.protectContent, inheritBotSettings: updated.inheritBotSettings });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления защиты контента" });
    }
    return;
  });

  /**
   * Срок хранения сообщений диалога для токена бота.
   * 0 — без автоочистки; N — удалять bot_messages старше N дней (аналитика не трогается).
   * @route PUT /api/projects/:projectId/tokens/:tokenId/messages-retention
   */
  app.put(
    "/api/projects/:projectId/tokens/:tokenId/messages-retention",
    requireTokenOwnership,
    updateMessagesRetentionHandler,
  );

  /**
   * Обновление настройки сохранения входящих медиафайлов для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/save-incoming-media
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/save-incoming-media", requireTokenOwnership, requireBotSettingBody("save-incoming-media"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      /** Сохраняет индивидуальное значение или возвращает наследование проекта. */
      const updated = await saveBotInheritedSetting(projectId, tokenId, 'saveIncomingMedia', req.body.saveIncomingMedia);
      if (!updated) {
        return res.status(404).json({ message: "Токен не найден" });
      }

      void emitTokenUpdated({
        projectId,
        tokenId,
        changedFields: ['saveIncomingMedia', 'inheritBotSettings'],
        source: 'api',
      }).catch((err) => console.error('[save-incoming-media] emitTokenUpdated:', err));

      res.json({ success: true, saveIncomingMedia: updated.botSettings.saveIncomingMedia, inheritBotSettings: updated.inheritBotSettings });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления настройки сохранения медиа" });
    }
    return;
  });

  /**
   * Обновление настройки catch-all обработчиков для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/catch-all-handlers
   *
   * Управляет генерацией универсальных catch-all обработчиков
   * (handle_unhandled_message, handle_unhandled_photo, fallback_callback_handler).
   * Значение в .env пишется как 0/1 (как USER_DATABASE), а не true/false.
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/catch-all-handlers", requireTokenOwnership, requireBotSettingBody("catch-all-handlers"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      /** Сохраняет индивидуальное значение или возвращает наследование проекта. */
      const updated = await saveBotInheritedSetting(projectId, tokenId, 'catchAllHandlers', req.body.catchAllHandlers);
      if (!updated) {
        return res.status(404).json({ message: "Токен не найден" });
      }

      void emitTokenUpdated({
        projectId,
        tokenId,
        changedFields: ['catchAllHandlers', 'inheritBotSettings'],
        source: 'api',
      }).catch((err) => console.error('[catch-all-handlers] emitTokenUpdated:', err));

      res.json({ success: true, catchAllHandlers: updated.botSettings.catchAllHandlers, inheritBotSettings: updated.inheritBotSettings });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления настройки catch-all обработчиков" });
    }
    return;
  });

  /** Обновляет автоматическое отслеживание блокировок через my_chat_member. */
  app.put("/api/projects/:projectId/tokens/:tokenId/track-user-blocks", requireTokenOwnership, requireBotSettingBody("track-user-blocks"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      /** Сохраняет индивидуальное значение или возвращает наследование проекта. */
      const updated = await saveBotInheritedSetting(projectId, tokenId, 'trackUserBlocks', req.body.trackUserBlocks);
      if (!updated) return res.status(404).json({ message: "Токен не найден" });
      void emitTokenUpdated({ projectId, tokenId, changedFields: ['trackUserBlocks', 'inheritBotSettings'], source: 'api' })
        .catch((err) => console.error('[track-user-blocks] emitTokenUpdated:', err));
      res.json({ success: true, trackUserBlocks: updated.botSettings.trackUserBlocks, inheritBotSettings: updated.inheritBotSettings });
    } catch {
      res.status(500).json({ message: "Ошибка обновления отслеживания блокировок" });
    }
    return;
  });

  /** Обновляет слежение за добавлением и исключением бота в группах. */
  app.put("/api/projects/:projectId/tokens/:tokenId/track-group-membership", requireTokenOwnership, requireBotSettingBody("track-group-membership"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      /** Сохраняет индивидуальное значение или возвращает наследование проекта. */
      const updated = await saveBotInheritedSetting(projectId, tokenId, 'trackGroupMembership', req.body.trackGroupMembership);
      if (!updated) return res.status(404).json({ message: "Токен не найден" });
      void emitTokenUpdated({ projectId, tokenId, changedFields: ['trackGroupMembership', 'inheritBotSettings'], source: 'api' })
        .catch((err) => console.error('[track-group-membership] emitTokenUpdated:', err));
      res.json({ success: true, trackGroupMembership: updated.botSettings.trackGroupMembership, inheritBotSettings: updated.inheritBotSettings });
    } catch {
      res.status(500).json({ message: "Ошибка обновления отслеживания групп" });
    }
    return;
  });

  /**
   * Обновление настройки живого обновления контента для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/content-cache
   *
   * Управляет генерацией машинерии live-reload контента
   * (load_content, reload_content, _content_reload_loop, _content_subscribe_redis).
   * Аксессор get_content и кэш _content_cache генерируются всегда.
   * Значение в .env пишется как 0/1 (как CATCH_ALL_HANDLERS), а не true/false.
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/content-cache", requireTokenOwnership, requireBotSettingBody("content-cache"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      /** Сохраняет индивидуальное значение или возвращает наследование проекта. */
      const updated = await saveBotInheritedSetting(projectId, tokenId, 'contentCache', req.body.contentCache);
      if (!updated) {
        return res.status(404).json({ message: "Токен не найден" });
      }

      void emitTokenUpdated({
        projectId,
        tokenId,
        changedFields: ['contentCache', 'inheritBotSettings'],
        source: 'api',
      }).catch((err) => console.error('[content-cache] emitTokenUpdated:', err));

      res.json({ success: true, contentCache: updated.botSettings.contentCache, inheritBotSettings: updated.inheritBotSettings });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления настройки живого обновления контента" });
    }
    return;
  });

  /**
   * Обновление настроек Telethon userbot для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/userbot
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/userbot", requireTokenOwnership, guardLegacyUserbotMutation(async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      const { buildUserbotUpdate } = await import('./botTokens/build-userbot-update');
      const parsed = buildUserbotUpdate(req.body);
      if ('error' in parsed) {
        return res.status(400).json({ message: parsed.error });
      }

      // Пустые и замаскированные API Hash / session string не перезаписывают сохранённые
      const updated = await storage.updateBotToken(tokenId, parsed.update);
      if (!updated) {
        return res.status(404).json({ message: "Токен не найден" });
      }
      const userbotEnabled = updated.userbotEnabled ?? 0;

      void emitTokenUpdated({
        projectId,
        tokenId,
        changedFields: ['userbotEnabled'],
        source: 'api',
      }).catch((err) => console.error('[userbot] emitTokenUpdated:', err));

      res.json({ success: true, userbotEnabled });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления настроек юзербота" });
    }
    return;
  }));

  /**
   * Авторизация Telethon userbot — шаг 1: отправка кода
   * POST /api/projects/:projectId/tokens/:tokenId/userbot/send-code
   */
  app.post("/api/projects/:projectId/tokens/:tokenId/userbot/send-code", userbotSignInLimit, requireTokenOwnership, guardLegacyUserbotMutation(async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { apiId, phone } = req.body as { apiId: string; apiHash: string; phone: string };
      const { pickNewSecret } = await import('./botTokens/build-userbot-update');
      // Форма показывает сохранённый API Hash маской — тогда берём его из БД
      const apiHash = pickNewSecret(req.body?.apiHash)
        ?? (await storage.getBotToken(tokenId))?.userbotApiHash
        ?? '';

      if (!apiId || !apiHash || !phone) {
        return res.status(400).json({ ok: false, message: "Заполните API ID, API Hash и номер телефона" });
      }

      const { sendAuthCommand } = await import('../bots/userbotAuthManager');
      const result = await sendAuthCommand(tokenId, 'send_code', {
        api_id: apiId,
        api_hash: apiHash,
        phone,
      });

      /** Успешная отправка кода переводит открытые формы на следующий шаг */
      if (result.ok) {
        const { emitUserbotAuthProgress } = await import('./botTokens/emit-userbot-auth-progress');
        await emitUserbotAuthProgress(parseInt(req.params.projectId), tokenId, { step: 'code', phone });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ ok: false, message: error.message || "Ошибка отправки кода" });
    }
    return;
  }));

  /**
   * Авторизация Telethon userbot — шаг 2: ввод кода
   * POST /api/projects/:projectId/tokens/:tokenId/userbot/sign-in
   */
  app.post("/api/projects/:projectId/tokens/:tokenId/userbot/sign-in", userbotSignInLimit, requireTokenOwnership, guardLegacyUserbotMutation(async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { phone, code } = req.body as { phone: string; code: string };

      if (!phone || !code) {
        return res.status(400).json({ ok: false, message: "Заполните номер телефона и код" });
      }

      const { sendAuthCommand } = await import('../bots/userbotAuthManager');
      const result = await sendAuthCommand(tokenId, 'sign_in', { phone, code });

      /** Требование второго фактора отображается во всех открытых формах */
      if (result.ok && result.needs_2fa) {
        const { emitUserbotAuthProgress } = await import('./botTokens/emit-userbot-auth-progress');
        await emitUserbotAuthProgress(parseInt(req.params.projectId), tokenId, { step: '2fa', phone });
      }

      /** Сохранение сессии уведомляет вкладки через безопасное событие настроек */
      const { saveUserbotAuthResult } = await import('./botTokens/save-userbot-auth-result');
      await saveUserbotAuthResult(parseInt(req.params.projectId), tokenId, result);

      const { toPublicAuthResult } = await import('./botTokens/build-userbot-update');
      res.json(toPublicAuthResult(result));
    } catch (error: any) {
      res.status(500).json({ ok: false, message: error.message || "Ошибка авторизации" });
    }
    return;
  }));

  /**
   * Авторизация Telethon userbot — шаг 3: ввод 2FA пароля
   * POST /api/projects/:projectId/tokens/:tokenId/userbot/sign-in-2fa
   */
  app.post("/api/projects/:projectId/tokens/:tokenId/userbot/sign-in-2fa", userbotSignInLimit, requireTokenOwnership, guardLegacyUserbotMutation(async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { password } = req.body as { password: string };

      if (!password) {
        return res.status(400).json({ ok: false, message: "Введите пароль" });
      }

      const { sendAuthCommand } = await import('../bots/userbotAuthManager');
      const result = await sendAuthCommand(tokenId, 'sign_in_2fa', { password });

      /** Вход с паролем второго фактора обновляет настройки во всех вкладках */
      const { saveUserbotAuthResult } = await import('./botTokens/save-userbot-auth-result');
      await saveUserbotAuthResult(parseInt(req.params.projectId), tokenId, result);

      const { toPublicAuthResult } = await import('./botTokens/build-userbot-update');
      res.json(toPublicAuthResult(result));
    } catch (error: any) {
      res.status(500).json({ ok: false, message: error.message || "Ошибка 2FA авторизации" });
    }
    return;
  }));

  /**
   * Обновление уровня логирования для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/log-level
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/log-level", requireTokenOwnership, requireBotSettingBody("log-level"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      /** Уровень журналирования допускает независимый источник. */
      const updated = await saveBotInheritedSetting(projectId, tokenId, 'logLevel', req.body.logLevel);
      if (!updated) return res.status(404).json({ message: "Токен не найден" });

      // Обновляем .env файл бота если существует

      void emitTokenUpdated({
        projectId,
        tokenId,
        changedFields: ['logLevel', 'inheritBotSettings'],
        source: 'api',
      }).catch((err) => console.error('[log-level] emitTokenUpdated:', err));

      res.json({ success: true, logLevel: updated.botSettings.logLevel, inheritBotSettings: updated.inheritBotSettings });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления уровня логирования" });
    }
    return;
  });

  /**
   * Обновление настроек режима запуска для токена бота
   * PUT /api/projects/:projectId/tokens/:tokenId/launch-settings
   */
  /** Раскрывает секрет только по явному запросу пользователя с проверкой владения ботом. */
  app.get("/api/projects/:projectId/tokens/:tokenId/webhook-secret/reveal", requireTokenOwnership, async (req, res) => {
    const { revealWebhookSecret } = await import('./botTokens/reveal-webhook-secret');
    await revealWebhookSecret(req, res);
  });
  /** Возвращает текущий токен только при явном запросе владельца. */
  app.get("/api/projects/:projectId/tokens/:tokenId/reveal", requireTokenOwnership, async (req, res) => {
    const { revealBotToken } = await import('./botTokens/reveal-webhook-secret');
    await revealBotToken(req, res);
  });
  app.put("/api/projects/:projectId/tokens/:tokenId/launch-settings", requireTokenOwnership, requireBotSettingBody("launch-settings"), async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const projectId = parseInt(req.params.projectId);
      const { launchMode, webhookBaseUrl, webhookSecretToken } = req.body as {
        launchMode?: 'inherit' | 'polling' | 'webhook';
        webhookBaseUrl?: string | null;
        webhookSecretToken?: string | null;
      };

      /** Сохраняем только явно заданные поля; применение выполняется при запуске. */
      if (launchMode === undefined && webhookBaseUrl === undefined && webhookSecretToken === undefined) {
        return res.status(400).json({ message: 'Укажите настройки запуска' });
      }
      const updated = await saveRuntimeModeSettings(tokenId,
        buildLaunchSettingsPatch({ launchMode, webhookBaseUrl, webhookSecretToken }), projectId);

      if (!updated) {
        return res.status(404).json({ message: "Токен не найден" });
      }

      void emitTokenUpdated({
        projectId,
        tokenId,
        changedFields: ['launchMode', 'inheritLaunchMode', 'webhookBaseUrl', 'inheritBotSettings'],
        source: 'api',
      }).catch((err) => console.error('[launch-settings] emitTokenUpdated:', err));

      /** Секрет webhook никогда не возвращается после записи. */
      res.json({ success: true, launchMode: updated.launchMode, inheritLaunchMode: updated.inheritLaunchMode,
        webhookBaseUrl: updated.botSettings.webhookBaseUrl, inheritBotSettings: updated.inheritBotSettings,
        persistence: { confirmed: true, method: 'storage_returning' } });
    } catch (error: any) {
      res.status(error?.status || 500).json({ message: error?.status === 400 ? error.message : "Ошибка обновления настроек запуска" });
    }
    return;
  });

  // Get default/first token for .env generation (raw secret + id)
  app.get(
    "/api/projects/:id/tokens/first",
    requireProjectAccess,
    getFirstProjectTokenHandler,
  );

  // === МЕДИАФАЙЛЫ ===

  // Загрузка медиафайла (одиночная) с улучшенной обработкой
  app.post("/api/media/upload/:projectId", editorMediaWriteLimit, requireProjectAccess, upload.single('file'), fixUtf8Encoding, async (req, res) => {
    /** Идентификатор также ограничивает очистку после ошибки. */
    const projectId = Number(req.params.projectId);
    try {
      const file = req.file;
      const { description, tags, isPublic, storageConfigId } = req.body;

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
        await cleanupProjectUpload(projectId, file.path);
        return res.status(404).json({
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }

      // Дополнительная валидация файла
      const validation = validateFileDetailed(file);
      if (!validation.valid) {
        // Удаляем файл при ошибке валидации
        await cleanupProjectUpload(projectId, file.path);
        return res.status(400).json({
          message: validation.error,
          code: "VALIDATION_ERROR"
        });
      }

      // Создаем относительный путь для file_path и URL (исторический локальный путь)
      // file.path имеет вид: C:\...\uploads\{projectId}\{date}\{filename}
      // Нам нужно: uploads/{projectId}/{date}/{filename} для file_path
      // и /uploads/{projectId}/{date}/{filename} для url
      const uploadsDir = join(process.cwd(), 'uploads');
      const relativePath = file.path.replace(uploadsDir, 'uploads').replace(/\\/g, '/');
      const fileUrl = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

      // Выбираем целевой бэкенд: запрошенный writable storageConfigId либо активный (Req 11.7)
      const registry = await ensureStorageRegistryLoaded();
      const targetBackend = resolveUploadBackend(registry, storageConfigId);

      // Записываем файл в целевой бэкенд (локальный дефолт остаётся на диске; S3 — через put)
      let persisted;
      try {
        persisted = await persistUploadToBackend(targetBackend, file, file.path, fileUrl);
      } catch (storageError) {
        // Сбой записи во внешнее хранилище (например, недоступность S3) → 502 + очистка (Req 12.6)
        if (storageError instanceof StorageBackendWriteError && storageError.backend === "s3") {
          await cleanupProjectUpload(projectId, file.path);
          return res.status(502).json({
            message: "Хранилище S3 недоступно, файл не сохранён",
            code: "STORAGE_UNREACHABLE",
          });
        }
        throw storageError;
      }

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

      // ID загрузившего коллаборатора (telegram_users.id) либо null для гостей (Req 9.2)
      const uploadedBy = getOwnerIdFromRequest(req);

      // Сохраняем информацию о файле в базе данных
      const mediaFile = await createRegisteredUpload(targetBackend, persisted, {
        projectId,
        fileName: file.originalname,
        fileType: fileType,
        filePath: persisted.filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        url: persisted.url,
        description: description || `${validation.category || 'Файл'} - ${file.originalname}`,
        tags: finalTags,
        isPublic: isPublic === 'true' || isPublic === true ? 1 : 0,
        uploadedBy: uploadedBy ?? undefined,
        storageBackend: persisted.storageBackend,
        storageConfigId: persisted.storageConfigId,
      });

      // Мягкая квота локального хранилища: считаем флаг, но не блокируем загрузку (Req 4.7)
      const usedBytes = await computeLocalUsedBytes(projectId);
      const quotaExceeded = isQuotaExceeded(usedBytes, readStorageLimitBytes());

      // Возвращаем подробную информацию о загруженном файле
      res.json({
        ...mediaFile,
        quotaExceeded,
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
      await cleanupProjectUpload(projectId, req.file?.path);

      if (error instanceof StorageBackendWriteError) return res.status(502).json({ message: "Хранилище недоступно, файл не сохранён", code: "STORAGE_UNREACHABLE" });
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      res.status(500).json({
        message: "Ошибка при загрузке файла",
        error: errorMessage,
        code: "UPLOAD_ERROR"
      });
    }
    return;
  });

  // Загрузка множественных медиафайлов с улучшенной обработкой
  app.post("/api/media/upload-multiple/:projectId", editorMediaWriteLimit, requireProjectAccess, upload.array('files', 20), async (req, res) => {
    /** Обработчик принимает только массив файлов от multer.array и очищает его в каталоге проекта. */
    const files = Array.isArray(req.files) ? req.files : [];
    const projectId = Number(req.params.projectId);
    try {

      const { isPublic, defaultDescription, storageConfigId } = req.body;

      if (files.length === 0) {
        return res.status(400).json({
          message: "Файлы не выбраны",
          code: "NO_FILES"
        });
      }

      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        // Удаляем все файлы если проект не найден
        await Promise.all(files.map(file => cleanupProjectUpload(projectId, file.path)));
        return res.status(404).json({
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }

      const targetBackend = resolveUploadBackend(await ensureStorageRegistryLoaded(), storageConfigId);
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
            await cleanupProjectUpload(projectId, file.path);
            errors.push({
              fileName: file.originalname,
              error: `Файл слишком большой. Максимальный размер: ${file.mimetype.startsWith('video/') ? '100' : '50'}МБ`
            });
            continue;
          }

          // Создаем URL для доступа к файлу
          const fileUrl = `/uploads/${projectId}/${file.path.replace(/\\/g, '/').split('/').slice(-2).join('/')}`;
          const persisted = await persistUploadToBackend(targetBackend, file, file.path, fileUrl);

          // Сохраняем информацию о файле в базе данных
          const mediaFile = await createRegisteredUpload(targetBackend, persisted, {
            projectId,
            fileName: file.originalname,
            fileType: getFileType(file.mimetype),
            filePath: persisted.filePath,
            fileSize: file.size,
            mimeType: file.mimetype,
            url: persisted.url,
            storageBackend: persisted.storageBackend,
            storageConfigId: persisted.storageConfigId,
            description: defaultDescription || '',
            tags: [],
            isPublic: isPublic === 'true' || isPublic === true ? 1 : 0
          });

          // Обновляем статистику по типам файлов
          const fileType = getFileType(file.mimetype);
          fileStats[fileType]++;

          uploadedFiles.push(mediaFile);
        } catch (fileError) {
          console.error('Ошибка при обработке файла %s:', file.originalname, fileError);

          // Удаляем файл в случае ошибки
          await cleanupProjectUpload(projectId, file.path);

          errors.push({
            fileName: file.originalname,
            error: fileError instanceof StorageBackendWriteError ? "Хранилище недоступно, файл не сохранён" : "Ошибка при сохранении файла"
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
      await Promise.all(files.map(file => cleanupProjectUpload(projectId, file.path)));

      res.status(error instanceof StorageBackendWriteError ? 502 : 500).json({ message: error instanceof StorageBackendWriteError ? "Хранилище недоступно, файлы не сохранены" : "Ошибка при загрузке файлов", code: error instanceof StorageBackendWriteError ? "STORAGE_UNREACHABLE" : "UPLOAD_ERROR" });
    }
    return;
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

      // Защита от SSRF: блокируем внутренние адреса
      const urlValidation = validateExternalUrl(url, req.headers.host);
      if (!urlValidation.valid) {
        return res.status(400).json({
          message: urlValidation.reason,
          code: "BLOCKED_URL"
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
    return;
  });

  // Загрузка файла по URL с расширенными возможностями
  app.post("/api/media/download-url/:projectId", editorMediaWriteLimit, requireProjectAccess, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { url, description, tags, isPublic, customFileName, storageConfigId } = req.body;

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

      const targetBackend = resolveUploadBackend(await ensureStorageRegistryLoaded(), storageConfigId);

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
      /** Имя пользователя используется как подпись, а путь формируется безопасной функцией. */
      const date = new Date().toISOString().slice(0, 10);
      const uploadDir = await ensureProjectUploadDirectory(project.id, date);
      const originalFileName = (typeof customFileName === 'string' && customFileName) || urlCheck.fileName || 'downloaded-file';
      const fileName = createProjectUploadName(originalFileName, 'bin');
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
        await cleanupProjectUpload(project.id, filePath);
        return res.status(400).json({
          message: validation.error,
          code: "VALIDATION_FAILED"
        });
      }

      // Создаем URL для доступа к файлу
      const fileUrl = `/uploads/${projectId}/${date}/${fileName}`;

      const persisted = await persistUploadToBackend(targetBackend, { path: filePath, mimetype: downloadResult.mimeType || 'application/octet-stream' } as Express.Multer.File, filePath, fileUrl);

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
      const mediaFile = await createRegisteredUpload(targetBackend, persisted, {
        projectId,
        fileName: originalFileName,
        fileType: getFileType(downloadResult.mimeType || 'application/octet-stream'),
        filePath: persisted.filePath,
        fileSize: downloadResult.size || 0,
        mimeType: downloadResult.mimeType || 'application/octet-stream',
        url: persisted.url,
        storageBackend: persisted.storageBackend,
        storageConfigId: persisted.storageConfigId,
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

      if (error instanceof StorageBackendWriteError) return res.status(502).json({ message: 'Хранилище недоступно, файл не сохранён', code: 'STORAGE_UNREACHABLE' });
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      res.status(500).json({
        message: "Ошибка при загрузке файла по URL",
        error: errorMessage,
        code: "DOWNLOAD_ERROR"
      });
    }
    return;
  });

  // Пакетная загрузка файлов по URL (множественная загрузка)
  app.post("/api/media/download-urls/:projectId", editorMediaWriteLimit, requireProjectAccess, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { urls, isPublic, defaultDescription, storageConfigId } = req.body;

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

      const targetBackend = resolveUploadBackend(await ensureStorageRegistryLoaded(), storageConfigId);
      const downloadedFiles = [];
      const errors = [];

      // Создаем путь для сохранения
      /** Папка одна на весь пакет и привязана к найденному проекту. */
      const date = new Date().toISOString().slice(0, 10);
      const uploadDir = await ensureProjectUploadDirectory(project.id, date);

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
          /** Имя на диске использует только допустимую основу и расширение. */
          const originalFileName = (typeof customFileName === 'string' && customFileName) || urlCheck.fileName || `file-${i + 1}`;
          const fileName = createProjectUploadName(originalFileName, 'bin');
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
            await cleanupProjectUpload(project.id, filePath);
            errors.push({
              url: url,
              error: `Валидация не пройдена: ${validation.error}`
            });
            continue;
          }

          // Создаем URL для доступа
          const fileUrl = `/uploads/${projectId}/${date}/${fileName}`;

          const persisted = await persistUploadToBackend(targetBackend, { path: filePath, mimetype: downloadResult.mimeType || 'application/octet-stream' } as Express.Multer.File, filePath, fileUrl);

          // Сохраняем в базе данных
          const mediaFile = await createRegisteredUpload(targetBackend, persisted, {
            projectId,
            fileName: originalFileName,
            fileType: getFileType(downloadResult.mimeType || 'application/octet-stream'),
            filePath: persisted.filePath,
            fileSize: downloadResult.size || 0,
            mimeType: downloadResult.mimeType || 'application/octet-stream',
            url: persisted.url,
            storageBackend: persisted.storageBackend,
            storageConfigId: persisted.storageConfigId,
            description: customDescription || defaultDescription || `Файл загружен по ссылке: ${originalFileName}`,
            tags: ['загружено_по_url', validation.category || 'файл'],
            isPublic: isPublic === 'true' || isPublic === true ? 1 : 0
          });

          downloadedFiles.push({
            ...mediaFile,
            sourceUrl: url
          });

        } catch (error) {
          console.error('Ошибка обработки импортируемой ссылки:', error);
          errors.push({
            url: url,
            error: error instanceof StorageBackendWriteError ? 'Хранилище недоступно, файл не сохранён' : 'Ошибка обработки ссылки'
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
      res.status(error instanceof StorageBackendWriteError ? 502 : 500).json({
        message: error instanceof StorageBackendWriteError ? 'Хранилище недоступно' : "Ошибка при пакетной загрузке файлов по URL",
        code: "BATCH_DOWNLOAD_ERROR"
      });
    }
    return;
  });

  /** Возвращает медиафайлы проекта вместе с идентификаторами токенов. */
  app.get("/api/media/project/:projectId", requireProjectAccess, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const fileType = req.query.type as string;

      const validType = fileType && ['photo', 'video', 'audio', 'document'].includes(fileType) ? fileType : undefined;
      const mediaFiles = await listSelectedMedia(projectId, validType);
      res.json(await enrichMediaFilesWithTokens(mediaFiles));
    } catch (error) {
      if (error instanceof SelectedStorageUnavailableError) {
        res.status(503).json({ message: error.message });
        return;
      }
      console.error("Ошибка при получении медиафайлов:", error);
      res.status(500).json({ message: "Ошибка при получении медиафайлов" });
    }
  });

  // Получение конкретного медиафайла
  app.get("/api/media/:id", requireMediaOwnership, async (req, res) => {
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
    return;
  });

  // Обно��ление медиафайла
  app.put("/api/media/:id", requireMediaOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updateMediaMetadataSchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ message: "Недопустимые метаданные файла" });
      const updates = validation.data;

      const mediaFile = await storage.updateMediaFile(id, updates);

      if (!mediaFile) {
        return res.status(404).json({ message: "Файл не найден" });
      }

      res.json(mediaFile);
    } catch (error) {
      console.error("Ошибка при обновлении файла:", error);
      res.status(500).json({ message: "Ошибка при обновлении файла" });
    }
    return;
  });

  // Удаление медиафайла
  app.delete("/api/media/:id", requireMediaOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Получаем информацию о файле перед удалением
      const mediaFile = await storage.getMediaFile(id);
      if (!mediaFile) {
        return res.status(404).json({ message: "Файл не найден" });
      }

      // Удал��ем файл с диска
      try {
        await deleteMediaObject(mediaFile);
      } catch (error) {
        console.warn("Не удалось удалить файл из хранилища:", error);
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
    return;
  });

  // Поиск медиафайлов
  app.get("/api/media/search/:projectId", requireProjectAccess, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const query = req.query.q as string;

      if (!query) {
        return res.status(400).json({ message: "Поисковый запрос не может быть пустым" });
      }

      const mediaFiles = await listSelectedMedia(projectId, undefined, query);
      res.json(mediaFiles);
    } catch (error) {
      if (error instanceof SelectedStorageUnavailableError) return res.status(503).json({ message: error.message });
      console.error("Оши������ка при п����иске ������������йлов:", error);
      res.status(500).json({ message: "Ошибка при поиске файлов" });
    }
    return;
  });

  // Увеличение счетчика использования файла
  app.post("/api/media/:id/use", requireMediaOwnership, async (req, res) => {
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
    return;
  });

  // User Bot Data Management endpoints

  // Get all user data for a project
  app.get("/api/projects/:id/users", projectDataReadLimit, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);
    /** Фильтрация реальных личных переписок применяется только к списку диалогов. */
    const isDialogList = req.query.dialogKind !== undefined || req.query.includeGroups === 'true';
    /** Во вкладке пользователей исключаем групповые профили без личной переписки, сохраняя выбор всех ботов. */
    const privateContactsOnly = req.query.privateContactsOnly === 'true';
    /** Профильные фильтры диалогов не меняют выбор бота и не включают каталог пользователей. */
    const dialogKind = resolveDialogKind(req.query as Record<string, unknown>);
    const dialogUserFilters = isDialogList && wantsUsers(dialogKind) && req.query.dialogUserFilters === 'true';
    const profileFiltersEnabled = privateContactsOnly || dialogUserFilters;
    /** В общей области один человек занимает одну строку, а группы остаются отдельными чатами ботов. */
    const uniqueDialogUsers = isDialogList && tokenId === null;
    /** Объединяет строки после каждого собственного набора условий списка или фасета. */
    const privateDialogSelection = (selection: string) => uniqueDialogUsers ? uniqueDialogUsersSql(selection) : selection;
    /** Без tokenId диалоги охватывают всех ботов проекта; явный выбор не подменяется ботом по умолчанию. */
    if (isDialogList && (tokenId !== null || req.query.tokenId !== undefined)) {
      const token = tokenId ? await storage.getBotToken(tokenId) : undefined;
      if (!token || token.projectId !== projectId) {
        return res.status(404).json({ message: 'Бот проекта не найден' });
      }
    }

    // Проверяем права доступа к проекту для авторизованных пользователей
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId !== null) {
      const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Нет прав доступа к проекту" });
      }
    }

    // Параметры пагинации: если limit не передан — обратная совместимость (массив)
    const limit = req.query.limit ? parseInt(req.query.limit as string) : null;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    // Параметры серверного поиска, фильтрации и сортировки (только для пагинированного режима)
    const search = req.query.search as string | undefined;
    const filterActive = req.query.filterActive as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortDir = req.query.sortDir as string | undefined;

    // Белый список колонок для ORDER BY (защита от SQL injection)
    const sortColumnMap: Record<string, string> = {
      lastInteraction: isDialogList ? 'lm.created_at' : 'u.last_interaction',
      createdAt: 'u.registered_at',
      interactionCount: 'u.interaction_count',
      firstName: 'u.first_name',
      userName: 'u.username',
      ...(privateContactsOnly ? { incomingMessageCount: userActionCountSql(false), buttonClickCount: userActionCountSql(true), acquisitionSource: userSourcePopularitySql,
        variableCount: userVariableCountSql, userStatus: userStatusSortSql } : {}),
    };
    const sortColumn = sortColumnMap[sortBy as string] ?? sortColumnMap.lastInteraction;
    const sortOrder = sortDir === 'asc' ? 'ASC' : 'DESC';

    const selectBase = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY u.last_interaction DESC) AS id,
        u.user_id::text AS "userId",
        ${privateContactsOnly || isDialogList ? 'u.token_id AS "tokenId",' : ''}
        ${privateContactsOnly ? `${userBotUnavailableSql()} AS "botUnavailable",` : ''}
        ${privateContactsOnly ? `${userHasOtherBotsSql()} AS "hasOtherAvailableBots",` : ''}
        ${privateContactsOnly ? `${userSourceSql} AS "acquisitionSource", ${userContactOriginSql('u',true)} AS "contactOrigin",
          ${firstSavedMessageSql('u',true)} AS "firstSavedMessageAt",` : ''}
        u.username AS "userName",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.avatar_url AS "avatarUrl",
        u.registered_at AS "registeredAt",
        u.registered_at AS "createdAt",
        ${isDialogList ? 'lm.created_at' : 'u.last_interaction'} AS "lastInteraction",
        COALESCE(u.interaction_count, 0)::integer AS "interactionCount",
        CASE WHEN u.is_active = 1 THEN TRUE ELSE FALSE END AS "isActive",
        CASE WHEN u.is_premium = 1 THEN TRUE ELSE FALSE END AS "isPremium",
        CASE WHEN COALESCE(u.is_blocked, 0) = 1 THEN TRUE ELSE FALSE END AS "isBlocked",
        CASE WHEN COALESCE(u.is_deleted, 0) = 1 THEN TRUE ELSE FALSE END AS "isDeleted",
        CASE WHEN u.is_bot = 1 THEN TRUE ELSE FALSE END AS "isBot",
        u.language_code AS "languageCode",
        u.deep_link_param AS "deepLinkParam",
        u.referrer_id AS "referrerId",
        u.user_data AS "userData",
        ${privateContactsOnly ? `u.imported_at AS "importedAt", ${hasPrivateMessagesSql()} AS "hasPrivateMessages",` : ''}
        lm.message_text AS "lastMessageText",
        lm.created_at AS "lastMessageAt",
        FALSE AS "isGroup",
        NULL AS "chatType"
      FROM ${privateContactsOnly && tokenId === null ? uniqueProjectUsersSql() : 'bot_users'} u
      LEFT JOIN LATERAL (
        SELECT id, message_text, created_at
        FROM bot_messages
        WHERE user_id = u.user_id::text
          AND project_id = u.project_id
          AND token_id = u.token_id
          AND COALESCE(chat_type, 'private') = 'private'
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 1
      ) lm ON true
      WHERE u.is_bot = 0
        AND u.project_id = $1
        AND ($2::integer IS NULL OR u.token_id = $2)
        ${isDialogList ? 'AND lm.id IS NOT NULL' : privateContactsOnly ? `AND ${userContactEligibility('u')}` : ''}
    `;

    // Фильтр вкладки «Диалоги»: all | users | groups | channels (includeGroups — legacy)
    const includeUsers = wantsUsers(dialogKind);
    const includeGroupsPart = wantsGroups(dialogKind) && !(dialogUserFilters && hasDialogProfileConstraints(req.query as Record<string, unknown>));
    const groupsSelectSql = buildGroupsSelectSql(groupChatTypesSql(dialogKind));
    const groupsUnionSql = includeGroupsPart ? ` UNION ALL ${groupsSelectSql}` : '';
    /** Фасеты считаются только по личным диалогам, без изменения колонок группового UNION. */
    const facetBase = dialogUserFilters ? dialogProfileFacetSelection(selectBase) : selectBase;

    try {
      if (limit !== null) {
        // Режим пагинации: строим динамические условия WHERE
        const params: any[] = [projectId, tokenId];
        let paramIdx = 3;
        const conditions: string[] = [];
        let selectedLanguage: string | undefined;

        if (search && includeUsers) {
          const searchParam = privateContactsOnly ? userDirectorySearchPattern(search) : `%${search}%`;
          /**
           * Ищем не только по данным пользователя, но и по тексту сообщений диалога.
           * EXISTS сохраняет корректную пагинацию без дублирования строк пользователя.
           */
          conditions.push(privateContactsOnly ? userDirectorySearchSql(paramIdx) : `
            (
              u.first_name ILIKE $${paramIdx}
              OR u.username ILIKE $${paramIdx}
              OR u.user_id::text ILIKE $${paramIdx}
              OR EXISTS (
                SELECT 1
                FROM bot_messages bm
                WHERE bm.project_id = u.project_id
                  AND bm.user_id = u.user_id::text
                  AND ($2::integer IS NULL OR bm.token_id = $2)
                  AND bm.token_id = u.token_id
                  AND COALESCE(bm.chat_type, 'private') = 'private'
                  AND COALESCE(bm.message_text, '') ILIKE $${paramIdx}
              )
            )
          `);
          params.push(searchParam);
          paramIdx++;
        }
        if (filterActive === 'true') conditions.push('u.is_active = 1');
        if (filterActive === 'false') conditions.push('u.is_active = 0');
        /** Дополнительные фильтры применяются до пагинации ко всем счётчикам. */
        if (profileFiltersEnabled && req.query.filters !== undefined) {
          let raw: unknown;
          try { raw = typeof req.query.filters === 'string' && req.query.filters.length <= 6000 ? JSON.parse(req.query.filters) : null; }
          catch { return res.status(400).json({ message: 'Некорректные дополнительные фильтры' }); }
          const parsed = advancedUserFiltersSchema.safeParse(raw);
          if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Некорректные фильтры' });
          selectedLanguage = parsed.data.language;
          const advancedConditions = advancedUserWhere({ ...parsed.data, language: undefined,
            ...(req.query.variableOptions === 'true' ? { variableName: undefined, variableMode: undefined, variableValue: undefined } : {}) }, params, dialogUserFilters ? search : undefined);
          conditions.push(...(dialogUserFilters ? dialogActivityConditions(advancedConditions) : advancedConditions));
          paramIdx = params.length + 1;
        }
        /** Выбранный статус исключается из области счётчиков пунктов фильтра. */
        let statusCondition = '';
        const premiumCondition = profileFiltersEnabled && req.query.premium === 'true' ? ' AND u.is_premium=1'
          : profileFiltersEnabled && req.query.premium === 'false' ? ' AND COALESCE(u.is_premium,0)=0' : '';
        /** Статусы соответствуют видимому состоянию, а не только флагу активности. */
        if (profileFiltersEnabled && req.query.status !== undefined && req.query.status !== 'all') {
          const predicate = typeof req.query.status === 'string' ? userStatusPredicate(req.query.status) : undefined;
          if (!predicate) return res.status(400).json({ message: 'Неизвестный статус пользователя' });
          statusCondition = ` AND (${predicate})`;
        }
        /** Источник фильтруется до подсчёта и пагинации, значение передаётся параметром. */
        const sourceParams = [...params];
        let sourceCondition = '';
        if (profileFiltersEnabled && typeof req.query.source === 'string' && req.query.source) {
          sourceCondition = ` AND ${userSourceSql} = $${paramIdx++}`;
          params.push(req.query.source);
        }

        /** Язык исключён только из собственного счётчика; нумерация остальных фасетов независима. */
        const languageParams = [...params];
        const languagePredicate = userLanguageCondition(selectedLanguage, params);
        const sourceLanguagePredicate = userLanguageCondition(selectedLanguage, sourceParams);
        paramIdx = params.length + 1;
        const languageCondition = languagePredicate ? ` AND ${languagePredicate}` : '';
        const baseWhere = conditions.length ? ' AND ' + conditions.join(' AND ') : '';
        const facetWhere = baseWhere + premiumCondition + sourceCondition + languageCondition;
        const whereExtra = facetWhere + statusCondition;
        /** Полный набор условий применяется до выбора последнего подходящего диалога человека. */
        const privateSelection = privateDialogSelection(`${selectBase}${whereExtra}`);

        /** Поиск по названию группы/канала (внешний WHERE после GROUP BY) */
        let groupsSearchOuter = '';
        if (search && includeGroupsPart && !includeUsers) {
          groupsSearchOuter = ` WHERE dialogs."firstName" ILIKE $${paramIdx}`;
          params.push(`%${search}%`);
          paramIdx++;
        }

        let dataSql: string;
        let countSql: string;

        /** При одинаковом времени пара бот/чат задаёт устойчивый порядок соседних страниц. */
        if (includeUsers && includeGroupsPart) {
          dataSql = `SELECT * FROM (${privateSelection}${groupsUnionSql}) AS dialogs ORDER BY "lastInteraction" DESC NULLS LAST, "userId", "tokenId" LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
          countSql = `SELECT COUNT(*)::integer AS total FROM (${privateSelection}${groupsUnionSql}) AS dialogs`;
        } else if (includeGroupsPart) {
          dataSql = `SELECT * FROM (${groupsSelectSql}) AS dialogs${groupsSearchOuter} ORDER BY "lastInteraction" DESC NULLS LAST, "userId", "tokenId" LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
          countSql = `SELECT COUNT(*)::integer AS total FROM (${groupsSelectSql}) AS dialogs${groupsSearchOuter}`;
        } else if (uniqueDialogUsers) {
          /** Имена сортируем по разрешённым полям внешней выборки без ссылок на внутренний u. */
          const outerSortColumns: Record<string, string> = { firstName: '"firstName"', userName: '"userName"', createdAt: '"createdAt"', interactionCount: '"interactionCount"' };
          const outerSort = outerSortColumns[sortBy ?? ''] ?? '"lastInteraction"';
          dataSql = `SELECT * FROM (${privateSelection}) AS dialogs ORDER BY ${outerSort} ${sortOrder} NULLS LAST, "userId" LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
          countSql = `SELECT COUNT(*)::integer AS total FROM (${privateSelection}) AS dialogs`;
        } else {
          dataSql = `${selectBase}${whereExtra} ORDER BY ${sortColumn} ${sortOrder} NULLS LAST${privateContactsOnly && sortBy === 'acquisitionSource' ? `, ${userSourceSql} ASC, u.last_interaction DESC NULLS LAST` : ''}, u.user_id, u.token_id LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
          countSql = `SELECT COUNT(*)::integer AS total FROM (${selectBase}${whereExtra}) AS dialogs`;
        }

        const dataParams = [...params, limit, offset];
        const countParams = [...params];
        /** Снимок поиска читает ID и имена одним запросом, без переменных, пагинации и фасетов. */
        if (req.query.audienceSnapshot === 'true') {
          if (!profileFiltersEnabled || includeGroupsPart || !tokenId)
            return res.status(400).json({ message: 'Выберите конкретного бота и личных пользователей.' });
          const snapshot = await dbPool.query(foundBroadcastAudienceSql(`${selectBase}${whereExtra}`), countParams);
          if (snapshot.rows.length > 10000)
            return res.status(400).json({ message: 'Найдено больше 10 000 пользователей. Уточните фильтры.' });
          return res.json({ users: snapshot.rows, total: snapshot.rows.length, hasMore: false });
        }
        /** Селектор переменных запрашивает только общий итог и заполненность, без тяжёлой загрузки строк. */
        if (profileFiltersEnabled && req.query.variableOptions === 'true') {
          const equals = typeof req.query.variableEquals === 'string' ? req.query.variableEquals : '';
          if (equals.length > 2000) return res.status(400).json({ message: 'Слишком длинное значение переменной' });
          const variableName = typeof req.query.variableName === 'string' ? req.query.variableName : '';
          const valueSearch = typeof req.query.variableValueSearch === 'string' ? req.query.variableValueSearch : '';
          if (variableName.length > 200 || valueSearch.length > 200) return res.status(400).json({ message: 'Слишком длинный поиск переменной' });
          const selection = privateSelection;
          const [totalResult, variableResult, valuesResult] = await Promise.all([
            dbPool.query(countSql, countParams),
            dbPool.query(userVariableCountsSql(selection, countParams.length + 1), [...countParams, equals]),
            variableName ? dbPool.query(userVariableValuesSql(selection, countParams.length + 1, countParams.length + 2),
              [...countParams, variableName, userDirectorySearchPattern(valueSearch)]) : Promise.resolve(null),
          ]);
          return res.json({ total: totalResult.rows[0]?.total ?? 0, variables: variableResult.rows,
            values: valuesResult?.rows.slice(0, 200) ?? [], hasMoreValues: (valuesResult?.rows.length ?? 0) > 200 });
        }

        const [dataResult, countResult, statusesResult, sourceCountsResult, premiumCountsResult, languageCountsResult] = await Promise.all([
          dbPool.query(dataSql, dataParams),
          dbPool.query(countSql, countParams),
          profileFiltersEnabled ? dbPool.query(userStatusCountsSql(privateDialogSelection(`${facetBase}${facetWhere}`), true), countParams) : Promise.resolve(null),
          profileFiltersEnabled ? dbPool.query(userSourceCountsSql(privateDialogSelection(`${facetBase}${baseWhere}${premiumCondition}${statusCondition}${sourceLanguagePredicate ? ` AND ${sourceLanguagePredicate}` : ''}`)), sourceParams) : Promise.resolve(null),
          profileFiltersEnabled ? dbPool.query(userPremiumCountsSql(privateDialogSelection(`${facetBase}${baseWhere}${sourceCondition}${statusCondition}${languageCondition}`)), countParams) : Promise.resolve(null),
          profileFiltersEnabled ? dbPool.query(userLanguageCountsSql(privateDialogSelection(`${facetBase}${baseWhere}${premiumCondition}${sourceCondition}${statusCondition}`)), languageParams) : Promise.resolve(null),
        ]);

        const total: number = countResult.rows[0]?.total ?? 0;
        /** Счётчики нужны только вкладке пользователей и вычисляются после пагинации. */
        const page = privateContactsOnly ? await enrichUserMetrics(projectId, tokenId, dataResult.rows) : dataResult.rows;
        const dialogPage = uniqueDialogUsers ? await enrichDialogBotMemberships(projectId, page) : page;
        const users = await enrichDialogAccess(projectId, tokenId, dialogPage);
        console.log(`Paginated: project ${projectId}, kind=${dialogKind}, offset=${offset}, limit=${limit}, total=${total}`);
        /** Список источников независим от выбранного фильтра и текущей страницы. */
        const sources = dialogUserFilters ? { rows: sourceCountsResult?.rows.map(row => ({ label: row.source })) ?? [] } : privateContactsOnly ? await dbPool.query(`SELECT DISTINCT ${userSourceSql} label
          FROM bot_users u WHERE u.project_id=$1 AND ($2::integer IS NULL OR u.token_id=$2)
          AND u.is_bot=0 AND ${userContactEligibility('u')} ORDER BY label`, [projectId, tokenId]) : null;
        return res.json({ users, total, hasMore: offset + users.length < total,
          ...(statusesResult ? { statusCounts: statusesResult.rows[0] } : {}),
          ...(sourceCountsResult ? { sourceCounts: Object.fromEntries(sourceCountsResult.rows.map(row => [row.source, row.count])) } : {}),
          ...(premiumCountsResult ? { premiumCounts: premiumCountsResult.rows[0] } : {}),
          ...(languageCountsResult ? { languageCounts: Object.fromEntries(languageCountsResult.rows.map(row => [row.language, row.count])) } : {}),
          ...(sources ? { sources: [...new Set(sources.rows.map(row => row.label))] } : {}) });
      }

      // Обратная совместимость: возвращаем массив без пагинации (без фильтров)
      const completePrivateSelection = privateDialogSelection(selectBase);
      const selectSql =
        includeUsers && includeGroupsPart
          ? `SELECT * FROM (${completePrivateSelection}${groupsUnionSql}) AS dialogs ORDER BY "lastInteraction" DESC NULLS LAST`
          : includeGroupsPart
            ? `SELECT * FROM (${groupsSelectSql}) AS dialogs ORDER BY "lastInteraction" DESC NULLS LAST`
            : uniqueDialogUsers ? `SELECT * FROM (${completePrivateSelection}) AS dialogs ORDER BY "lastInteraction" DESC NULLS LAST, "userId"`
              : `${selectBase} ORDER BY ${sortColumnMap.lastInteraction} DESC NULLS LAST`;
      const result = await dbPool.query(selectSql, [projectId, tokenId]);
      console.log(`Found ${result.rows.length} users for project ${projectId} (kind=${dialogKind})`);
      const dialogRows = uniqueDialogUsers ? await enrichDialogBotMemberships(projectId, result.rows) : result.rows;
      res.json(await enrichDialogAccess(projectId, tokenId, dialogRows));
    } catch (error) {
      console.error("Error fetching user data:", error);
      /** Ошибка выборки диалогов не должна возвращать групповых отправителей через запасной список. */
      if (isDialogList || privateContactsOnly) return res.status(500).json({ message: 'Не удалось получить пользователей с личной перепиской' });
      /** Запасная выборка сохраняет формат основного ответа; недоступные статусы остаются неизвестными. */
      try {
        const fallbackResult = await dbPool.query(
          `SELECT ROW_NUMBER() OVER (ORDER BY last_interaction DESC) AS id,
                  user_id::text AS "userId", username AS "userName", first_name AS "firstName",
                  last_name AS "lastName", registered_at AS "registeredAt",
                  registered_at AS "createdAt", last_interaction AS "lastInteraction",
                  COALESCE(interaction_count, 0)::integer AS "interactionCount",
                  user_data AS "userData", COALESCE(is_active = 1, FALSE) AS "isActive", avatar_url AS "avatarUrl",
                  COALESCE(is_bot = 1, FALSE) AS "isBot", project_id AS "projectId", token_id AS "tokenId",
                  COALESCE(is_premium = 1, FALSE) AS "isPremium", language_code AS "languageCode",
                  NULL AS "isBlocked", NULL AS "isDeleted", FALSE AS "isGroup",
                  NULL AS "deepLinkParam", NULL AS "referrerId", NULL AS "chatType",
                  NULL AS "lastMessageText", NULL AS "lastMessageAt"
           FROM bot_users WHERE project_id = $1 AND token_id = $2
           ORDER BY last_interaction DESC`,
          [parseInt(req.params.id), tokenId]
        );
        const projectId = parseInt(req.params.id);
        const users = await enrichDialogAccess(projectId, tokenId, fallbackResult.rows);
        console.log(`Found ${users.length} users for project ${projectId} from fallback`);
        res.json(limit !== null ? { users, total: users.length, hasMore: false } : users);
      } catch (fallbackError) {
        res.status(500).json({ message: "Failed to fetch user data" });
      }
    }
    return;
  });

  // Get user data stats for a project
  app.get("/api/projects/:id/users/stats", projectDataReadLimit, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);
    /** Вкладка пользователей считает уникальные личные контакты без групповых профилей. */
    const privateContactsOnly = req.query.privateContactsOnly === 'true';

    // Проверяем права доступа к проекту для авторизованных пользователей
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId !== null) {
      const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Нет прав доступа к проекту" });
      }
    }

    try {
      // Используем общий пул соединений для запроса к bot_users.
      // totalInteractions — COUNT(*) из bot_messages (входящие + исходящие).
      const result = await dbPool.query(`
        SELECT
          COUNT(*) as "totalUsers",
          COUNT(*) FILTER (WHERE is_active = 1) as "activeUsers",
          COUNT(*) FILTER (WHERE is_active = 0) as "blockedUsers",
          COUNT(*) FILTER (WHERE COALESCE(is_blocked, 0) = 1) as "blockedBotUsers",
          COUNT(*) FILTER (WHERE COALESCE(is_deleted, 0) = 1) as "deletedUsers",
          COUNT(*) FILTER (WHERE is_premium = 1) as "premiumUsers",
          COUNT(*) FILTER (WHERE user_data IS NOT NULL AND user_data != '{}') as "usersWithResponses",
          (SELECT COALESCE(COUNT(*), 0) FROM bot_messages bm
           WHERE bm.project_id = $1
             AND bm.message_type IN ('user', 'bot')
             ${privateContactsOnly ? "AND COALESCE(bm.chat_type,'private')='private'" : ''}
             AND ($2::integer IS NULL OR bm.token_id = $2)) as "totalInteractions",
          CASE WHEN COUNT(*) > 0
            THEN (SELECT COALESCE(COUNT(*), 0)::float FROM bot_messages bm
                  WHERE bm.project_id = $1
                    AND bm.message_type IN ('user', 'bot')
                    ${privateContactsOnly ? "AND COALESCE(bm.chat_type,'private')='private'" : ''}
                    AND ($2::integer IS NULL OR bm.token_id = $2)) / COUNT(*)
            ELSE 0
          END as "avgInteractionsPerUser",
          COUNT(DISTINCT language_code) FILTER (WHERE language_code IS NOT NULL) as "uniqueLanguages",
          COUNT(*) FILTER (WHERE deep_link_param IS NOT NULL AND deep_link_param != 'direct') as "deepLinkUsers",
          COUNT(*) FILTER (WHERE referrer_id IS NOT NULL) as "referralUsers"
        FROM ${privateContactsOnly && tokenId === null ? uniqueProjectUsersSql() : 'bot_users'} u
        WHERE project_id = $1
          AND ($2::integer IS NULL OR token_id = $2)
          ${privateContactsOnly ? `AND is_bot=0 AND ${userContactEligibility('u')}` : ''}
      `, [projectId, tokenId]);

      const stats = result.rows[0];
      /** Сохраняем дробную часть среднего при преобразовании числовых значений PostgreSQL. */
      Object.keys(stats).forEach(key => {
        if (typeof stats[key] === 'string' && !isNaN(stats[key] as any)) {
          stats[key] = Number(stats[key]);
        }
      });

      const chatKindCounts = await queryUsersByChatKind(dbPool, projectId, tokenId);
      Object.assign(stats, chatKindCounts);

      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
    return;
  });

  /**
   * Эндпоинт для получения данных трафика: источники и языки пользователей
   * @route GET /api/projects/:id/users/traffic
   * @param id - Идентификатор проекта
   * @returns Объект с массивами sources и languages
   */
  app.get("/api/projects/:id/users/traffic", projectDataReadLimit, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);

    // Проверяем права доступа к проекту для авторизованных пользователей
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId !== null) {
      const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Нет прав доступа к проекту" });
      }
    }

    try {
      // Запрос источников трафика по deep_link_param.
      // Пользователи без deep_link_param (прямой /start) учитываются как "direct".
      const sourcesResult = await dbPool.query(`
        SELECT
          COALESCE(deep_link_param, 'direct') as param,
          COUNT(*) as count,
          ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
        FROM bot_users
        WHERE project_id = $1
          AND ($2::integer IS NULL OR token_id = $2)
        GROUP BY COALESCE(deep_link_param, 'direct')
        ORDER BY count DESC
      `, [projectId, tokenId]);

      // Запрос распределения по языкам
      const languagesResult = await dbPool.query(`
        SELECT
          COALESCE(language_code, 'unknown') as code,
          COUNT(*) as count,
          ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
        FROM bot_users
        WHERE project_id = $1
          AND ($2::integer IS NULL OR token_id = $2)
          AND language_code IS NOT NULL
        GROUP BY language_code
        ORDER BY count DESC
        LIMIT 20
      `, [projectId, tokenId]);

      res.json({
        sources: sourcesResult.rows,
        languages: languagesResult.rows,
      });
    } catch (error) {
      console.error("Error fetching traffic data:", error);
      res.status(500).json({ message: "Ошибка при получении данных трафика" });
    }
    return;
  });

  /**
   * Эндпоинт активности пользователей (уникальные люди за слот)
   * @route GET /api/projects/:id/users/activity
   * @query granularity - 1m|5m|1h|1w|1d|7d|30d
   * @returns { points, activeInWindow, newInWindow }
   */
  app.get("/api/projects/:id/users/activity", async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);

    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId !== null) {
      const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Нет прав доступа к проекту" });
      }
    }

    await handleUserActivity(req, res, dbPool, projectId, tokenId);
    return;
  });

  /**
   * Эндпоинт для получения данных прироста пользователей с поддержкой гранулярности
   * @route GET /api/projects/:id/users/growth
   * @param id - Идентификатор проекта
   * @query granularity - Гранулярность: "1h"|"1d"|"7d"|"30d" (новый параметр)
   * @query period - Период: "7d"|"30d"|"90d" (старый параметр, обратная совместимость)
   * @returns Массив объектов [{date, count}] — дата в ISO формате
   */
  app.get("/api/projects/:id/users/growth", projectDataReadLimit, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);
    const granularity = req.query.granularity as string | undefined;
    const period = (req.query.period as string) || "30d";

    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId !== null) {
      const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Нет прав доступа к проекту" });
      }
    }

    try {
      // Режим гранулярности — новый параметр
      if (granularity) {
        const cfg = getChartSeriesGranularity(granularity);
        /** Пятиминутные слоты округляем одинаково для регистраций и временной шкалы. */
        const slotExpression = granularity === '5m'
          ? "DATE_TRUNC('hour', registered_at) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM registered_at) / 5)"
          : `DATE_TRUNC('${cfg.truncate}', registered_at)`;
        /** Начало и конец пятиминутной шкалы совпадают со шкалой источников. */
        const seriesFrom = granularity === '5m' ? 'hour' : cfg.truncate;
        const seriesTo = granularity === '5m'
          ? "DATE_TRUNC('hour', NOW()) + INTERVAL '55 minutes'"
          : `DATE_TRUNC('${cfg.truncate}', NOW())`;

        const queryText = `
          WITH series AS (
            SELECT generate_series(
              DATE_TRUNC('${seriesFrom}', NOW() - INTERVAL '${cfg.window}'),
              ${seriesTo},
              INTERVAL '${cfg.step}'
            ) AS slot
          ),
          users AS (
            SELECT
              ${slotExpression} AS slot,
              COUNT(*) AS cnt
            FROM bot_users
            WHERE project_id = $1
              AND ($2::integer IS NULL OR token_id = $2)
              AND registered_at >= NOW() - INTERVAL '${cfg.window}'
            GROUP BY 1
          )
          SELECT s.slot AS date, COALESCE(u.cnt, 0) AS count
          FROM series s
          LEFT JOIN users u ON u.slot = s.slot
          ORDER BY s.slot ASC
        `;

        const result = await dbPool.query(queryText, [projectId, tokenId]);
        return res.json(result.rows.map(row => ({
          date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
          count: Number(row.count),
        })));
      }

      // Режим period — старый параметр (обратная совместимость)
      const intervalMap: Record<string, string> = {
        "7d": "7 days",
        "30d": "30 days",
        "90d": "90 days",
      };
      const interval = intervalMap[period] ?? "30 days";

      let result = await dbPool.query(`
        SELECT
          DATE(registered_at) as date,
          COUNT(*) as count
        FROM bot_users
        WHERE project_id = $1
          AND ($2::integer IS NULL OR token_id = $2)
          AND registered_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE(registered_at)
        ORDER BY date ASC
      `, [projectId, tokenId]);

      // Если данных нет — берём весь доступный диапазон (до 90 дней)
      if (result.rows.length === 0) {
        result = await dbPool.query(`
          SELECT
            DATE(registered_at) as date,
            COUNT(*) as count
          FROM bot_users
          WHERE project_id = $1
            AND ($2::integer IS NULL OR token_id = $2)
            AND registered_at >= NOW() - INTERVAL '90 days'
          GROUP BY DATE(registered_at)
          ORDER BY date ASC
        `, [projectId, tokenId]);
      }

      res.json(result.rows.map(row => ({
        date: row.date instanceof Date
          ? row.date.toISOString().split('T')[0]
          : String(row.date),
        count: Number(row.count),
      })));
    } catch (error) {
      console.error("Error fetching growth data:", error);
      res.status(500).json({ message: "Ошибка при получении данных прироста" });
    }
    return;
  });

  /**
   * Эндпоинт для получения данных прироста пользователей с разбивкой по источникам трафика
   * @route GET /api/projects/:id/users/growth-by-source
   * @param id - Идентификатор проекта
   * @query granularity - Гранулярность: "1m"|"5m"|"1h"|"1w"|"1d"|"7d"|"30d" (обязательный)
   * @query tokenId - Фильтр по боту (опциональный)
   * @returns Массив объектов [{date, sources}] где sources — объект с количеством пользователей по источникам
   */
  app.get("/api/projects/:id/users/growth-by-source", projectDataReadLimit, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);
    const granularity = req.query.granularity as string | undefined;

    // Проверка прав доступа к проекту
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId !== null) {
      const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Нет прав доступа к проекту" });
      }
    }

    // Проверка обязательного параметра granularity
    if (!granularity) {
      return res.status(400).json({ message: "Параметр granularity обязателен" });
    }

    try {
      /** Полная история строится отдельно и не ограничивается окном в один год. */
      if (granularity === 'all') return res.json(await querySourcesAllTime(dbPool, projectId, tokenId));
      const cfg = getChartSeriesGranularity(granularity);

      // Специальная обработка для 5-минутной гранулярности
      let queryText: string;
      if (granularity === "5m") {
        queryText = `
          WITH series AS (
            SELECT generate_series(
              DATE_TRUNC('hour', NOW() - INTERVAL '${cfg.window}'),
              DATE_TRUNC('hour', NOW()) + INTERVAL '55 minutes',
              INTERVAL '${cfg.step}'
            ) AS slot
          ),
          users_by_source AS (
            SELECT
              DATE_TRUNC('hour', registered_at) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM registered_at) / 5) AS slot,
              COALESCE(deep_link_param, 'direct') AS source,
              COUNT(*) AS cnt
            FROM bot_users
            WHERE project_id = $1
              AND ($2::integer IS NULL OR token_id = $2)
              AND registered_at >= NOW() - INTERVAL '${cfg.window}'
            GROUP BY 1, 2
          )
          SELECT 
            s.slot AS date,
            COALESCE(jsonb_object_agg(u.source, u.cnt) FILTER (WHERE u.source IS NOT NULL), '{}'::jsonb) AS sources
          FROM series s
          LEFT JOIN users_by_source u ON u.slot = s.slot
          GROUP BY s.slot
          ORDER BY s.slot ASC
        `;
      } else {
        queryText = `
          WITH series AS (
            SELECT generate_series(
              DATE_TRUNC('${cfg.truncate}', NOW() - INTERVAL '${cfg.window}'),
              DATE_TRUNC('${cfg.truncate}', NOW()),
              INTERVAL '${cfg.step}'
            ) AS slot
          ),
          users_by_source AS (
            SELECT
              DATE_TRUNC('${cfg.truncate}', registered_at) AS slot,
              COALESCE(deep_link_param, 'direct') AS source,
              COUNT(*) AS cnt
            FROM bot_users
            WHERE project_id = $1
              AND ($2::integer IS NULL OR token_id = $2)
              AND registered_at >= NOW() - INTERVAL '${cfg.window}'
            GROUP BY 1, 2
          )
          SELECT 
            s.slot AS date,
            COALESCE(jsonb_object_agg(u.source, u.cnt) FILTER (WHERE u.source IS NOT NULL), '{}'::jsonb) AS sources
          FROM series s
          LEFT JOIN users_by_source u ON u.slot = s.slot
          GROUP BY s.slot
          ORDER BY s.slot ASC
        `;
      }

      const result = await dbPool.query(queryText, [projectId, tokenId]);
      
      // Преобразование результата в нужный формат
      return res.json(result.rows.map(row => ({
        date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
        sources: typeof row.sources === 'object' && row.sources !== null 
          ? row.sources 
          : {},
      })));
    } catch (error) {
      console.error("Error fetching growth by source data:", error);
      res.status(500).json({ message: "Ошибка при получении данных прироста по источникам" });
    }
    return;
  });

  /**
   * Эндпоинт получения топ-10 самых популярных inline-кнопок проекта.
   * Считает нажатия кнопок (message_data.button_clicked = true) за окно времени.
   * @route GET /api/projects/:id/users/popular-buttons
   * @param id - Идентификатор проекта
   * @query granularity - Гранулярность периода: "1m"|"5m"|"1h"|"1w"|"1d"|"7d"|"30d" (опциональный, по умолчанию "1d")
   * @returns Массив объектов [{label, count}] — топ-10 кнопок по числу нажатий
   */
  app.get("/api/projects/:id/users/popular-buttons", projectDataReadLimit, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);
    const granularity = req.query.granularity as string | undefined;

    // Проверка прав доступа к проекту
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId !== null) {
      const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Нет прав доступа к проекту" });
      }
    }

    try {
      const windowInterval =
        CHART_WINDOW_INTERVAL[granularity ?? "1d"] ?? "30 days";

      const queryText = `
        SELECT
          COALESCE(NULLIF(message_data->>'button_text',''), message_data->>'callback_data') AS label,
          COUNT(*) AS count
        FROM bot_messages
        WHERE project_id = $1
          AND ($2::integer IS NULL OR token_id = $2)
          AND message_type = 'user'
          AND message_data->>'button_clicked' = 'true'
          AND created_at >= NOW() - INTERVAL '${windowInterval}'
        GROUP BY label
        HAVING COALESCE(NULLIF(message_data->>'button_text',''), message_data->>'callback_data') IS NOT NULL
        ORDER BY count DESC
        LIMIT 10
      `;

      const result = await dbPool.query(queryText, [projectId, tokenId]);
      res.json(result.rows.map(r => ({ label: r.label, count: Number(r.count) })));
    } catch (error) {
      console.error("Error fetching popular buttons data:", error);
      res.status(500).json({ message: "Ошибка при получении популярных кнопок" });
    }
    return;
  });

  /**
   * Эндпоинт получения логов бота для проекта (системная таблица)
   * @route GET /api/projects/:id/logs/all
   * @returns Массив логов [{level, message, timestamp}]
   */
  app.get("/api/projects/:id/logs/all", projectDataReadLimit, requireProjectAccess, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 200;
    const tokenId = getRequestTokenId(req);

    try {
      const result = await dbPool.query(
        `SELECT bl.type AS level, SUBSTRING(bl.content, 1, 150) AS message, bl.timestamp AS "createdAt"
         FROM bot_logs bl
         WHERE bl.project_id = $1
           AND ($2::integer IS NULL OR bl.token_id = $2)
         ORDER BY bl.timestamp DESC
         LIMIT $3`,
        [projectId, tokenId, limit]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.json([]);
    }
  });

  /**
   * Эндпоинт получения истории запусков бота для проекта
   * @route GET /api/projects/:id/launches/all
   * @returns Массив запусков [{status, started_at, stopped_at, error_message}]
   */
  app.get("/api/projects/:id/launches/all", projectDataReadLimit, requireProjectAccess, async (req, res) => {
    const projectId = parseInt(req.params.id);

    try {
      const result = await dbPool.query(
        `SELECT blh.status, blh.started_at AS "startedAt", blh.stopped_at AS "stoppedAt",
                SUBSTRING(blh.error_message, 1, 100) AS "errorMessage"
         FROM bot_launch_history blh
         JOIN bot_tokens bt ON bt.id = blh.token_id
         WHERE bt.project_id = $1
         ORDER BY blh.started_at DESC
         LIMIT 100`,
        [projectId]
      );
      res.json(result.rows);
    } catch (error) {
      res.json([]);
    }
  });

  /**
   * Эндпоинт получения переменных пользователей (user_data развёрнутый в колонки)
   * @route GET /api/projects/:id/users/variables
   * @param id - Идентификатор проекта
   * @query limit - Лимит записей (по умолчанию 200)
   * @returns {columns: string[], rows: Array<{user_id, ...переменные}>}
   */
  app.get("/api/projects/:id/users/variables", projectDataReadLimit, requireProjectAccess, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 200;

    try {
      const result = await dbPool.query(
        `SELECT user_id, username, first_name, user_data
         FROM bot_users 
         WHERE project_id = $1 
           AND ($2::integer IS NULL OR token_id = $2)
           AND user_data IS NOT NULL 
           AND user_data != '{}'
         ORDER BY last_interaction DESC
         LIMIT $3`,
        [projectId, tokenId, limit]
      );

      // Базовые колонки, которые не дублируем из user_data
      const baseColumns = new Set(['user_id', 'username', 'user_name', 'first_name', 'last_name']);

      // Собираем все уникальные ключи из user_data (исключая базовые и служебные)
      const allKeys = new Set<string>();
      for (const row of result.rows) {
        if (row.user_data && typeof row.user_data === 'object') {
          Object.keys(row.user_data).forEach(k => {
            if (!k.startsWith('_') && !k.startsWith('waiting_') && !k.startsWith('input_') && !baseColumns.has(k)) {
              allKeys.add(k);
            }
          });
        }
      }

      const columns = ['user_id', 'username', ...Array.from(allKeys).sort()];
      const rows = result.rows.map((r: any) => {
        const row: Record<string, string> = {
          user_id: String(r.user_id),
          username: r.username || '',
        };
        for (const key of allKeys) {
          const val = r.user_data?.[key];
          row[key] = val != null ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '';
        }
        return row;
      });

      res.json({ columns, rows });
    } catch (error) {
      console.error("Error fetching user variables:", error);
      res.status(500).json({ message: "Ошибка при получении переменных" });
    }
  });

  /**
   * Эндпоинт получения всех сообщений проекта (для системной таблицы)
   * @route GET /api/projects/:id/messages/all
   * @param id - Идентификатор проекта
   * @query limit - Лимит записей (по умолчанию 200)
   * @query offset - Смещение (по умолчанию 0)
   * @returns Массив сообщений [{id, userId, messageType, messageText, chatType, createdAt}]
   */
  app.get("/api/projects/:id/messages/all", projectDataReadLimit, requireProjectAccess, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 200;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    try {
      const result = await dbPool.query(
        `SELECT id, user_id AS "userId", message_type AS "messageType", 
                COALESCE(SUBSTRING(message_text, 1, 100), '') AS "messageText",
                chat_type AS "chatType", chat_id AS "chatId",
                created_at AS "createdAt"
         FROM bot_messages 
         WHERE project_id = $1 AND ($2::integer IS NULL OR token_id = $2)
         ORDER BY created_at DESC 
         LIMIT $3 OFFSET $4`,
        [projectId, tokenId, limit, offset]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching all messages:", error);
      res.status(500).json({ message: "Ошибка при получении сообщений" });
    }
  });

  /**
   * Эндпоинт активности сообщений с поддержкой гранулярности и разбивки по направлению
   * @route GET /api/projects/:id/messages/activity
   * @param id - Идентификатор проекта
   * @query granularity - Гранулярность: "1m"|"5m"|"1h"|"1w"|"1d"|"7d"|"30d" (новый параметр)
   * @query period - Период: "7d"|"30d"|"90d" (старый параметр, для обратной совместимости)
   * @query split - "true" — вернуть [{date, incoming, outgoing}] вместо [{date, count}]
   * @returns Массив объектов [{date, count}] или [{date, incoming, outgoing}] при split=true
   */
  app.get("/api/projects/:id/messages/activity", projectDataReadLimit, requireProjectAccess, async (req, res) => {
    const projectId = parseInt(req.params.id);
    const tokenId = getRequestTokenId(req);
    const granularity = req.query.granularity as string | undefined;
    const period = (req.query.period as string) || "30d";
    const split = req.query.split === "true";

    try {
      // Режим гранулярности — новый параметр
      if (granularity) {
        // Длинные окна — immutable дневные агрегаты (не зависят от удаления bot_messages)
        if (isDailyActivityGranularity(granularity)) {
          const points = await queryActivityFromDaily(
            dbPool,
            projectId,
            tokenId,
            granularity,
            split,
          );
          return res.json(points);
        }

        /**
         * Маппинг гранулярности на SQL-параметры для активности сообщений.
         * 1m  — последний час с шагом 1 минута (60 точек)
         * 5m  — последние 3 часа с шагом 5 минут (36 точек)
         * 1h  — последние 24 часа с шагом 1 час (24 точки)
         * fillGaps=true означает заполнение пустых интервалов нулями через generate_series.
         */
        const granularityConfig: Record<string, { window: string; truncate: string | null; step: string; fillGaps: boolean }> = {
          "1m":  { window: "1 hour",   truncate: "minute", step: "1 minute",  fillGaps: true },
          "5m":  { window: "3 hours",  truncate: null,     step: "5 minutes", fillGaps: true },
          "1h":  { window: "24 hours", truncate: "hour",   step: "1 hour",    fillGaps: true },
        };
        const cfg = granularityConfig[granularity] ?? granularityConfig["1h"];

        let queryText: string;

        if (split) {
          /** Входящие — user, исходящие — остальные типы, как в дневных агрегатах. */
          if (granularity === "5m") {
            queryText = `
              WITH series AS (
                SELECT generate_series(
                  DATE_TRUNC('hour', NOW() - INTERVAL '${cfg.window}'),
                  DATE_TRUNC('hour', NOW()) + INTERVAL '55 minutes',
                  INTERVAL '${cfg.step}'
                ) AS slot
              ),
              msgs AS (
                SELECT
                  DATE_TRUNC('hour', created_at) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM created_at) / 5) AS slot,
                  COUNT(*) FILTER (WHERE message_type = 'user') AS incoming,
                  COUNT(*) FILTER (WHERE message_type <> 'user') AS outgoing
                FROM bot_messages
                WHERE project_id = $1
                  AND ($2::integer IS NULL OR token_id = $2)
                  AND created_at >= NOW() - INTERVAL '${cfg.window}'
                GROUP BY 1
              )
              SELECT s.slot AS date,
                     COALESCE(m.incoming, 0) AS incoming,
                     COALESCE(m.outgoing, 0) AS outgoing
              FROM series s
              LEFT JOIN msgs m ON m.slot = s.slot
              ORDER BY s.slot ASC
            `;
          } else {
            queryText = `
              WITH series AS (
                SELECT generate_series(
                  DATE_TRUNC('${cfg.truncate}', NOW() - INTERVAL '${cfg.window}'),
                  DATE_TRUNC('${cfg.truncate}', NOW()),
                  INTERVAL '${cfg.step}'
                ) AS slot
              ),
              msgs AS (
                SELECT
                  DATE_TRUNC('${cfg.truncate}', created_at) AS slot,
                  COUNT(*) FILTER (WHERE message_type = 'user') AS incoming,
                  COUNT(*) FILTER (WHERE message_type <> 'user') AS outgoing
                FROM bot_messages
                WHERE project_id = $1
                  AND ($2::integer IS NULL OR token_id = $2)
                  AND created_at >= NOW() - INTERVAL '${cfg.window}'
                GROUP BY 1
              )
              SELECT s.slot AS date,
                     COALESCE(m.incoming, 0) AS incoming,
                     COALESCE(m.outgoing, 0) AS outgoing
              FROM series s
              LEFT JOIN msgs m ON m.slot = s.slot
              ORDER BY s.slot ASC
            `;
          }
          const result = await dbPool.query(queryText, [projectId, tokenId]);
          return res.json(result.rows.map(row => ({
            date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
            incoming: Number(row.incoming),
            outgoing: Number(row.outgoing),
          })));
        }

        if (granularity === "5m") {
          // Группировка по 5-минутным интервалам через FLOOR + generate_series для заполнения пустых слотов
          queryText = `
            WITH series AS (
              SELECT generate_series(
                DATE_TRUNC('hour', NOW() - INTERVAL '${cfg.window}'),
                DATE_TRUNC('hour', NOW()) + INTERVAL '55 minutes',
                INTERVAL '${cfg.step}'
              ) AS slot
            ),
            msgs AS (
              SELECT
                DATE_TRUNC('hour', created_at) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM created_at) / 5) AS slot,
                COUNT(*) AS cnt
              FROM bot_messages
              WHERE project_id = $1
                AND ($2::integer IS NULL OR token_id = $2)
                AND created_at >= NOW() - INTERVAL '${cfg.window}'
              GROUP BY 1
            )
            SELECT s.slot AS date, COALESCE(m.cnt, 0) AS count
            FROM series s
            LEFT JOIN msgs m ON m.slot = s.slot
            ORDER BY s.slot ASC
          `;
        } else {
          // Для всех остальных гранулярностей — generate_series + LEFT JOIN для заполнения нулями
          queryText = `
            WITH series AS (
              SELECT generate_series(
                DATE_TRUNC('${cfg.truncate}', NOW() - INTERVAL '${cfg.window}'),
                DATE_TRUNC('${cfg.truncate}', NOW()),
                INTERVAL '${cfg.step}'
              ) AS slot
            ),
            msgs AS (
              SELECT
                DATE_TRUNC('${cfg.truncate}', created_at) AS slot,
                COUNT(*) AS cnt
              FROM bot_messages
              WHERE project_id = $1
                AND ($2::integer IS NULL OR token_id = $2)
                AND created_at >= NOW() - INTERVAL '${cfg.window}'
              GROUP BY 1
            )
            SELECT s.slot AS date, COALESCE(m.cnt, 0) AS count
            FROM series s
            LEFT JOIN msgs m ON m.slot = s.slot
            ORDER BY s.slot ASC
          `;
        }

        const result = await dbPool.query(queryText, [projectId, tokenId]);
        return res.json(result.rows.map(row => ({
          date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
          count: Number(row.count),
        })));
      }

      // Режим period — старый параметр (обратная совместимость) из дневных агрегатов
      const points = await queryActivityFromDailyPeriod(dbPool, projectId, tokenId, period);
      res.json(points);
    } catch (error) {
      console.error("Error fetching messages activity:", error);
      res.status(500).json({ message: "Ошибка при получении данных активности сообщений" });
    }
    return;
  });

  app.put(
    "/api/projects/:projectId/users/:userId",
    projectUserWriteLimit,
    requireProjectAccess,
    updateBotUserHandler,
  );
  /** Очистка без личных обращений имеет отдельную проверенную область и предварительный подсчёт. */
  registerDeleteWithoutPrivateRoutes(app);
  app.delete(
    "/api/projects/:projectId/users/:userId",
    requireProjectAccess,
    deleteBotUserHandler,
  );

  // Delete all user data for a project
  /** Удаление базы выполняется атомарно после проверки доступа к проекту. */
  app.delete("/api/projects/:id/users", requireProjectAccess, clearBotUsersHandler);

  // Bot Messages endpoints

  // Get message history for a user with media
  setupBotIntegrationRoutes(app);
  registerGroupsAnalyticsRoutes(app);
  registerUnavailableUsersRoutes(app);
  /** Импорт контактов доступен только после проверки прав проекта. */
  registerUsersTransferRoutes(app);
  registerBotAudienceCounts(app);
  registerChatAccessBatchRoutes(app);
  registerDialogProfileBotsRoutes(app);
  registerProjectTelegramAccountsRoutes(app);
  registerDialogProfileGroupsRoutes(app);
  registerDialogProfileContentRoutes(app);

  // HTML страница со встроенным Telegram Login Widget для авторизации в отдельном окне
  setupAuthRoutes(app);

  // User-specific endpoints
  // Get user's projects
  setupUserProjectAndTokenRoutes(app);

  // Персональные токены агента (PAT) для MCP
  setupAgentTokenRoutes(app);

  // Чат поддержки платформы (/api/support/*)
  setupUserSupportRoutes(app);

  // Remote Streamable HTTP MCP (/mcp) — без клона репо
  setupMcpRoutes(app);

  // CRUD реестра хранилищ (/api/storage-configs)
  setupStorageConfigRoutes(app);

  // Прокси приватных S3-объектов (/api/media/s3-proxy/<configId>/<ключ>)
  setupS3ProxyRoute(app);

  // Webhook роут: приём апдейтов от Telegram и проксирование в Python-процесс бота
  setupWebhookRoutes(app);

  // HTTP hooks: внешние интеграции → Python api_trigger
  setupHooksRoutes(app);

  // OpenAPI / Swagger UI — после всех маршрутов, до Vite catch-all
  setupSwagger(app);

  // Если сервер передан извне, используем его, иначе создаем новый
  if (httpServer) {
    return httpServer;
  } else {
    const { createServer } = await import('http');
    const newHttpServer = createServer(app);
    return newHttpServer;
  }
}










function setupTokenEnvVariableRoutes(app: Express) {
  // ─── Переменные окружения бота (веб-клиент, без telegram_id) ───

  /**
   * Получение списка переменных окружения токена
   * GET /api/projects/:projectId/tokens/:tokenId/env-variables
   */
  app.get("/api/projects/:projectId/tokens/:tokenId/env-variables", requireTokenOwnership, async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const items = await storage.getEnvVariables(tokenId);
      const masked = items.map(item => ({
        ...item,
        value: item.isSecret ? "••••••••" : item.value,
      }));
      res.json({ items: masked, count: masked.length });
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения переменных окружения" });
    }
  });

  /**
   * Создание переменной окружения
   * POST /api/projects/:projectId/tokens/:tokenId/env-variables
   */
  app.post("/api/projects/:projectId/tokens/:tokenId/env-variables", requireTokenOwnership, async (req, res) => {
    try {
      const tokenId = parseInt(req.params.tokenId);
      const { key, value, isSecret } = req.body as { key: string; value?: string; isSecret?: number };

      if (!key || !/^[A-Z][A-Z0-9_]*$/.test(key)) {
        return res.status(400).json({ message: "Некорректное имя переменной (A-Z, 0-9, _)" });
      }

      const existing = await storage.getEnvVariables(tokenId);
      if (existing.some(v => v.key === key)) {
        return res.status(409).json({ message: `Переменная ${key} уже существует` });
      }

      /** Системный режим сохраняется под общей блокировкой настроек токена. */
      if (key === 'BOT_POLLING_MODE') {
        await saveRuntimeMode(tokenId, value);
        const variable = (await storage.getEnvVariables(tokenId)).find(row => row.key === key);
        void emitTokenUpdated({ projectId: parseInt(req.params.projectId), tokenId, source: 'api', changedFields: ['pollingMode', 'inheritSleepMode'] }).catch(console.error);
        return res.status(201).json({ ...variable, persistence: { confirmed: true, method: 'storage_returning' } });
      }

      const variable = await storage.createEnvVariable({
        tokenId,
        key,
        value: value ?? "",
        isSecret: isSecret ?? 0,
      });
      res.status(201).json({ ...variable, persistence: { confirmed: true, method: 'storage_returning' } });
    } catch (error: any) {
      res.status(error?.status || 500).json({ message: error?.status === 400 ? error.message : "Ошибка создания переменной окружения" });
    }
    return;
  });

  /**
   * Обновление переменной окружения
   * PUT /api/projects/:projectId/tokens/:tokenId/env-variables/:id
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/env-variables/:id", requireTokenOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Пропускаем если это batch-запрос (обрабатывается отдельным роутом)
      if (isNaN(id)) return res.status(400).json({ message: "Некорректный id" });
      const { key, value, isSecret } = req.body as { key?: string; value?: string; isSecret?: number };

      if (key && !/^[A-Z][A-Z0-9_]*$/.test(key)) {
        return res.status(400).json({ message: "Некорректное имя переменной" });
      }

      const variable = await storage.getEnvVariable(id);
      if (!variable) return res.status(404).json({ message: "Переменная не найдена" });
      // Переменная должна принадлежать токену из URL (защита от подмены чужого id)
      if (variable.tokenId !== parseInt(req.params.tokenId, 10)) {
        return res.status(404).json({ message: "Переменная не найдена" });
      }

      /** Проверяем переименование и значение режима до обновления строки. */
      if (key && key !== variable.key && (key === 'BOT_POLLING_MODE' || variable.key === 'BOT_POLLING_MODE')) {
        return res.status(400).json({ message: 'Настройку режима выполнения нельзя переименовать' });
      }

      /** Не допускаем гонку режима с параллельной сменой способа доставки. */
      if (variable.key === 'BOT_POLLING_MODE') {
        await saveRuntimeMode(variable.tokenId, value ?? variable.value);
        const updated = (await storage.getEnvVariables(variable.tokenId)).find(row => row.key === variable.key);
        void emitTokenUpdated({ projectId: parseInt(req.params.projectId), tokenId: variable.tokenId, source: 'api', changedFields: ['pollingMode', 'inheritSleepMode'] }).catch(console.error);
        return res.json({ ...updated, persistence: { confirmed: true, method: 'storage_returning' } });
      }

      if (key && key !== variable.key) {
        const existing = await storage.getEnvVariables(variable.tokenId);
        if (existing.some(v => v.key === key && v.id !== id)) {
          return res.status(409).json({ message: `Переменная ${key} уже существует` });
        }
      }

      const updateData: Record<string, any> = {};
      if (key !== undefined) updateData.key = key;
      if (value !== undefined) updateData.value = value;
      if (isSecret !== undefined) updateData.isSecret = isSecret;

      const updated = await storage.updateEnvVariable(id, updateData);
      if (!updated) return res.status(404).json({ message: "Не удалось обновить" });
      res.json({ ...updated, persistence: { confirmed: true, method: 'storage_returning' } });
    } catch (error: any) {
      res.status(error?.status || 500).json({ message: error?.status === 400 ? error.message : "Ошибка обновления переменной окружения" });
    }
    return;
  });

  /**
   * Удаление переменной окружения
   * DELETE /api/projects/:projectId/tokens/:tokenId/env-variables/:id
   */
  app.delete("/api/projects/:projectId/tokens/:tokenId/env-variables/:id", requireTokenOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Переменная должна принадлежать токену из URL (защита от подмены чужого id)
      const variable = await storage.getEnvVariable(id);
      if (!variable || variable.tokenId !== parseInt(req.params.tokenId, 10)) {
        return res.status(404).json({ message: "Переменная не найдена" });
      }
      /** Сброс удаляет все старые дубликаты системной настройки одной транзакцией. */
      if (variable.key === 'BOT_POLLING_MODE') {
        await saveRuntimeModeSettings(variable.tokenId, { resetMode: true });
        void emitTokenUpdated({ projectId: parseInt(req.params.projectId), tokenId: variable.tokenId, source: 'api', changedFields: ['pollingMode', 'inheritSleepMode'] }).catch(console.error);
        return res.json({ success: true, persistence: { confirmed: true, method: 'storage_delete' } });
      }
      const deleted = await storage.deleteEnvVariable(id);
      if (!deleted) return res.status(404).json({ message: "Переменная не найдена" });
      res.json({ success: true, persistence: { confirmed: true, method: 'storage_delete' } });
    } catch (error: any) {
      res.status(error?.status || 500).json({ message: error?.status === 400 ? error.message : "Ошибка удаления переменной окружения" });
    }
    return;
  });

  /**
   * Раскрытие секретного значения переменной
   * GET /api/projects/:projectId/tokens/:tokenId/env-variables/:id/reveal
   */
  app.get("/api/projects/:projectId/tokens/:tokenId/env-variables/:id/reveal", requireTokenOwnership, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const variable = await storage.getEnvVariable(id);
      if (!variable) return res.status(404).json({ message: "Переменная не найдена" });
      // Защита от раскрытия секрета чужого токена: переменная должна принадлежать токену из URL
      if (variable.tokenId !== parseInt(req.params.tokenId, 10)) {
        return res.status(404).json({ message: "Переменная не найдена" });
      }
      res.json({ value: variable.value });
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения значения" });
    }
    return;
  });

  /**
   * Список ключей серверных переменных для подстановки в env бота (${{KEY}}).
   * GET /api/server/env-keys — только имена, которые реально раскрываются
   * (WORKER_ENV_PASSTHROUGH минус denylist, заданные на сервере), без значений.
   */
  app.get("/api/server/env-keys", (_req, res) => {
    res.json({ items: getShareableServerEnvKeys().map((key) => ({ key })) });
  });

  /**
   * Batch-обновление переменных окружения (единый эндпоинт)
   * PUT /api/projects/:projectId/tokens/:tokenId/env-batch
   *
   * Принимает массив изменений и маппит каждое на нужное хранилище:
   * - BOT_TOKEN → bot_tokens.token
   * - ADMIN_IDS → bot_projects.adminIds
   * - USER_DATABASE → bot_projects.userDatabaseEnabled
   * - LOG_LEVEL → bot_tokens.logLevel
   * - PROTECT_CONTENT → bot_tokens.protectContent
   * - SAVE_INCOMING_MEDIA → bot_tokens.saveIncomingMedia
   * - MESSAGES_RETENTION_DAYS → bot_tokens.messagesRetentionDays
   * - CATCH_ALL_HANDLERS → bot_tokens.catchAllHandlers
   * - AUTO_RESTART → bot_tokens.autoRestart
   * - MAX_RESTART_ATTEMPTS → bot_tokens.maxRestartAttempts
   * - Остальные → bot_env_variables (CRUD)
   */
  app.put("/api/projects/:projectId/tokens/:tokenId/env-batch", requireTokenOwnership, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tokenId = parseInt(req.params.tokenId);
      const { changes } = req.body as { changes: Array<{ action: string; key: string; value?: string; id?: number; isSecret?: number }> };

      console.log(`[env-batch] projectId=${projectId} tokenId=${tokenId} changes=${changes?.length ?? 0}`);

      if (!Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({ message: "Массив changes обязателен" });
      }

      /** Проверяем весь пакет до первой записи, включая переменные по идентификаторам. */
      const variables = await storage.getEnvVariables(tokenId);
      const token = await storage.getBotToken(tokenId);
      if (!token || token.projectId !== projectId) return res.status(404).json({ message: 'Бот не найден в проекте' });
      const project = await storage.getBotProject(projectId);
      const defaultLaunchMode = project?.defaultLaunchMode ?? 'polling';
      const effectiveLaunchMode = resolveBotLaunchMode(defaultLaunchMode, token.launchMode, token.inheritLaunchMode);
      const runtimeModeChanged = validateRuntimeModeBatch(
        changes, variables, effectiveLaunchMode, undefined, tokenId, defaultLaunchMode,
        project?.defaultSleepMode, token.inheritSleepMode,
      );
      const normalizedChanges = changes.map(change => ({
        ...change, key: change.key || variables.find(row => row.id === change.id)?.key || '',
      }));
      /** Отклоняем неверный формат списка до первой записи пакета. */
      if (normalizedChanges.some(({ action, key, value }) => action === 'update' && key === 'ADMIN_IDS' && typeof value !== 'string')) {
        return res.status(400).json({ message: 'Укажите список администраторов строкой' });
      }
      /** Сначала сохраняем способ доставки, затем совместимый режим обработчика. */
      const orderedChanges = normalizedChanges.sort((a, b) =>
        Number(a.key === 'BOT_POLLING_MODE') - Number(b.key === 'BOT_POLLING_MODE'));

      /** Записываем связанные режимы одной транзакцией с блокировкой токена. */
      const modeChange = normalizedChanges.find(change => change.key === 'BOT_POLLING_MODE');
      /** Последнее изменение способа получения обновлений определяет итог пакета. */
      const launchChanges = normalizedChanges.filter(change => change.key === 'LAUNCH_MODE' && change.action === 'update');
      const launchChange = launchChanges[launchChanges.length - 1];
      /** Проверяем общие и индивидуальные настройки до первой записи. */
      const botSettingChanges = parseBotInheritedSettingsBatch(normalizedChanges);
      const inheritedFields = Object.keys(botSettingChanges);
      const autoRestartPatch = parseBotAutoRestartBatch(normalizedChanges);
      const autoRestartFields = Object.keys(autoRestartPatch);
      if (modeChange || launchChange || inheritedFields.length || autoRestartFields.length) {
        const updated = await saveRuntimeModeSettings(tokenId, {
          ...(modeChange ? modeChange.action === 'delete' || modeChange.value === 'inherit'
            ? { resetMode: true } : { mode: modeChange.value } : {}),
          ...(launchChange ? { launchMode: launchChange.value as 'inherit' | 'polling' | 'webhook' } : {}),
          botSettingChanges,
          autoRestartPatch,
        }, projectId);
        if (!updated) return res.status(404).json({ message: 'Бот не найден в проекте' });
      }

      /** Маппинг системных ключей на поля bot_tokens */
      const tokenFieldMap: Record<string, string> = {
        BOT_TOKEN: 'token',
        WEBHOOK_SECRET_TOKEN: 'webhookSecretToken',
      };

      /** Ключи, которые хранятся в bot_env_variables */
      const envVarKeys = new Set([
        'API_BASE_URL', 'API_PORT', 'API_USE_SSL', 'API_TIMEOUT',
        'DISABLE_ASYNC_LOG', 'REDIS_URL', 'DATABASE_URL',
        'MAX_UPDATE_AGE_SECONDS', 'WEBHOOK_PORT',
      ]);

      /** Секретные ключи */
      const secretKeys = new Set(['REDIS_URL', 'DATABASE_URL']);

      const results: string[] = [];

      for (const change of orderedChanges) {
        const { action, key, value, id, isSecret } = change;
        console.log(`[env-batch]   ${action} ${key}${id ? ` id=${id}` : ''}`);

        /** Сервис удаляет дубликаты и сохраняет единственное каноническое значение. */
        if (key === 'BOT_POLLING_MODE' || (key === 'LAUNCH_MODE' && action === 'update')
          || ((key === 'AUTO_RESTART' || key === 'MAX_RESTART_ATTEMPTS') && action === 'update')
          || (action === 'update' && inheritedBotSettingForEnv(key))) {
          results.push(`updated:${key}`);
          continue;
        }

        if (action === 'delete' && id) {
          await storage.deleteEnvVariable(id);
          results.push(`deleted:${key || id}`);
          continue;
        }

        if (action === 'create' && key && value !== undefined) {
          await storage.createEnvVariable({ tokenId, key, value, isSecret: isSecret ?? 0 });
          results.push(`created:${key}`);
          continue;
        }

        if (action === 'update' && key && value !== undefined) {
          /** Сохраняем явную очистку списка без возврата к старому .env. */
          if (key === 'ADMIN_IDS') {
            await storage.updateBotProject(projectId, { adminIds: encodeAdminIdsForStorage(value) });
            results.push(`updated:ADMIN_IDS`);
            continue;
          }

          // USER_DATABASE → обновляем проект
          if (key === 'USER_DATABASE') {
            await storage.updateBotProject(projectId, { userDatabaseEnabled: value === '1' ? 1 : 0 });
            results.push(`updated:USER_DATABASE`);
            continue;
          }

          // Остальные поля bot_tokens, не участвующие в настройках запуска.
          if (tokenFieldMap[key]) {
            const field = tokenFieldMap[key];
            // Маска из GET (botId:••••••••) нельзя писать в bot_tokens.token —
            // иначе старт бота читает из БД невалидный токен.
            if (key === 'BOT_TOKEN' && isMaskedOrPlaceholderToken(value)) {
              results.push(`skipped:${key}:masked`);
              continue;
            }
            if (
              key === 'WEBHOOK_SECRET_TOKEN'
              && (value.includes('•') || value.includes('*') || value.includes('…'))
            ) {
              results.push(`skipped:${key}:masked`);
              continue;
            }
            const dbValue = key === 'WEBHOOK_SECRET_TOKEN' ? value || null : value;
            await storage.updateBotToken(tokenId, { [field]: dbValue });
            results.push(`updated:${key}`);
            continue;
          }

          // Переменные из bot_env_variables
          if (envVarKeys.has(key)) {
            const existing = await storage.getEnvVariables(tokenId);
            const found = existing.find(v => v.key === key);
            if (found) {
              await storage.updateEnvVariable(found.id, { value });
            } else {
              await storage.createEnvVariable({ tokenId, key, value, isSecret: secretKeys.has(key) ? 1 : 0 });
            }
            results.push(`updated:${key}`);
            continue;
          }

          // Кастомная переменная по ID
          if (id) {
            await storage.updateEnvVariable(id, { value });
            results.push(`updated:${key || id}`);
            continue;
          }

          results.push(`skipped:${key}`);
        }
      }

      const tokenFieldUpdated = results.some((r) =>
        r.startsWith('updated:') && !r.includes('ADMIN_IDS') && !r.includes('USER_DATABASE'),
      );
      if (tokenFieldUpdated || runtimeModeChanged) {
        void emitTokenUpdated({
          projectId,
          tokenId,
          source: 'api',
          changedFields: [
            ...(runtimeModeChanged ? ['pollingMode', 'inheritSleepMode'] : []),
            ...(launchChange ? ['launchMode', 'inheritLaunchMode'] : []),
            ...(inheritedFields.length ? ['inheritBotSettings', ...inheritedFields] : []),
            ...autoRestartFields,
          ],
        }).catch((err) => console.error('[env-batch] emitTokenUpdated:', err));
      }

      res.json({ success: true, applied: results.length, results });
    } catch (error: any) {
      console.error("[env-batch] Ошибка:", error?.message || error);
      res.status(error?.status || 500).json({ message: error?.status === 400 ? error.message : "Ошибка batch обновления переменных" });
    }
    return;
  });
}

