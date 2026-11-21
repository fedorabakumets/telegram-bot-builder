/** @fileoverview Защита старой авторизации Telegram во время переноса на общий аккаунт. */
import type { Request, RequestHandler, Response } from 'express';
import { acquireTelegramAccountNormalStartPermit, isTelegramAccountCutoverStartBlocked } from '../../database/project-telegram-account-cutover-guard';
import { pool } from '../../database/db';

/**
 * Удерживает проектную блокировку на всём действии над старыми секретами.
 * @param handler - Обработчик старой настройки или шага авторизации.
 * @returns Защищённый обработчик без гонки при переносе сессии.
 */
export function guardLegacyUserbotMutation(handler: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return async (req, res) => {
    if (process.env.PROJECT_TELEGRAM_ACCOUNTS_ENABLED !== '1') {
      await handler(req, res);
      return;
    }
    const projectId = Number(req.params.projectId);
    const tokenId = Number(req.params.tokenId);
    let release: (() => Promise<void>) | null = null;
    try {
      release = await acquireTelegramAccountNormalStartPermit(projectId);
      if (!release || await isTelegramAccountCutoverStartBlocked(projectId, tokenId)) {
        res.status(409).json({ ok: false, message: 'Старые настройки недоступны во время переноса Telegram-аккаунта' });
        return;
      }
      const linked = await pool.query(
        'SELECT 1 FROM project_telegram_account_bots WHERE project_id = $1 AND bot_token_id = $2',
        [projectId, tokenId],
      );
      if (linked.rowCount) {
        res.status(409).json({ ok: false, message: 'Сессия этого бота управляется в Telegram-аккаунтах проекта' });
        return;
      }
      await handler(req, res);
    } catch {
      if (!res.headersSent) res.status(503).json({ ok: false, message: 'Не удалось проверить состояние переноса Telegram-аккаунта' });
    } finally {
      await release?.();
    }
  };
}
