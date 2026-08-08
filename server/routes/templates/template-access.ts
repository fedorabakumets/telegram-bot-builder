/**
 * @fileoverview Проверки доступа к сценариям (`bot_templates`).
 * @module server/routes/templates/template-access
 */

import type { Request, Response } from "express";

import { getOwnerIdFromRequest } from "../../telegram/auth-middleware";

/** Минимальные поля шаблона для проверки доступа */
export interface TemplateAccessFields {
  /** Владелец (null — системный) */
  ownerId: number | null;
  /** Публичность: 1 = публичный */
  isPublic: number | null;
}

/**
 * Можно ли смотреть/использовать шаблон: системный, публичный или свой.
 * @param template - Поля ownerId / isPublic
 * @param ownerId - ID текущего пользователя
 * @returns true, если доступ разрешён
 */
export function canViewOrUseTemplate(
  template: TemplateAccessFields,
  ownerId: number,
): boolean {
  if (template.ownerId === null) return true;
  if (template.isPublic === 1) return true;
  return template.ownerId === ownerId;
}

/**
 * Возвращает ownerId из req.user или отвечает 401 (defense-in-depth поверх requireApiAuth).
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns ownerId или null, если уже отправлен 401
 */
export function assertOwnerId(req: Request, res: Response): number | null {
  const ownerId = getOwnerIdFromRequest(req);
  if (ownerId === null) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return null;
  }
  return ownerId;
}

/**
 * Парсит числовой id из params; при невалидном — 400.
 * @param raw - Строка из req.params.id
 * @param res - Ответ Express
 * @returns Числовой id или null
 */
export function parseTemplateId(raw: string, res: Response): number | null {
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "Invalid template id" });
    return null;
  }
  return id;
}
