/**
 * @fileoverview Модуль мониторинга файлов проектов (отключён)
 *
 * Polling директории bots/ каждую секунду создавал постоянную нагрузку на CPU и память.
 * Синхронизация теперь выполняется только по явному запросу через API:
 * GET /api/projects/import-from-files
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
  console.log('Мониторинг файлов отключён — используйте GET /api/projects/import-from-files для синхронизации');
  return () => {};
}
