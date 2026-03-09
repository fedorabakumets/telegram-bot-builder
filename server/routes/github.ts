/**
 * @fileoverview Маршруты для интеграции с GitHub
 *
 * Этот файл содержит маршруты для взаимодействия с GitHub API,
 * включая возможность отправки закэшированных изменений в репозиторий.
 *
 * @module github
 */

import express from 'express';
import { handlePushCached } from './githubCommitPush/handlers/pushCachedHandler';

/**
 * Маршрутизатор для GitHub интеграции
 */
export const githubRouter = express.Router();

/**
 * POST /push-to-github
 * Отправка закэшированных изменений в GitHub репозиторий
 */
githubRouter.post('/push-to-github', handlePushCached);
