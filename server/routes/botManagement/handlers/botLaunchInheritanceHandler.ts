/** @fileoverview Маршрут массового возврата ботов к настройкам запуска проекта. */
import type { Request, Response } from 'express';
import { z } from 'zod';
import { adoptProjectLaunchMode } from '../../../bots/adoptProjectLaunchMode';
import { RuntimeModeValidationError } from '../../../bots/runtimeModePolicy';
import { emitTokenUpdated } from '../../../terminal/emitTokenUpdated';
import { adoptProjectAutoRestart } from '../../../bots/saveBotAutoRestartSettings';
import { broadcastProjectEvent } from '../../../terminal/broadcastProjectEvent';

/** Проверяет идентификаторы выбранных ботов. */
const tokenSelection = z.object({
  tokenIds: z.array(z.number().int().min(1).max(2147483647)).min(1).max(1000),
  setting: z.enum(['auto-restart', 'all']).optional(),
}).strict();

/**
 * Возвращает выбранным ботам наследование без перезапуска.
 * @param req - Запрос с идентификатором проекта и списком токенов.
 * @param res - Ответ с количеством переведённых ботов.
 */
export async function handleBotLaunchInheritance(req: Request, res: Response): Promise<void> {
  const rawProjectId = req.params.projectId;
  const projectId = typeof rawProjectId === 'string' && /^\d+$/.test(rawProjectId) ? Number(rawProjectId) : NaN;
  const selection = tokenSelection.safeParse(req.body);
  if (!Number.isInteger(projectId) || projectId < 1 || projectId > 2147483647 || !selection.success) {
    res.status(400).json({ message: 'Укажите проект и выберите ботов для наследования' });
    return;
  }
  const tokenIds = [...new Set(selection.data.tokenIds)];
  try {
    /** Пустой параметр сохраняет прежний маршрут наследования транспорта. */
    const { setting } = selection.data;
    const updated = setting === 'auto-restart' ? await adoptProjectAutoRestart(projectId, tokenIds)
      : setting === 'all' ? await adoptProjectLaunchMode(projectId, tokenIds, setting)
        : await adoptProjectLaunchMode(projectId, tokenIds);
    if (!updated) {
      res.status(404).json({ message: 'Некоторые из выбранных ботов не найдены в проекте' });
      return;
    }
    if (setting && updated.length) {
      void broadcastProjectEvent(projectId, {
        type: 'project-runtime-defaults-updated', projectId, timestamp: new Date().toISOString(),
      }).catch(() => console.error('[launch-inheritance] Не удалось отправить событие обновления проекта'));
    }
    for (const tokenId of setting ? [] : updated) {
      void emitTokenUpdated({ projectId, tokenId, changedFields: ['launchMode', 'inheritLaunchMode'], source: 'api' })
        .catch(() => console.error('[launch-inheritance] Не удалось отправить событие обновления'));
    }
    res.json({ inheritedCount: updated.length });
  } catch (error) {
    if (error instanceof RuntimeModeValidationError) res.status(400).json({ message: error.message });
    else res.status(500).json({ message: 'Не удалось перевести ботов на настройки проекта' });
  }
}
