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
    ignoreInitial: true, // Игнорируем начальные события
    ignorePermissionErrors: true,
    usePolling: true, // Используем polling для лучшей совместимости
    interval: 1000, // Интервал проверки в миллисекундах
    binaryInterval: 3000
  });

  // Обработчик событий изменения файлов
  const handleChange = async (filePath: string) => {
    console.log(`Обнаружено изменение файла: ${filePath}`);

    try {
      // Импортируем проекты из файлов
      await importProjectsFromFiles(storage);
      console.log('Проекты успешно синхронизированы из файлов');
    } catch (error) {
      console.error('Ошибка при синхронизации проектов из файлов:', error);
    }
  };

  // Назначаем обработчики событий
  watcher
    .on('add', handleChange)      // При добавлении файла
    .on('change', handleChange)   // При изменении файла
    .on('unlink', handleChange);  // При удалении файла

  // Возвращаем функцию для остановки мониторинга
  return () => {
    console.log('Остановка мониторинга файлов...');
    watcher.close();
  };
}