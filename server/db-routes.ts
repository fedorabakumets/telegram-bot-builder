/**
 * @fileoverview Маршруты для управления базой данных
 *
 * Этот файл содержит маршруты для выполнения различных операций с базой данных:
 * - проверка работоспособности
 * - получение статистики
 * - управление кэшем
 * - выполнение обслуживания
 * - создание и восстановление резервных копий
 */

import { Router } from 'express';
import { storage } from './storage';
import { dbManager } from './db-utils';
import { dbCache } from './db-cache';
import { dbBackup } from './db-backup';
import multer from 'multer';
import { join } from 'path';

/**
 * Маршрутизатор для операций с базой данных
 */
const router = Router();

/**
 * Маршрут для проверки работоспособности базы данных
 * Возвращает информацию о здоровье базы данных и статистику соединений
 */
router.get('/health', async (_req, res) => {
  try {
    const isHealthy = await dbManager.performHealthCheck();
    const stats = dbManager.getConnectionStats();

    res.json({
      healthy: isHealthy,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для получения статистики базы данных
 * Возвращает подробную статистику о проектах, шаблонах и других данных
 */
router.get('/stats', async (_req, res) => {
  try {
    const stats = await (storage as any).getDetailedStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для получения метрик базы данных
 * Возвращает метрики производительности таблиц базы данных
 */
router.get('/metrics', async (_req, res) => {
  try {
    const metrics = await dbManager.getDatabaseMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для получения статистики кэша
 * Возвращает информацию о состоянии кэша
 */
router.get('/cache/stats', async (_req, res) => {
  try {
    const stats = dbCache.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для очистки кэша
 * Очищает весь кэш или кэш по указанному шаблону
 */
router.post('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;

    if (pattern) {
      dbCache.clearByPattern(pattern);
    } else {
      dbCache.clear();
    }

    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для выполнения обслуживания базы данных
 * Выполняет различные задачи обслуживания базы данных
 */
router.post('/maintenance', async (_req, res) => {
  try {
    await (storage as any).performMaintenance();
    res.json({ message: 'Database maintenance completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Maintenance failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для создания резервной копии базы данных
 * Создает резервную копию базы данных и возвращает информацию о ней
 */
router.post('/backup', async (_req, res) => {
  try {
    const backupName = await (storage as any).createBackup();
    res.json({ message: 'Backup created successfully', backupName });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для оптимизации соединений с базой данных
 * Выполняет оптимизацию текущих соединений с базой данных
 */
router.post('/optimize', async (_req, res) => {
  try {
    await dbManager.optimizeConnections();
    res.json({ message: 'Database connections optimized' });
  } catch (error) {
    res.status(500).json({ error: 'Optimization failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для очистки старых данных
 * Удаляет данные, старше указанного количества дней
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.body;
    await dbManager.cleanupOldData(days);
    res.json({ message: `Cleaned up data older than ${days} days` });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Маршрут для получения информации о пуле соединений
 * Возвращает информацию о текущем состоянии пула соединений
 */
router.get('/pool', async (_req, res) => {
  try {
    const stats = dbManager.getConnectionStats();
    res.json(stats.poolInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pool info', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

/**
 * Конфигурация multer для загрузки резервных копий
 * Ограничивает размер файла и разрешает только JSON формат
 */
const upload = multer({
  dest: './backups',
  fileFilter: (_req, file, cb) => {
    // Разрешить только JSON файлы
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Только JSON файлы разрешены для загрузки'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB максимальный размер файла
  }
});

// BACKUP AND RESTORE ENDPOINTS

/**
 * Маршрут для создания резервной копии базы данных
 * Принимает описание резервной копии и создает полную резервную копию
 */
router.post('/backup', async (req, res) => {
  try {
    const { description } = req.body;
    const filepath = await dbBackup.createFullBackup(description);

    res.json({
      success: true,
      message: 'Резервная копия создана успешно',
      filepath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Не удалось создать резервную копию',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

/**
 * Маршрут для получения списка резервных копий
 * Возвращает список всех доступных резервных копий
 */
router.get('/backups', async (_req, res) => {
  try {
    const backups = await dbBackup.listBackups();
    res.json({
      success: true,
      backups,
      count: backups.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Не удалось получить список резервных копий',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

/**
 * Маршрут для скачивания резервной копии
 * Позволяет скачать конкретную резервную копию по имени файла
 */
router.get('/backup/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = join('./backups', filename);

    // Проверить что файл существует
    const fs = await import('fs');
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Резервная копия не найдена'
      });
    }

    // Отправить файл для скачивания
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          success: false,
          error: 'Не удалось скачать файл'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Не удалось скачать резервную копию',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

/**
 * Маршрут для восстановления из резервной копии
 * Восстанавливает базу данных из указанной резервной копии
 */
router.post('/restore', async (req, res) => {
  try {
    const { filename, options } = req.body;
    const filepath = join('./backups', filename);

    await dbBackup.restoreFromBackup(filepath, options);

    res.json({
      success: true,
      message: 'База данных восстановлена успешно',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Не удалось восстановить базу данных',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

/**
 * Маршрут для загрузки резервной копии
 * Загружает резервную копию на сервер и при необходимости сразу восстанавливает
 */
router.post('/backup/upload', upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Файл не загружен'
      });
    }

    const { restoreImmediately, clearExisting } = req.body;
    const filepath = req.file.path;

    // Переименовать файл чтобы иметь правильное расширение
    const fs = await import('fs');
    const newFilepath = filepath + '.json';
    fs.renameSync(filepath, newFilepath);

    let result: any = {
      success: true,
      message: 'Файл загружен успешно',
      filename: req.file.filename + '.json',
      size: req.file.size
    };

    // Если указано восстановить немедленно
    if (restoreImmediately === 'true') {
      try {
        await dbBackup.restoreFromBackup(newFilepath, {
          clearExisting: clearExisting === 'true'
        });
        result.message = 'Файл загружен и база данных восстановлена успешно';
        result.restored = true;
      } catch (restoreError) {
        result.warning = 'Файл загружен, но восстановление не удалось: ' + (restoreError instanceof Error ? restoreError.message : 'Неизвестная ошибка');
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить файл',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

/**
 * Маршрут для удаления резервной копии
 * Удаляет указанную резервную копию с сервера
 */
router.delete('/backup/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    await dbBackup.deleteBackup(filename);

    res.json({
      success: true,
      message: 'Резервная копия удалена успешно'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Не удалось удалить резервную копию',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

/**
 * Маршрут для получения подробной статистики базы данных
 * Возвращает расширенную статистику о состоянии базы данных
 */
router.get('/stats/detailed', async (_req, res) => {
  try {
    const stats = await dbBackup.getDatabaseStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Не удалось получить статистику',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
});

/**
 * Экспорт маршрутизатора для операций с базой данных
 */
export default router;