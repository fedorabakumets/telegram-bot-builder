/**
 * @fileoverview Маршруты API для управления базой ID пользователей
 * Telegram Bot Builder - User IDs Routes (общая база на все проекты)
 */

import { Router } from 'express';
import { Pool } from 'pg';
import {
  getUserIds,
  addUserId,
  deleteUserId,
  getUserIdsStats,
} from '../handlers/user-ids-handler';

/**
 * Создать маршруты для управления ID пользователей
 * @param dbPool - Пул подключений к БД
 * @returns Express Router
 */
export function createUserIdsRoutes(dbPool: Pool): Router {
  const router = Router();

  /**
   * GET /api/user-ids
   * Получить список ID пользователей (общая база)
   */
  router.get('/', async (_req, res): Promise<void> => {
    try {
      const items = await getUserIds(dbPool);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  });

  /**
   * GET /api/user-ids/stats
   * Получить статистику по ID (общая база)
   */
  router.get('/stats', async (_req, res): Promise<void> => {
    try {
      const stats = await getUserIdsStats(dbPool);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  });

  /**
   * POST /api/user-ids
   * Добавить ID пользователя в общую базу
   */
  router.post('/', async (req, res): Promise<void> => {
    try {
      const { userId, source } = req.body;
      if (!userId || typeof userId !== 'string') {
        console.error('[UserIDs] Неверный userId:', userId);
        res.status(400).json({ error: 'Требуется userId' });
        return;
      }

      console.log('[UserIDs] Добавление ID:', userId, 'источник:', source || 'manual');
      const item = await addUserId(dbPool, userId, source as 'manual' | 'import' | 'bot' || 'manual');
      console.log('[UserIDs] Успешно добавлено:', item);
      res.status(201).json(item);
    } catch (error: any) {
      console.error('[UserIDs] Ошибка:', error.message);
      if (error.message === 'ID уже существует') {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
      return;
    }
  });

  /**
   * DELETE /api/user-ids/:id
   * Удалить ID пользователя из общей базы
   */
  router.delete('/:id', async (req, res): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Неверный ID' });
        return;
      }

      const deleted = await deleteUserId(dbPool, id);
      if (!deleted) {
        res.status(404).json({ error: 'ID не найден' });
        return;
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  });

  return router;
}
