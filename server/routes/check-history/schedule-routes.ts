/** @fileoverview Настройки автоматических проверок с контролем доступа к проекту и выбранному боту. */
import type { Express } from 'express';
import { z } from 'zod';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { getOwnerIdFromRequest } from '../../telegram/auth-middleware';
import { storage } from '../../storages/storage';
import { checkScheduleStore } from './schedule-store';
import { positiveHistoryId } from './query';
/** Интервал и время проверяются до записи в базу. */
const settingsSchema = z.object({ enabled: z.boolean(), every: z.number().int().min(1).max(10080),
  unit: z.enum(['minute','hour','day','week','month']), firstAt: z.string().datetime({ offset: true }) }).strict();
/** Регистрирует чтение и сохранение без немедленного запуска внешних действий. @param app - HTTP-приложение. */
export function registerCheckScheduleRoutes(app: Express) {
  app.all('/api/projects/:projectId/check-schedule', requireProjectAccess, async (req, res) => {
    res.setHeader('Cache-Control','no-store');
    if (!['GET','PUT'].includes(req.method)) { res.status(405).json({ message: 'Метод не поддерживается' }); return; }
    let projectId: number, tokenId: number | null;
    const kind = req.query.kind;
    try {
      projectId = positiveHistoryId(req.params.projectId);
      tokenId = req.query.tokenId === undefined ? null : positiveHistoryId(req.query.tokenId);
      if (kind !== 'private-chats' && kind !== 'telegram-bots') throw new Error('Неверный вид');
    } catch { res.status(400).json({ message: 'Неверная область расписания' }); return; }
    try {
      if (req.method === 'GET') { res.json({ schedule: await checkScheduleStore.get(projectId, kind as 'private-chats' | 'telegram-bots', tokenId) }); return; }
      const settings = settingsSchema.safeParse(req.body), owner = getOwnerIdFromRequest(req);
      if (!settings.success || Date.parse(settings.data.firstAt) < Date.UTC(2020,0,1) || Date.parse(settings.data.firstAt) > Date.UTC(2200,0,1)) {
        res.status(400).json({ message: 'Проверьте интервал и время первого запуска' }); return;
      }
      if (owner === null) { res.status(403).json({ message: 'Войдите в аккаунт для настройки расписания' }); return; }
      const tokens = await storage.getBotTokensByProject(projectId);
      if ((tokenId !== null && !tokens.some(bot => bot.id === tokenId)) || (settings.data.enabled && !tokens.length)) {
        res.status(400).json({ message: 'В выбранной области нет ботов' }); return;
      }
      let schedule = await checkScheduleStore.save(projectId,kind as 'private-chats' | 'telegram-bots',tokenId,owner,settings.data);
      /** Первый запуск на текущую минуту не ждёт очередного 15-секундного прохода таймера. */
      if (schedule.enabled && Date.parse(schedule.nextRunAt) <= Date.now()) {
        const { runDueCheckScope } = await import('./schedule-worker');
        await runDueCheckScope({ projectId,kind:kind as 'private-chats' | 'telegram-bots',tokenId });
        schedule = await checkScheduleStore.get(projectId,kind as 'private-chats' | 'telegram-bots',tokenId) ?? schedule;
      }
      res.json({ schedule });
    } catch { res.status(500).json({ message: 'Не удалось сохранить или получить расписание' }); }
  });
}
