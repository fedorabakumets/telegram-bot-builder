/** @fileoverview Авторизованные маршруты чтения и очистки постоянной истории проверок. */
import type { Express } from 'express';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { getCheckHistory, listCheckHistory } from './repository';
import { parseHistoryQuery, parseHistoryRunId, positiveHistoryId } from './query';
import { deleteCheckHistory } from './delete-history';
import { registerCheckScheduleRoutes } from './schedule-routes';
/** Регистрирует чтение и очистку истории без вызовов Telegram и изменения статусов. @param app - Сервер приложения. */
export function registerCheckHistoryRoutes(app: Express): void {
  registerCheckScheduleRoutes(app);
  /** Очистка требует явного вида проверок и сохраняет все активные очереди. */
  app.delete('/api/projects/:projectId/check-history', requireProjectAccess, async (req, res) => {
    let projectId: number, query;
    try {
      projectId = positiveHistoryId(req.params.projectId); query = parseHistoryQuery(req.query);
      if (!query.kind || req.query.cursor !== undefined || req.query.limit !== undefined) throw new Error('Неверная область');
    } catch { res.status(400).json({ message: 'Укажите вид и область удаляемой истории' }); return; }
    try { res.json({ deleted: await deleteCheckHistory(projectId, query.kind!, query.tokenId ?? null) }); }
    catch { res.status(500).json({ message: 'Не удалось удалить историю проверок' }); }
  });
  app.get('/api/projects/:projectId/check-history', requireProjectAccess, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    let projectId: number, query;
    try { projectId = positiveHistoryId(req.params.projectId); query = parseHistoryQuery(req.query); }
    catch { res.status(400).json({ message: 'Некорректные параметры истории проверок' }); return; }
    try { res.json(await listCheckHistory(projectId, query)); }
    catch { res.status(500).json({ message: 'Не удалось загрузить историю проверок' }); }
  });
  app.get('/api/projects/:projectId/check-history/:runId', requireProjectAccess, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    let projectId: number, runId: string;
    try { projectId = positiveHistoryId(req.params.projectId); runId = parseHistoryRunId(req.params.runId); }
    catch { res.status(400).json({ message: 'Некорректный номер проверки' }); return; }
    try {
      const detail = await getCheckHistory(projectId, runId);
      if (!detail) { res.status(404).json({ message: 'Проверка не найдена' }); return; }
      res.json(detail);
    } catch { res.status(500).json({ message: 'Не удалось загрузить результат проверки' }); }
  });
}
