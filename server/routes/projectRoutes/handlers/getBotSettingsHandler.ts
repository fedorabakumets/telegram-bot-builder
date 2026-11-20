/** @fileoverview Безопасный DTO настроек бота без секретов и с проверкой проекта. */
import type { Request, Response } from 'express';
import { storage } from '../../../storages/storage';
import { resolveBotLaunchMode } from '@shared/bot-launch-mode';
import { resolveBotInheritedSettings } from '@shared/bot-inherited-settings';
/** Возвращает только разрешённые настройки токена внутри проекта. */
export async function getBotSettingsHandler(req: Request, res: Response): Promise<void> {
  try {
    const token = await storage.getBotToken(Number(req.params.tokenId));
    if (!token || token.projectId !== Number(req.params.id)) { res.status(404).json({ message: 'Бот проекта не найден' }); return; }
    const project = await storage.getBotProject(token.projectId);
    /** Индивидуальные значения и источник позволяют подтвердить запись каждого поля. */
    const fields = ['id', 'projectId', 'name', 'botUsername', 'botFirstName', 'botDescription', 'botShortDescription',
      'autoRestart', 'maxRestartAttempts', 'inheritAutoRestart', 'inheritMaxRestartAttempts', 'inheritSleepMode',
      'protectContent', 'saveIncomingMedia', 'catchAllHandlers', 'trackUserBlocks', 'trackGroupMembership', 'contentCache',
      'logLevel', 'launchMode', 'inheritLaunchMode', 'webhookBaseUrl', 'messagesRetentionDays'] as const;
    const record = token as unknown as Record<string, unknown>;
    /** Признак настройки защиты безопасен, тогда как само значение остаётся в БД. */
    res.json({ ...Object.fromEntries(fields.map(key => [key, record[key]])),
      effectiveLaunchMode: resolveBotLaunchMode(project?.defaultLaunchMode, token.launchMode, token.inheritLaunchMode),
      /** Индивидуальные поля остаются доступны, отдельно возвращаются источник и итоговые значения. */
      inheritBotSettings: token.inheritBotSettings,
      effectiveBotSettings: resolveBotInheritedSettings(project?.botSettingDefaults, token),
      hasWebhookSecret: Boolean(token.webhookSecretToken?.trim()) });
  } catch { res.status(500).json({ message: 'Не удалось прочитать настройки бота' }); }
}
