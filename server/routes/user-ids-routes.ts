/**
 * @fileoverview Маршруты API для управления базой ID пользователей
 * Telegram Bot Builder - User IDs Routes (общая база на все проекты)
 *
 * @module user-ids-routes
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { handleGetUserIds } from './userIds/handlers/getUserIdsHandler';
import { handleGetUserIdsStats } from './userIds/handlers/getUserIdsStatsHandler';
import { handleAddUserId } from './userIds/handlers/addUserIdHandler';
import { handleDeleteUserId } from './userIds/handlers/deleteUserIdHandler';

/**
 * Создать маршруты для управления ID пользователей
 *
 * @function createUserIdsRoutes
 * @param {Pool} dbPool - Пул подключений к БД
 * @returns {Router} Express Router
 */
export function createUserIdsRoutes(dbPool: Pool): Router {
  const router = Router();

  router.get('/', (req, res) => handleGetUserIds(dbPool, req, res));
  router.get('/stats', (req, res) => handleGetUserIdsStats(dbPool, req, res));
  router.post('/', (req, res) => handleAddUserId(dbPool, req, res));
  router.delete('/:id', (req, res) => handleDeleteUserId(dbPool, req, res));

  return router;
}
