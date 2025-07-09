import { Router } from 'express';
import { storage } from './storage';
import { dbManager } from './db-utils';
import { dbCache } from './db-cache';

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
    res.status(500).json({ error: 'Health check failed', message: error.message });
  }
});

// Database statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await (storage as any).getDetailedStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats', message: error.message });
  }
});

// Database metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await dbManager.getDatabaseMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics', message: error.message });
  }
});

// Cache statistics
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = dbCache.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats', message: error.message });
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
    res.status(500).json({ error: 'Failed to clear cache', message: error.message });
  }
});

// Database maintenance
router.post('/maintenance', async (req, res) => {
  try {
    await (storage as any).performMaintenance();
    res.json({ message: 'Database maintenance completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Maintenance failed', message: error.message });
  }
});

// Database backup
router.post('/backup', async (req, res) => {
  try {
    const backupName = await (storage as any).createBackup();
    res.json({ message: 'Backup created successfully', backupName });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed', message: error.message });
  }
});

// Database optimization
router.post('/optimize', async (req, res) => {
  try {
    await dbManager.optimizeConnections();
    res.json({ message: 'Database connections optimized' });
  } catch (error) {
    res.status(500).json({ error: 'Optimization failed', message: error.message });
  }
});

// Cleanup old data
router.post('/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.body;
    await dbManager.cleanupOldData(days);
    res.json({ message: `Cleaned up data older than ${days} days` });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup failed', message: error.message });
  }
});

// Connection pool information
router.get('/pool', async (req, res) => {
  try {
    const stats = dbManager.getConnectionStats();
    res.json(stats.poolInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pool info', message: error.message });
  }
});

export default router;