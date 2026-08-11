/**
 * @fileoverview Модуль мониторинга файлов проектов (отключён)
 *
 * Polling директории bots/ каждую секунду создавал постоянную нагрузку на CPU и память.
 * Раньше sync шёл через публичный GET /api/projects/import-from-files — эндпоинт удалён
 * как небезопасный и неиспользуемый UI/MCP. Импорт сценариев — через UI/API проекта.
 */

import { EnhancedDatabaseStorage } from '../database/EnhancedDatabaseStorage';

/**
 * Заглушка мониторинга файлов — не запускает polling.
 * Оставлена для совместимости с вызовом в server/index.ts.
 *
 * @param _storage - Не используется
 * @returns Пустую функцию остановки
 */
export async function startFileMonitoring(_storage: EnhancedDatabaseStorage): Promise<() => void> {
  console.log('Мониторинг файлов отключён (polling bots/ не используется)');
  return () => {};
}
