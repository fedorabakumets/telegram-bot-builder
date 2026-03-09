/**
 * @fileoverview Экспорт всех сервисов модуля telegram-client
 *
 * Централизованный экспорт сервисов для переиспользования бизнес-логики.
 *
 * @module services
 * @example
 * ```typescript
 * import {
 *   createTelegramAuthService,
 *   createNotificationService,
 *   validateApiCredentials,
 *   createLogger,
 * } from '@/components/editor/telegram-client';
 * ```
 */

// ============================================================================
// HttpClient
// ============================================================================

/**
 * HTTP клиент для выполнения API запросов.
 * Предоставляет абстракцию над fetch с обработкой ошибок и таймаутов.
 */
export {
  HttpClient,
  createHttpClient,
} from './http-client';

/** HTTP метод */
export type { HttpMethod } from './http-client';
/** Опции HTTP запроса */
export type { HttpOptions } from './http-client';

// ============================================================================
// TelegramAuthService
// ============================================================================

/**
 * Сервис для работы с Telegram Auth API.
 * Предоставляет методы для управления авторизацией и сессиями.
 */
export {
  TelegramAuthService,
  createTelegramAuthService,
} from './telegram-auth-service';

/** Ответ генерации QR-кода */
export type { QrGenerateResponse } from './telegram-auth-service';
/** Ответ проверки QR-кода */
export type { QrCheckResponse } from './telegram-auth-service';

// ============================================================================
// NotificationService
// ============================================================================

/**
 * Фабрика для создания сервиса уведомлений.
 * Абстракция над toast для упрощения тестирования.
 */
export {
  createNotificationService,
} from './notification-service';

/** Сервис уведомлений для показа сообщений пользователю */
export type { NotificationService } from './notification-service';
/** Опции уведомления (заголовок и описание) */
export type { NotificationOptions } from './notification-service';

// ============================================================================
// ValidationService
// ============================================================================

/**
 * Функции валидации данных.
 * Проверяют корректность API credentials и других данных.
 */
export {
  validateApiCredentials,
  isValidCredentials,
} from './validation-service';

/** Ошибки валидации по полям */
export type { ValidationErrors } from './validation-service';

// ============================================================================
// LoggerService
// ============================================================================

/**
 * Сервис логирования с уровнями (debug, info, warn, error).
 * Добавляет timestamp и префикс для консистентности логов.
 * Поддерживает транспорты для отправки логов в external services.
 */
export {
  LoggerService,
  createLogger,
} from './logger-service';

/** Опции логгера (префикс, минимальный уровень, транспорты) */
export type { LoggerOptions } from './logger-service';
/** Уровень логирования для фильтрации сообщений */
export type { LogLevel } from './logger-service';
/** Транспорт для отправки логов */
export type { LoggerTransport } from './logger-service';
