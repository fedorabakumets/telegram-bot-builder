/**
 * @fileoverview Публичный список выключенных типов блоков для редактора
 * @module auth/handlers/disabledNodeTypesHandler
 */

import type { Request, Response } from 'express';
import { getDisabledNodeTypes } from '../../../services/disabled-node-types';

/**
 * GET /api/disabled-node-types — типы, скрытые из набора блоков слева
 * @param _req - Запрос Express
 * @param res - Ответ Express
 */
export async function handlePublicDisabledNodeTypes(
  _req: Request,
  res: Response,
): Promise<void> {
  const disabled = await getDisabledNodeTypes();
  res.json({ disabled });
}
