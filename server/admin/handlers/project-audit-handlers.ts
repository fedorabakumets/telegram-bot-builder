/**
 * @fileoverview Обработчики журнала административных действий проекта
 * @module admin/handlers/project-audit-handlers
 */

import type { Request, Response } from 'express';
import { listAdminAudit } from '../admin-audit';

/** Возвращает последние административные действия проекта */
export async function handleGetAdminProjectAudit(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    res.status(400).json({ error: 'Неверный идентификатор проекта' });
    return;
  }
  try {
    res.json({ items: await listAdminAudit(projectId) });
  } catch (error) {
    console.error(`[admin] Ошибка журнала проекта ${projectId}:`, error);
    res.status(500).json({ error: 'Не удалось загрузить журнал' });
  }
}
