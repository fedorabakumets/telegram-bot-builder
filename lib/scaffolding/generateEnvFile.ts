/**
 * @fileoverview Утилита для генерации .env файла Telegram бота
 *
 * Этот модуль предоставляет функцию для генерации .env файла
 * с токеном бота и другими переменными окружения.
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
): string {
  const envLines: string[] = [];

  envLines.push('# Токен вашего бота (получите у @BotFather)');
  envLines.push(`BOT_TOKEN=${botToken}`);
  envLines.push('');
  envLines.push('# ID администраторов бота (через запятую)');
  const ids = adminIds.split(',').map(id => id.trim()).filter(Boolean);
  envLines.push(`ADMIN_IDS=${ids.join(',')}`);
  envLines.push('');
  envLines.push('# ID проекта');
  envLines.push(`PROJECT_ID=${projectId}`);
  envLines.push('');
  envLines.push('# URL API сервера');
  envLines.push('API_BASE_URL=http://localhost:5000');
  envLines.push('');
  envLines.push('# Порт API');
  envLines.push('API_PORT=5000');
  envLines.push('');
  envLines.push('# Использование SSL для API (true/false/auto)');
  envLines.push('API_USE_SSL=auto');
  envLines.push('');
  envLines.push('# Таймаут запросов к API (секунды)');
  envLines.push('API_TIMEOUT=10');
  envLines.push('');
  envLines.push('# Уровень логирования (DEBUG, INFO, WARNING, ERROR, CRITICAL)');
  envLines.push('LOG_LEVEL=' + logLevel);
  envLines.push('');
  envLines.push('# Отключить логирование asyncpg (true/false)');
  envLines.push('DISABLE_ASYNC_LOG=true');
  envLines.push('');
  envLines.push('# Redis URL (опционально — для кэша и FSM хранилища)');
  envLines.push('# Локально: redis://localhost:6379');
  envLines.push('# Railway: задаётся автоматически через ${{Redis.REDIS_URL}}');
  envLines.push(`REDIS_URL=${redisUrl}`);

  // Webhook режим (опционально)
  if (webhookUrl) {
    envLines.push('');
    envLines.push('# Webhook режим — URL для приёма апдейтов от Telegram');
    envLines.push(`WEBHOOK_URL=${webhookUrl}`);
    if (webhookPort) {
      envLines.push('# Порт aiohttp сервера для webhook');
      envLines.push(`WEBHOOK_PORT=${webhookPort}`);
    }
  }

  envLines.push('');

  return envLines.join('\n');
}
