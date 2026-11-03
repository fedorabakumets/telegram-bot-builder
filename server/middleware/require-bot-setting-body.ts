/** @fileoverview Общая валидация HTTP настроек теми же контрактами, что использует MCP. */
import type { Request, Response, NextFunction } from 'express';
import { botSettingsChangeSchema, botProfileBodySchema } from '../../shared/schema/bot-settings-contracts';
/** Проверяет разрешённое тело конкретной настройки до записи. */
export function requireBotSettingBody(setting: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = botSettingsChangeSchema.safeParse({ ...req.body, setting });
    if (!parsed.success) { res.status(400).json({ message: 'Некорректные настройки бота' }); return; }
    const { setting: omitted, ...body } = parsed.data;
    req.body = body;
    next();
  };
}
/** Проверяет публичный профиль до вызова Telegram. */
export function requireBotProfileBody(req: Request, res: Response, next: NextFunction): void {
  const parsed = botProfileBodySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: 'Некорректное поле профиля бота' }); return; }
  req.body = parsed.data;
  next();
}
