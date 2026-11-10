/**
 * @fileoverview Авторизованное обновление разрешённых полей токена с квитанцией сохранения.
 */
import type { Request, Response } from 'express';
import { z } from 'zod';
import { updateBotTokenSchema } from '@shared/schema/token-update';
import { storage } from '../../../storages/storage';
import { getOwnerIdFromRequest } from '../../../telegram/auth-middleware';
import { isMaskedOrPlaceholderToken, toPublicBotToken } from '../to-public-bot-token';
import { botTokenWriteReceipt } from '../token-write-receipt';
import { emitTokenUpdated } from '../../../terminal';
import { resetRestartCounter } from '../../../bots/botRestartManager';
/**
 * Запрещает массовое присваивание служебных полей до любых запросов к хранилищу.
 * @param req - Запрос с проектом и токеном
 * @param res - Ответ с безопасной квитанцией
 * @returns Завершение обновления
 */
export async function updateProjectTokenHandler(req: Request, res: Response): Promise<void> {
 try {
  const updateData = updateBotTokenSchema.parse(req.body);
  const projectId = z.coerce.number().int().positive().parse(req.params.id);
  const tokenId = z.coerce.number().int().positive().parse(req.params.tokenId);
  const ownerId = getOwnerIdFromRequest(req);
  if (ownerId === null) { res.status(401).json({ message: 'Требуется авторизация' }); return; }
  const project = await storage.getBotProject(projectId);
  if (!project) { res.status(404).json({ message: 'Проект не найден' }); return; }
  if (!await storage.hasProjectAccess(projectId, ownerId)) { res.status(403).json({ message: 'Нет доступа к проекту' }); return; }
  const token = await storage.getBotToken(tokenId);
  if (!token || token.projectId !== projectId) { res.status(404).json({ message: 'Токен не найден в проекте' }); return; }
  if (updateData.token && isMaskedOrPlaceholderToken(updateData.token)) delete updateData.token;
  /** Только замена секрета снимает подтверждённый отказ; повторное сохранение не обходит блокировку. */
  const changedToken = Boolean(updateData.token && updateData.token !== token.token);
  if (token.authorizationError === 'unauthorized' && !changedToken && updateData.isActive === 1) {
    res.status(400).json({ message: 'Замените недействительный токен перед включением бота' }); return;
  }
  const updated = await storage.updateBotToken(tokenId, changedToken
    ? { ...updateData, isActive: 1, authorizationError: null }
    : updateData);
  if (changedToken) resetRestartCounter(tokenId);
  if (!updated) { res.status(404).json({ message: 'Токен не найден' }); return; }
  // Отказ уведомления не отменяет уже выполненную запись.
  void emitTokenUpdated({ projectId, tokenId, before: undefined, source: 'api' }).catch(() => undefined);
  res.json({ ...toPublicBotToken(updated), ...botTokenWriteReceipt(updated, projectId, updateData.token) });
 } catch (error) {
  if (error instanceof z.ZodError) { res.status(400).json({ message: 'Недопустимые поля или значения токена', errors: error.errors }); return; }
  res.status(500).json({ message: 'Не удалось обновить токен' });
 }
}
