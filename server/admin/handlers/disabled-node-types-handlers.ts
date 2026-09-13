/**
 * @fileoverview GET/PUT выключенных типов блоков в панели управления
 * @module server/admin/handlers/disabled-node-types-handlers
 */

import type { Request, Response } from 'express';
import { CORE_NODE_TYPES } from '../../../shared/disabled-node-types';
import { MCP_ALLOWED_NODE_TYPES } from '../../../lib/bot-tools/mcp-allowed-types';
import {
  getDisabledNodeTypes,
  setDisabledNodeTypes,
} from '../../services/disabled-node-types';

/**
 * GET /admin/api/disabled-node-types — текущий список и справочники
 * @param _req - Запрос Express
 * @param res - Ответ Express
 */
export async function handleGetAdminDisabledNodeTypes(
  _req: Request,
  res: Response,
): Promise<void> {
  const disabled = await getDisabledNodeTypes();
  res.json({
    disabled,
    core: [...CORE_NODE_TYPES],
    palette: [...MCP_ALLOWED_NODE_TYPES],
  });
}

/**
 * PUT /admin/api/disabled-node-types — сохранить список выключенных типов
 * @param req - Запрос с body `{ disabled: string[] }`
 * @param res - Ответ Express
 */
export async function handlePutAdminDisabledNodeTypes(
  req: Request,
  res: Response,
): Promise<void> {
  const raw = req.body?.disabled;
  if (!Array.isArray(raw)) {
    res.status(400).json({ error: 'Ожидается массив disabled' });
    return;
  }
  const types = raw.filter((item: unknown): item is string => typeof item === 'string');
  const disabled = await setDisabledNodeTypes(types);
  res.json({ disabled, core: [...CORE_NODE_TYPES] });
}
