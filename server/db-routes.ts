import { Router } from 'express';
import { storage } from './storage';
import { dbManager } from './db-utils';
import { dbCache } from './db-cache';
import { dbBackup } from './db-backup';
import multer from 'multer';
import { join } from 'path';

const router = Router();

// Database health and statistics endpoints
router.get('/health', async (req, res) => {
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

// Database statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await (storage as any).getDetailedStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

// Database metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await dbManager.getDatabaseMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

// Cache statistics
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = dbCache.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

// Clear cache
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

// Database maintenance
router.post('/maintenance', async (req, res) => {
  try {
    await (storage as any).performMaintenance();
    res.json({ message: 'Database maintenance completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Maintenance failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

// Database backup
router.post('/backup', async (req, res) => {
  try {
    const backupName = await (storage as any).createBackup();
    res.json({ message: 'Backup created successfully', backupName });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

// Database optimization
router.post('/optimize', async (req, res) => {
  try {
    await dbManager.optimizeConnections();
    res.json({ message: 'Database connections optimized' });
  } catch (error) {
    res.status(500).json({ error: 'Optimization failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

// Cleanup old data
router.post('/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.body;
    await dbManager.cleanupOldData(days);
    res.json({ message: `Cleaned up data older than ${days} days` });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup failed', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

// Connection pool information
router.get('/pool', async (req, res) => {
  try {
    const stats = dbManager.getConnectionStats();
    res.json(stats.poolInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pool info', message: error instanceof Error ? error.message : 'Неизвестная ошибка' });
  }
});

// Настройка multer для загрузки резервных копий
const upload = multer({
  dest: './backups',
  fileFilter: (req, file, cb) => {
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

// Создать резервную копию базы данных
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

// Получить список резервных копий
router.get('/backups', async (req, res) => {
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

// Скачать резервную копию
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

// Восстановить из резервной копии
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

// Загрузить резервную копию
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

// Удалить резервную копию
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

// Получить статистику базы данных
router.get('/stats/detailed', async (req, res) => {
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

export default router;