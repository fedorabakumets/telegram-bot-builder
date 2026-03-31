/**
 * @fileoverview Модуль для мониторинга изменений в файлах проектов
 * Автоматически синхронизирует изменения из файловой системы в базу данных
 */

import { EnhancedDatabaseStorage } from '../database/EnhancedDatabaseStorage';
import { importProjectsFromFiles } from './file-import';

/**
 * Запускает мониторинг изменений в директории bots/
 * При изменении файлов автоматически синхронизирует их с базой данных
 * 
 * @param storage - Экземпляр хранилища для сохранения данных
 * @returns Функцию остановки мониторинга
 */
export async function startFileMonitoring(storage: EnhancedDatabaseStorage): Promise<() => void> {
  // Динамический импорт chokidar для мониторинга файлов
  const chokidar = await import('chokidar');
  const path = await import('path');

  const botsDir = path.join(process.cwd(), 'bots');

  // Создаем watcher для директории bots/
  const watcher = chokidar.watch(botsDir, {
    persistent: true,
    ignoreInitial: true,
    ignorePermissionErrors: true,
    usePolling: true,
    interval: 1000,
    binaryInterval: 3000
  });

  // Обработчик событий изменения файлов
  const handleChange = async (_filePath: string) => {
    try {
      await importProjectsFromFiles(storage);
    } catch (error) {
      console.error('Ошибка при синхронизации проектов из файлов:', error);
    }
  };

  watcher
    .on('add', handleChange)
    .on('change', handleChange)
    .on('unlink', handleChange);

  return () => {
    console.log('Остановка мониторинга файлов...');
    watcher.close();
  };
}
