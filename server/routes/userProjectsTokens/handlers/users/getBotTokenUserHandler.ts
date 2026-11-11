/** @fileoverview Карточка пользователя токена с датами и кэшируемой фотографией. */
import type { Request, Response } from "express";
import { getBotUsersAccess } from "./bot-users-access";
import { parseBotUserId } from "./bot-users-params";
import { findBotTokenUser } from "./bot-users-repository";
import { getBotUserPhotoUrl } from "./bot-user-photo-cache";
/**
 * Форматирует дату для сообщения Telegram, сохраняя прежний формат ответа.
 * @param date - Дата из базы данных.
 * @returns Дата в формате ДД.ММ.ГГГГ ЧЧ:ММ либо прочерк.
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "—";
  /**
   * Дополняет компонент даты до двух цифр.
   * @param part - Компонент даты.
   * @returns Строка из двух цифр.
   */
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
/**
 * Возвращает пользователя из проверенной области текущего токена.
 * @param req - Запрос с идентификатором Telegram.
 * @param res - Ответ с проверенным контекстом доступа.
 * @returns Завершение отправки карточки либо ошибки.
 */
export async function getBotTokenUserHandler(req: Request, res: Response): Promise<void> {
  const access = getBotUsersAccess(res);
  if (!access) { res.status(401).json({ error: "UNAUTHORIZED" }); return; }
  const userId = parseBotUserId(req.params.userId);
  if (userId === null) { res.status(400).json({ error: "Некорректный userId" }); return; }
  try {
    const user = await findBotTokenUser(access, userId);
    if (!user) { res.status(404).json({ error: "Пользователь не найден" }); return; }
    const photoUrl = await getBotUserPhotoUrl({ ...access, userId });
    res.json({ ...user, registeredAt: formatDate(user.registeredAt), lastInteraction: formatDate(user.lastInteraction), photoUrl });
  } catch {
    console.error("[BotTokenUser] Не удалось загрузить карточку пользователя");
    res.status(500).json({ error: "Не удалось получить пользователя" });
  }
}
