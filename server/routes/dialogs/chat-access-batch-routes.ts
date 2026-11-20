/** @fileoverview Авторизованные маршруты запуска, восстановления и отмены проверки всех ботов. */
import type { Express, Request, Response } from 'express';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { storage } from '../../storages/storage';
import { chatAccessBatchStore } from './chat-access-batch-store';
import { runChatAccessBatch, stopChatAccessBatch } from './chat-access-batch-worker';
import { listPrivateUserIds } from './chat-access-check-audience';
/** Проверяет область до чтения или запуска задач. */
function project(req: Request) { const id = Number(req.params.projectId); return Number.isSafeInteger(id) && id > 0 ? id : null; }
/** Регистрирует отдельные маршруты, сохраняя совместимость проверки одного бота. @param app - Сервер. */
export function registerChatAccessBatchRoutes(app: Express) {
  app.post('/api/projects/:projectId/chat-access-batches', requireProjectAccess, async (req: Request, res: Response) => {
    const projectId = project(req);
    if (!projectId) { res.status(400).json({ message: 'Неверный проект' }); return; }
    try {
      /** Чужой процесс может исполнять задачу: учитываем только срок владения в БД. */
      await chatAccessBatchStore.failExpired(projectId);
      const tokens = await storage.getBotTokensByProject(projectId);
      if (!tokens.length) { res.status(400).json({ message: 'В проекте нет ботов' }); return; }
      const plans = [];
      for (const token of tokens) plans.push({ tokenId: token.id, total: (await listPrivateUserIds(projectId, token.id)).length });
      const batch = await chatAccessBatchStore.create(projectId, plans);
      if (!batch) { res.status(409).json({ message: 'Уже выполняется проверка чатов. Дождитесь её завершения или остановите её' }); return; }
      void runChatAccessBatch(projectId, batch.id).catch(() => undefined);
      res.status(201).json({ batch });
    } catch { res.status(500).json({ message: 'Не удалось запустить проверку всех ботов' }); }
  });
  app.get('/api/projects/:projectId/chat-access-batches/active', requireProjectAccess, async (req: Request, res: Response) => {
    const projectId = project(req);
    if (!projectId) { res.status(400).json({ message: 'Неверный проект' }); return; }
    try {
      /** Чтение прогресса никогда не прерывает проверку другого процесса. */
      const batch = await chatAccessBatchStore.get(projectId);
      res.json({ batch });
    } catch { res.status(500).json({ message: 'Не удалось получить прогресс проверки' }); }
  });
  app.post('/api/projects/:projectId/chat-access-batches/:batchId/cancel', requireProjectAccess, async (req: Request, res: Response) => {
    const projectId = project(req), id = Number(req.params.batchId);
    if (!projectId || !Number.isSafeInteger(id) || id < 1) { res.status(400).json({ message: 'Неверная проверка' }); return; }
    try {
      if (!await chatAccessBatchStore.get(projectId, id)) { res.status(404).json({ message: 'Проверка не найдена' }); return; }
      await stopChatAccessBatch(projectId, id);
      res.json({ batch: await chatAccessBatchStore.get(projectId, id) });
    } catch { res.status(500).json({ message: 'Не удалось остановить проверку' }); }
  });
}
