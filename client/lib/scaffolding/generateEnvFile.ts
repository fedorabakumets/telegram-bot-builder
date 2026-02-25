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
 * @param {string} botToken - Токен бота для @BotFather
 * @param {string} adminIds - ID администраторов через запятую
 * @param {number} projectId - ID проекта
 * @returns {string} Содержимое .env файла
 */
export function generateEnvFile(
  botToken: string = "YOUR_BOT_TOKEN_HERE",
  adminIds: string = "123456789",
  projectId: number = 1
): string {
  const envLines: string[] = [];

  envLines.push('# Токен вашего бота (получите у @BotFather)');
  envLines.push(`BOT_TOKEN=${botToken}`);
  envLines.push('');
  envLines.push('# ID администраторов бота (каждый с новой строки)');
  envLines.push('ADMIN_IDS=');
  
  // Разбиваем ID по запятой и добавляем каждый с новой строки
  const ids = adminIds.split(',').map(id => id.trim());
  ids.forEach(id => {
    envLines.push(`  ${id}`);
  });
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
  envLines.push('LOG_LEVEL=INFO');
  envLines.push('');
  envLines.push('# Отключить логирование asyncpg (true/false)');
  envLines.push('DISABLE_ASYNC_LOG=true');
  envLines.push('');

  return envLines.join('\n');
}
