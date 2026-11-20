/** @fileoverview Предпросмотр и применение импорта контактов в явно выбранного бота разрешённого проекта. */
import type { Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { importUsersBodySchema, type ImportUser } from './import-users-schema';
import { importUsers } from './import-users-repository';
/**
 * Выбирает переменные единственного исходного бота, не объединяя разные контексты.
 * @param users - Проверенные строки файла.
 * @param sourceTokenId - Явно выбранный исходный бот.
 * @returns Отдельные записи для целевого бота.
 */
export function selectImportSource(users: ImportUser[], sourceTokenId?: number | null): ImportUser[] {
  const sources = new Set(users.flatMap(user => user.memberships?.length ? user.memberships.map(bot => bot.tokenId) : user.tokenId ? [user.tokenId] : []));
  if (sources.size > 1 && sourceTokenId == null) throw new Error('Выберите исходного бота: файл содержит переменные нескольких ботов');
  const source = sourceTokenId ?? [...sources][0];
  if (source !== undefined && sources.size && !sources.has(source)) throw new Error('Исходный бот отсутствует в файле');
  return users.flatMap(user => {
    if (user.memberships?.length) {
      const membership = user.memberships.find(bot => bot.tokenId === source);
      return membership ? [{ ...user, userData: membership.userData ?? {},
        deepLinkParam: membership.deepLinkParam, referrerId: membership.referrerId, memberships: undefined }] : [];
    }
    return source !== undefined && user.tokenId !== source ? [] : [user];
  });
}
/** Обрабатывает авторизованный запрос импорта. @param req - Проект и файл. @param res - Итог без секретов. @returns Завершение ответа. */
export async function importUsersHandler(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.projectId);
  if (!Number.isSafeInteger(projectId) || projectId < 1 || Buffer.byteLength(JSON.stringify(req.body ?? {})) > 10_000_000) {
    res.status(400).json({ message: 'Неверный проект или слишком большой файл (не более 10 МБ)' }); return;
  }
  const parsed = importUsersBodySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: 'Проверьте файл: до 10 000 пользователей, положительные Telegram ID и корректные переменные' }); return; }
  try {
    const token = await storage.getBotToken(parsed.data.tokenId);
    if (!token || token.projectId !== projectId) { res.status(404).json({ message: 'Выбранный бот не найден в проекте' }); return; }
    let users: ImportUser[];
    try { users = selectImportSource(parsed.data.users, parsed.data.sourceTokenId); }
    catch (error) { res.status(400).json({ message: (error as Error).message }); return; }
    if (!users.length) { res.status(400).json({ message: 'В файле нет пользователей выбранного исходного бота' }); return; }
    res.json(await importUsers(projectId, token.id, users, parsed.data.apply));
  } catch { res.status(500).json({ message: 'Не удалось импортировать пользователей. Изменения отменены' }); }
}
