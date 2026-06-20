/**
 * @fileoverview Типы опций генерации Python-кода бота
 * 
 * Модуль определяет конфигурацию для генератора ботов.
 * Используется для настройки поведения генерации кода.
 * 
 * @module bot-generator/core/generation-options-types
 */

/**
 * Опции генератора Python-кода
 * 
 * @example
 * const options: GenerationOptions = {
 *   enableLogging: true,
 *   enableComments: true,
 *   userDatabaseEnabled: false
 * };
 */
export interface GenerationOptions {
  /** Включить логирование в сгенерированном коде */
  enableLogging?: boolean;
  /** Включить комментарии в сгенерированном коде */
  enableComments?: boolean;
  /** Включить базу данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Включить обработчики групп */
  enableGroupHandlers?: boolean;
  /** ID проекта для генерации */
  projectId?: number | null;
  /** Автоматически регистрировать пользователей при первом обращении */
  autoRegisterUsers?: boolean;
  /** URL вебхука для webhook режима */
  webhookUrl?: string | null;
  /** Порт aiohttp сервера для webhook режима */
  webhookPort?: number | null;
  /** Сохранять входящие фото от пользователей в БД */
  saveIncomingMedia?: boolean;
  /**
   * Генерировать catch-all обработчики (handle_unhandled_message,
   * handle_unhandled_photo, fallback_callback_handler). По умолчанию true.
   * При наличии incoming-триггеров/динамических кнопок генерируются принудительно
   * независимо от значения этого флага (см. computeFeatureFlags).
   */
  catchAllHandlers?: boolean;
  /**
   * Словарь кэшированных Telegram file_id для медиафайлов.
   * Ключ — URL файла, значение — Telegram file_id.
   */
  telegramFileIds?: Record<string, string>;
  /**
   * Словарь обложек видео: ключ — URL видео, значение — Telegram file_id обложки.
   * Если для видео есть обложка — передаётся как thumbnail= в send_video.
   */
  thumbnailFileIds?: Record<string, string>;
  /**
   * Словарь прямых URL обложек видео: ключ — URL видео, значение — URL обложки.
   * Используется если обложка задана как строка (без FK на media_files).
   * Приоритет: thumbnailFileIds > thumbnailUrls.
   */
  thumbnailUrls?: Record<string, string>;
}

/**
 * Опции генерации по умолчанию
 * 
 * @example
 * const defaults = DEFAULT_GENERATION_OPTIONS;
 */
export const DEFAULT_GENERATION_OPTIONS: Required<GenerationOptions> = {
  enableLogging: false,
  enableComments: true,
  userDatabaseEnabled: false,
  enableGroupHandlers: false,
  projectId: null,
  autoRegisterUsers: false,
  webhookUrl: null,
  webhookPort: null,
  saveIncomingMedia: false,
  catchAllHandlers: true,
  telegramFileIds: {},
  thumbnailFileIds: {},
  thumbnailUrls: {},
} as const;

/**
 * Нормализует опции генерации, заполняя значения по умолчанию
 * 
 * @param options - Пользовательские опции
 * @returns Полные опции со значениями по умолчанию
 * 
 * @example
 * const normalized = normalizeGenerationOptions({ enableLogging: true });
 */
export function normalizeGenerationOptions(
  options?: GenerationOptions
): Required<GenerationOptions> {
  return {
    ...DEFAULT_GENERATION_OPTIONS,
    ...options,
  };
}
