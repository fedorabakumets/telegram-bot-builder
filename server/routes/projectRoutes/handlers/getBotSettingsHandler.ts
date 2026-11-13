/** @fileoverview Безопасный DTO настроек бота без секретов и с проверкой проекта. */
import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
/** Возвращает только разрешённые настройки токена внутри проекта. */
export async function getBotSettingsHandler(req: Request, res: Response): Promise<void> {
  try {
    const token = await storage.getBotToken(Number(req.params.tokenId));
    if (!token || token.projectId !== Number(req.params.id)) { res.status(404).json({ message: 'Бот проекта не найден' }); return; }
    const fields = ['id', 'projectId', 'name', 'botUsername', 'botFirstName', 'botDescription', 'botShortDescription', 'autoRestart', 'maxRestartAttempts', 'protectContent', 'saveIncomingMedia', 'catchAllHandlers', 'trackUserBlocks', 'trackGroupMembership', 'contentCache', 'logLevel', 'launchMode', 'webhookBaseUrl', 'messagesRetentionDays'] as const;
    const record = token as unknown as Record<string, unknown>;
    /** Признак настройки защиты безопасен, тогда как само значение остаётся в БД. */
    res.json({ ...Object.fromEntries(fields.map(key => [key, record[key]])),
      hasWebhookSecret: Boolean(token.webhookSecretToken?.trim()) });
  } catch { res.status(500).json({ message: 'Не удалось прочитать настройки бота' }); }
}
