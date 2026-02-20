/**
 * @fileoverview Маршруты API для управления базой ID пользователей
 * Telegram Bot Builder - User IDs Routes
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
   * GET /api/projects/:projectId/user-ids
   * Получить список ID пользователей
   */
  router.get('/:projectId/user-ids', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Неверный ID проекта' });
      }

      const items = await getUserIds(dbPool, projectId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/projects/:projectId/user-ids/stats
   * Получить статистику по ID
   */
  router.get('/:projectId/user-ids/stats', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Неверный ID проекта' });
      }

      const stats = await getUserIdsStats(dbPool, projectId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/projects/:projectId/user-ids
   * Добавить ID пользователя
   */
  router.post('/:projectId/user-ids', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        console.error('[UserIDs] Неверный ID проекта:', req.params.projectId);
        return res.status(400).json({ error: 'Неверный ID проекта' });
      }

      const { userId } = req.body;
      if (!userId || typeof userId !== 'string') {
        console.error('[UserIDs] Неверный userId:', userId);
        return res.status(400).json({ error: 'Требуется userId' });
      }

      console.log('[UserIDs] Добавление ID:', userId, 'для проекта:', projectId);
      const item = await addUserId(dbPool, projectId, userId);
      console.log('[UserIDs] Успешно добавлено:', item);
      res.status(201).json(item);
    } catch (error: any) {
      console.error('[UserIDs] Ошибка:', error.message);
      if (error.message === 'ID уже существует') {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/projects/:projectId/user-ids/:id
   * Удалить ID пользователя
   */
  router.delete('/:projectId/user-ids/:id', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const id = parseInt(req.params.id);

      if (isNaN(projectId) || isNaN(id)) {
        return res.status(400).json({ error: 'Неверный ID' });
      }

      const deleted = await deleteUserId(dbPool, projectId, id);
      if (!deleted) {
        return res.status(404).json({ error: 'ID не найден' });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
