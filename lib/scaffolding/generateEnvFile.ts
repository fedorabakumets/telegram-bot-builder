/**
 * @fileoverview Утилита для генерации .env файла Telegram бота
 *
 * Этот модуль предоставляет функцию для генерации .env файла
 * с токеном бота и другими переменными окружения.
 * Кастомные переменные переопределяют дефолтные значения системных.
 *
 * @module generateEnvFile
 */

/**
 * Генерирует содержимое .env файла для бота
 * @param botToken - Токен бота
 * @param adminIds - ID администраторов через запятую
 * @param projectId - ID проекта
 * @param logLevel - Уровень логирования
 * @param redisUrl - URL Redis
 * @param webhookUrl - URL вебхука (если задан — включается webhook режим)
 * @param webhookPort - Порт aiohttp сервера для webhook режима
 * @param protectContent - Защищать контент от копирования/пересылки
 * @param saveIncomingMedia - Сохранять входящие фото от пользователей
 * @param tokenId - ID токена бота в системе (для сегментации данных в БД)
 * @param customVariables - Массив пользовательских переменных (переопределяют дефолты)
 * @param catchAllHandlers - Генерировать catch-all обработчики (по умолчанию true)
 * @returns Содержимое .env файла
 */
export function generateEnvFile(
  botToken: string = "YOUR_BOT_TOKEN_HERE",
  adminIds: string = "123456789",
  projectId: number = 1,
  logLevel: string = "WARNING",
  redisUrl: string = "redis://localhost:6379",
  webhookUrl?: string | null,
  webhookPort?: number | null,
  protectContent: boolean = false,
  saveIncomingMedia: boolean = false,
  tokenId: number = 0,
  customVariables?: Array<{ key: string; value: string }>,
  catchAllHandlers: boolean = true,
): string {
  /** Маппинг кастомных переменных для переопределения дефолтов */
  const overrides = new Map(
    (customVariables ?? []).map(v => [v.key, v.value]),
  );

  /** Ключи системных переменных (для фильтрации при выводе кастомных) */
  const systemKeys = new Set<string>();

  /**
   * Получает значение: кастомное (если есть) или дефолтное
   * @param key - Имя переменной
   * @param defaultValue - Дефолтное значение
   * @returns Итоговое значение
   */
  function resolve(key: string, defaultValue: string): string {
    systemKeys.add(key);
    return overrides.get(key) ?? defaultValue;
  }

  const envLines: string[] = [];
  const ids = adminIds.split(',').map(id => id.trim()).filter(Boolean);

  envLines.push('# Токен вашего бота (получите у @BotFather)');
  envLines.push(`BOT_TOKEN=${botToken}`);
  systemKeys.add('BOT_TOKEN');
  envLines.push('');
  envLines.push('# ID администраторов бота (через запятую)');
  envLines.push(`ADMIN_IDS=${ids.join(',')}`);
  systemKeys.add('ADMIN_IDS');
  envLines.push('');
  envLines.push('# ID проекта');
  envLines.push(`PROJECT_ID=${projectId}`);
  systemKeys.add('PROJECT_ID');
  envLines.push('');
  envLines.push('# ID токена бота (для сегментации данных в БД и Redis)');
  envLines.push(`TOKEN_ID=${tokenId}`);
  systemKeys.add('TOKEN_ID');
  envLines.push('');
  envLines.push('# URL API сервера');
  envLines.push(`API_BASE_URL=${resolve('API_BASE_URL', 'http://localhost:5000')}`);
  envLines.push('');
  envLines.push('# Порт API');
  envLines.push(`API_PORT=${resolve('API_PORT', '5000')}`);
  envLines.push('');
  envLines.push('# Использование SSL для API (true/false/auto)');
  envLines.push(`API_USE_SSL=${resolve('API_USE_SSL', 'auto')}`);
  envLines.push('');
  envLines.push('# Таймаут запросов к API (секунды)');
  envLines.push(`API_TIMEOUT=${resolve('API_TIMEOUT', '10')}`);
  envLines.push('');
  envLines.push('# Уровень логирования (DEBUG, INFO, WARNING, ERROR, CRITICAL)');
  envLines.push(`LOG_LEVEL=${logLevel}`);
  systemKeys.add('LOG_LEVEL');
  envLines.push('');
  envLines.push('# Отключить логирование asyncpg (true/false)');
  envLines.push(`DISABLE_ASYNC_LOG=${resolve('DISABLE_ASYNC_LOG', 'true')}`);
  envLines.push('');
  envLines.push('# Redis URL (опционально — для кэша и FSM хранилища)');
  envLines.push('# Локально: redis://localhost:6379');
  envLines.push('# Railway: задаётся автоматически через ${{Redis.REDIS_URL}}');
  envLines.push(`REDIS_URL=${resolve('REDIS_URL', redisUrl)}`);
  envLines.push('');
  envLines.push('# Защита контента от копирования/пересылки в Telegram');
  envLines.push(`PROTECT_CONTENT=${protectContent ? 'true' : 'false'}`);
  systemKeys.add('PROTECT_CONTENT');
  envLines.push('');
  envLines.push('# Сохранение входящих фото от пользователей (true/false)');
  envLines.push(`SAVE_INCOMING_MEDIA=${saveIncomingMedia ? 'true' : 'false'}`);
  systemKeys.add('SAVE_INCOMING_MEDIA');
  envLines.push('');
  envLines.push('# Генерация catch-all обработчиков (0/1)');
  envLines.push(`CATCH_ALL_HANDLERS=${catchAllHandlers ? 1 : 0}`);
  systemKeys.add('CATCH_ALL_HANDLERS');
  envLines.push('');
  envLines.push('# URL базы данных PostgreSQL');
  envLines.push(`DATABASE_URL=${resolve('DATABASE_URL', '')}`);
  envLines.push('');
  envLines.push('# Максимальный возраст апдейта в секундах (старые игнорируются)');
  envLines.push(`MAX_UPDATE_AGE_SECONDS=${resolve('MAX_UPDATE_AGE_SECONDS', '300')}`);

  // Webhook режим (опционально)
  if (webhookUrl) {
    envLines.push('');
    envLines.push('# Webhook режим — URL для приёма апдейтов от Telegram');
    envLines.push(`WEBHOOK_URL=${webhookUrl}`);
    systemKeys.add('WEBHOOK_URL');
    const resolvedWebhookPort = resolve('WEBHOOK_PORT', webhookPort ? String(webhookPort) : '8080');
    envLines.push('# Порт aiohttp сервера для webhook');
    envLines.push(`WEBHOOK_PORT=${resolvedWebhookPort}`);
  } else {
    // Даже без webhook — генерируем WEBHOOK_PORT для возможного будущего использования
    envLines.push('');
    envLines.push('# Порт webhook сервера (используется при включении webhook режима)');
    envLines.push(`WEBHOOK_PORT=${resolve('WEBHOOK_PORT', '8080')}`);
  }

  // Пользовательские переменные (только те, что НЕ переопределяют системные)
  const extraVars = (customVariables ?? []).filter(v => !systemKeys.has(v.key));
  if (extraVars.length > 0) {
    envLines.push('');
    envLines.push('# Пользовательские переменные');
    for (const { key, value } of extraVars) {
      envLines.push(`${key}=${value}`);
    }
  }

  envLines.push('');

  return envLines.join('\n');
}
