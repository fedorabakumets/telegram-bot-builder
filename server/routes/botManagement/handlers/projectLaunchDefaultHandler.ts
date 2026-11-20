/** @fileoverview API общего способа получения обновлений Telegram. */

import type { Request, Response } from 'express';
import { getProjectLaunchDefault, ProjectLaunchDefaultConflict, saveProjectLaunchDefault } from '../../../bots/projectLaunchDefault';
import { broadcastProjectEvent } from '../../../terminal/broadcastProjectEvent';

/**
 * Возвращает или обновляет общую настройку проекта без перезапуска ботов.
 * @param req - Запрос с проверенным доступом к проекту.
 * @param res - Ответ с безопасными настройками и числом ботов.
 * @returns Завершение обработки запроса.
 */
export async function handleProjectLaunchDefault(req: Request, res: Response): Promise<void> {
  const rawProjectId = req.params.projectId;
  const projectId = Number(rawProjectId);
  /** Проверка формата исключает расхождение с parseInt при авторизации проекта. */
  if (!/^\d+$/.test(rawProjectId) || !Number.isSafeInteger(projectId) || projectId < 1) {
    res.status(400).json({ message: 'Некорректный идентификатор проекта' });
    return;
  }
  res.set('Cache-Control', 'no-store');
  try {
    const isWrite = req.method === 'PUT';
    const launchMode = req.body?.launchMode;
    if (isWrite && ((launchMode !== 'polling' && launchMode !== 'webhook') || Object.keys(req.body).length !== 1)) {
      res.status(400).json({ message: 'Укажите только launchMode со значением polling или webhook' });
      return;
    }
    const settings = isWrite ? await saveProjectLaunchDefault(projectId, launchMode) : await getProjectLaunchDefault(projectId);
    if (!settings) {
      res.status(404).json({ message: 'Проект не найден' });
      return;
    }
    if (isWrite) {
      void broadcastProjectEvent(projectId, {
        type: 'project-launch-default-updated', projectId, timestamp: new Date().toISOString(),
      }).catch(() => console.error('[project-launch-default] Не удалось отправить уведомление об изменении'));
    }
    res.json(settings);
  } catch (error) {
    if (error instanceof ProjectLaunchDefaultConflict) {
      res.status(409).json({ message: error.message });
      return;
    }
    console.error('[project-launch-default] Ошибка обработки настроек проекта', error);
    res.status(500).json({ message: 'Не удалось обработать настройки запуска ботов проекта' });
  }
}
