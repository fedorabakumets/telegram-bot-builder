/**
 * @fileoverview Запись и чтение журнала действий администратора
 * @module admin/admin-audit
 */

import type { NextFunction, Request, Response } from 'express';
import { pool } from '../database/db';

/** Запись журнала для административного интерфейса */
export interface AdminAuditEntry {
  /** Идентификатор записи */
  id: number;
  /** Идентификатор проекта */
  projectId: number | null;
  /** Идентификатор владельца */
  ownerId: number | null;
  /** Название действия */
  action: string;
  /** Метод запроса */
  method: string;
  /** Адрес запроса */
  path: string;
  /** Код ответа */
  statusCode: number;
  /** IP-адрес администратора */
  ip: string | null;
  /** Время действия */
  createdAt: string;
}

/**
 * Записывает безопасное административное действие без тела запроса.
 * @param req - Административный запрос
 * @param projectId - Идентификатор проекта
 * @param action - Код действия
 * @param statusCode - Итоговый код ответа
 * @returns Promise<void>
 */
export async function recordAdminAction(
  req: Request,
  projectId: number,
  action: string,
  statusCode: number,
): Promise<void> {
  await pool.query(
    `INSERT INTO admin_audit_log
      (project_id, owner_id, action, method, path, ip, user_agent, status_code, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '{}'::jsonb)`,
    [
      projectId,
      req.adminProjectOwnerId ?? null,
      action,
      req.method,
      req.originalUrl.split('?')[0],
      req.ip || req.socket.remoteAddress || null,
      req.headers['user-agent'] || null,
      statusCode,
    ],
  );
}

/** Определяет проект из адреса запроса */
function getProjectId(req: Request): number | null {
  const match = req.path.match(/\/projects\/(\d+)/);
  return match ? Number(match[1]) : null;
}

/** Определяет понятное название действия по адресу и методу */
function getAction(req: Request): string {
  if (req.method === 'GET') return 'project.view';
  if (/\/start(?:$|\/)/.test(req.path)) return 'bot.start';
  if (/\/stop(?:$|\/)/.test(req.path)) return 'bot.stop';
  if (/\/publish(?:$|\/)/.test(req.path)) return 'project.publish';
  if (/\/versions/.test(req.path)) return 'project.version';
  if (/\/tokens/.test(req.path)) return 'project.secret_or_token';
  return 'project.change';
}

/** Записывает завершённый административный запрос без тела и секретов */
export function attachAdminAudit(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAdminRequest) {
    next();
    return;
  }
  const projectId = getProjectId(req);
  if (projectId == null) {
    next();
    return;
  }
  res.on('finish', () => {
    void recordAdminAction(req, projectId, getAction(req), res.statusCode)
      .catch((error) => console.error('[admin-audit] Не удалось записать действие:', error));
  });
  next();
}

/** Возвращает журнал действий проекта */
export async function listAdminAudit(projectId: number, limit = 100): Promise<AdminAuditEntry[]> {
  const result = await pool.query(
    `SELECT id, project_id, owner_id, action, method, path, status_code, ip, created_at
     FROM admin_audit_log WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [projectId, Math.min(Math.max(limit, 1), 200)],
  );
  return result.rows.map((row) => ({
    id: Number(row.id), projectId: row.project_id == null ? null : Number(row.project_id),
    ownerId: row.owner_id == null ? null : Number(row.owner_id), action: row.action,
    method: row.method, path: row.path, statusCode: Number(row.status_code),
    ip: row.ip, createdAt: new Date(row.created_at).toISOString(),
  }));
}
