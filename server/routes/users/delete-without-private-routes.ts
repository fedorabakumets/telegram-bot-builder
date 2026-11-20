/** @fileoverview Авторизованные предварительный подсчёт и удаление контактов без личных обращений. */
import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../database/db';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { storage } from '../../storages/storage';
import { countWithoutPrivateContacts, deleteWithoutPrivateContacts } from './delete-without-private-store';
/** Числа подтверждения не преобразуются из произвольных строк. */
const confirmation = z.object({ people:z.number().int().nonnegative(),botRecords:z.number().int().nonnegative() }).strict();
/** Проверяет область, не подменяя неверный или чужой токен всем проектом. @param req - Запрос. @param res - Ответ. @returns Разрешённая область либо отсутствие. */
async function scope(req: Request,res: Response) {
  const projectId = Number(req.params.projectId);
  const raw = req.query.tokenId;
  const tokenId = raw === undefined ? null : typeof raw === 'string' && /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(projectId) || projectId<=0 || tokenId!==null && !Number.isSafeInteger(tokenId)) {
    res.status(400).json({message:'Некорректный проект или бот'}); return null;
  }
  if (tokenId!==null) {
    const token = await storage.getBotToken(tokenId);
    if (!token || token.projectId!==projectId) { res.status(404).json({message:'Бот не найден в проекте'}); return null; }
  }
  return {projectId,tokenId};
}
/** Обрабатывает чтение и подтверждённое удаление одной проверенной области. @param req - Запрос. @param res - Ответ. @returns Завершение. */
async function handle(req:Request,res:Response) {
  res.setHeader('Cache-Control','no-store');
  try {
    const selected = await scope(req,res);
    if (!selected) return;
    /** Вид очистки задан зарегистрированным маршрутом, а не произвольным фильтром клиента. */
    const kind = req.path.endsWith('/deleted-accounts') ? 'deleted' : 'without-private';
    if (req.method==='GET') { res.json(await countWithoutPrivateContacts(pool,selected.projectId,selected.tokenId,kind)); return; }
    const parsed = confirmation.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({message:'Подтвердите количество пользователей'}); return; }
    res.json(await deleteWithoutPrivateContacts(pool,selected.projectId,selected.tokenId,parsed.data,kind));
  } catch (error) {
    const changed = error instanceof Error && error.message==='selection_changed';
    res.status(changed ? 409 : 500).json({message:changed ? 'Список изменился. Обновите количество перед удалением.' : 'Не удалось обработать пользователей'});
  }
}
/** Регистрирует маршрут перед общим удалением пользователя по ID. @param app - Приложение. @returns Ничего. */
export function registerDeleteWithoutPrivateRoutes(app:Express) {
  for (const name of ['without-private-messages','deleted-accounts']) {
    const path=`/api/projects/:projectId/users/${name}`;
    app.get(path,requireProjectAccess,handle);
    app.delete(path,requireProjectAccess,handle);
  }
}
