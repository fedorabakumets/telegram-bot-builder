/** @fileoverview API чтения и записи общих настроек ботов проекта. */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { isMessagesRetentionDays } from '@shared/messages-retention';
import { getProjectBotSettingDefaults, ProjectBotSettingDefaultsConflict, saveProjectBotSettingDefaults } from '../../../bots/projectBotSettingDefaults';
import { broadcastProjectEvent } from '../../../terminal/broadcastProjectEvent';

/** Допустимые значения логических настроек, хранящихся как числа. */
const flag = z.union([z.literal(0), z.literal(1)]);

/**
 * Проверяет формат HTTPS-адреса, который Telegram сможет использовать вместе с путём webhook.
 * @param value - Базовый URL.
 * @returns Признак пригодности адреса для регистрации webhook.
 */
function isWebhookBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
      && !value.includes('?') && !value.includes('#') && url.hostname !== 'localhost'
      && !url.hostname.endsWith('.localhost') && !url.hostname.endsWith('.local');
  } catch {
    return false;
  }
}

/** Схема частичного обновления настроек проекта. */
const updateSchema = z.object({
  saveIncomingMedia: flag.optional(),
  messagesRetentionDays: z.number().refine(isMessagesRetentionDays).optional(),
  contentCache: flag.optional(),
  logLevel: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR']).optional(),
  catchAllHandlers: flag.optional(),
  trackUserBlocks: flag.optional(),
  trackGroupMembership: flag.optional(),
  protectContent: flag.optional(),
  webhookBaseUrl: z.string().trim().max(2048).refine(isWebhookBaseUrl)
    .transform((value) => new URL(value).href.replace(/\/+$/, '')).nullable().optional(),
}).strict().refine((value) => Object.values(value).some((field) => field !== undefined));

/**
 * Читает или обновляет общие настройки проекта без перезапуска его ботов.
 * @param req - Запрос после проверки доступа к проекту.
 * @param res - Ответ со значениями проекта.
 * @returns Завершение обработки запроса.
 */
export async function handleProjectBotSettingDefaults(req: Request, res: Response): Promise<void> {
  const rawProjectId = req.params.projectId;
  const projectId = Number(rawProjectId);
  if (!/^\d+$/.test(rawProjectId) || !Number.isInteger(projectId) || projectId < 1 || projectId > 2147483647) {
    res.status(400).json({ message: 'Некорректный идентификатор проекта' });
    return;
  }
  res.set('Cache-Control', 'no-store');
  try {
    const update = req.method === 'PUT' ? updateSchema.safeParse(req.body) : undefined;
    if (update && !update.success) {
      res.status(400).json({ message: 'Некорректные общие настройки ботов. Для webhook укажите базовый HTTPS-адрес.' });
      return;
    }
    const settings = update ? await saveProjectBotSettingDefaults(projectId, update.data) : await getProjectBotSettingDefaults(projectId);
    if (!settings) {
      res.status(404).json({ message: 'Проект не найден' });
      return;
    }
    if (update) {
      void broadcastProjectEvent(projectId, {
        type: 'project-bot-settings-updated', projectId, timestamp: new Date().toISOString(),
      }).catch(() => console.error('[project-bot-settings] Не удалось отправить уведомление об изменении'));
    }
    res.json(settings);
  } catch (error) {
    if (error instanceof ProjectBotSettingDefaultsConflict) {
      res.status(409).json({ message: error.message });
      return;
    }
    console.error('[project-bot-settings] Ошибка обработки настроек проекта', error);
    res.status(500).json({ message: 'Не удалось обработать общие настройки ботов проекта' });
  }
}
