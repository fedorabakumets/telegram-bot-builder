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
