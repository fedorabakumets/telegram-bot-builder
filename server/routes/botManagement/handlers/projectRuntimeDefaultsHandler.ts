/** @fileoverview API проектных настроек обработчика и автоматического перезапуска. */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { getProjectRuntimeDefaults, saveProjectRuntimeDefaults } from '../../../bots/projectRuntimeDefaults';
import { broadcastProjectEvent } from '../../../terminal/broadcastProjectEvent';

/** Схема частичного обновления настройки проекта. */
const updateSchema = z.object({
  sleepMode: z.enum(['direct', 'process']).nullable().optional(),
  autoRestart: z.union([z.literal(0), z.literal(1)]).optional(),
  maxRestartAttempts: z.number().int().min(1).max(10).optional(),
}).strict().refine((value) => Object.values(value).some((field) => field !== undefined));

/**
 * Возвращает или обновляет общие параметры без перезапуска работающих ботов.
 * @param req - Запрос с проверенным доступом к проекту.
 * @param res - Ответ с безопасными настройками.
 * @returns Завершение обработки запроса.
 */
export async function handleProjectRuntimeDefaults(req: Request, res: Response): Promise<void> {
  const rawProjectId = req.params.projectId;
  const projectId = Number(rawProjectId);
  if (!/^\d+$/.test(rawProjectId) || !Number.isSafeInteger(projectId) || projectId < 1) {
    res.status(400).json({ message: 'Некорректный идентификатор проекта' });
    return;
  }
  res.set('Cache-Control', 'no-store');
  try {
    const update = req.method === 'PUT' ? updateSchema.safeParse(req.body) : undefined;
    if (update && !update.success) {
      res.status(400).json({ message: 'Укажите режим обработчика, автоперезапуск или число попыток от 1 до 10' });
      return;
    }
    const settings = update ? await saveProjectRuntimeDefaults(projectId, update.data) : await getProjectRuntimeDefaults(projectId);
    if (!settings) {
      res.status(404).json({ message: 'Проект не найден' });
      return;
    }
    if (update) {
      void broadcastProjectEvent(projectId, {
        type: 'project-runtime-defaults-updated', projectId, timestamp: new Date().toISOString(),
      }).catch(() => console.error('[project-runtime-defaults] Не удалось отправить уведомление об изменении'));
    }
    /** Старые записи без явного значения показывают включённый сон. */
    res.json({ ...settings, sleepMode: settings.sleepMode ?? 'process' });
  } catch (error) {
    console.error('[project-runtime-defaults] Ошибка обработки настроек проекта', error);
    res.status(500).json({ message: 'Не удалось обработать настройки работы ботов проекта' });
  }
}
