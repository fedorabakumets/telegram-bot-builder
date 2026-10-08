/**
 * @fileoverview HTTP-обработчики настроек рантайма в админке
 * @module server/admin/runtime-settings-handlers
 */

import type { Request, Response } from "express";
import { backupNow, getRuntimeGroup, RuntimeSettingsError, saveRuntimeGroup } from "./runtime-settings-store";

/**
 * Достаёт объект values из JSON-тела
 * @param body - Тело запроса
 * @returns Словарь полей
 */
function readValues(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RuntimeSettingsError("Ожидается объект values", 400);
  }
  const values = (body as { values?: unknown }).values;
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new RuntimeSettingsError("Ожидается объект values", 400);
  }
  return values as Record<string, unknown>;
}

/**
 * Отправляет ошибку раздела или 500
 * @param res - Ответ Express
 * @param error - Пойманная ошибка
 */
function sendError(res: Response, error: unknown): void {
  if (error instanceof RuntimeSettingsError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  const message = error instanceof Error ? error.message : "Не удалось сохранить настройки";
  res.status(500).json({ message });
}

/**
 * GET /admin/api/runtime-settings/:group
 * @param req - Запрос с id раздела
 * @param res - Ответ с полями без секретов
 */
export async function handleGetRuntimeSettings(req: Request, res: Response): Promise<void> {
  try {
    res.json(await getRuntimeGroup(req.params.group));
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PUT /admin/api/runtime-settings/:group
 * @param req - Тело `{ values }`
 * @param res - Результат и предупреждения
 */
export async function handlePutRuntimeSettings(req: Request, res: Response): Promise<void> {
  try {
    const warnings = await saveRuntimeGroup(req.params.group, readValues(req.body));
    res.json({ ok: true, warnings });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /admin/api/runtime-settings/backups/run
 * @param _req - Запрос без тела
 * @param res - Метки снятых баз
 */
export async function handleRunRuntimeBackup(_req: Request, res: Response): Promise<void> {
  try {
    const warnings: string[] = [];
    const labels = await backupNow((message) => warnings.push(message));
    res.json({ ok: true, labels, warnings });
  } catch (error) {
    sendError(res, error);
  }
}
