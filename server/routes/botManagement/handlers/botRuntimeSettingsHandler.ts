/** @fileoverview Защищённое API настройки времени жизни обработчика бота. */

import type { Request, Response } from 'express';
import { getRuntimeModeSettings, saveRuntimeMode } from '../../../bots/runtimeModeSettings';
import { RuntimeModeValidationError } from '../../../bots/runtimeModePolicy';
import { emitTokenUpdated } from '../../../terminal/emitTokenUpdated';

/** Читает или сохраняет настройку без запуска и остановки исполнителя. */
export async function handleBotRuntimeSettings(req: Request, res: Response): Promise<void> {
  const tokenId = Number(req.params.tokenId);
  const projectId = Number(req.params.projectId);
  if (!Number.isSafeInteger(tokenId) || tokenId < 1 || !Number.isSafeInteger(projectId) || projectId < 1) {
    res.status(400).json({ message: 'Некорректный идентификатор проекта или бота' });
    return;
  }
  res.set('Cache-Control', 'no-store');
  try {
    if (req.method === 'PUT' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)
      || Object.keys(req.body).some((key) => key !== 'mode'))) {
      res.status(400).json({ message: 'Допустимо только поле mode' });
      return;
    }
    const settings = req.method === 'PUT'
      ? await saveRuntimeMode(tokenId, req.body.mode, projectId)
      : await getRuntimeModeSettings(tokenId, projectId);
    if (!settings) {
      res.status(404).json({ message: 'Бот не найден в проекте' });
      return;
    }
    if (req.method === 'PUT') {
      void emitTokenUpdated({ projectId, tokenId, changedFields: ['pollingMode'], source: 'api' })
        .catch(() => console.error('[runtime-settings] Не удалось отправить событие обновления'));
    }
    res.json(settings);
  } catch (error) {
    if (error instanceof RuntimeModeValidationError) res.status(400).json({ message: error.message });
    else res.status(500).json({ message: 'Не удалось обработать настройки режима бота' });
  }
}
