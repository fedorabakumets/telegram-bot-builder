/**
 * @fileoverview Сбор получателей projects-changed для проекта (владелец + коллабораторы).
 * @description Возвращает уникальный список ID пользователей, которым нужно
 * разослать live-обновление списка проектов при изменении общего проекта.
 * @module server/terminal/resolveProjectMembers
 */

import { storage } from '../storages/storage';

/**
 * Возвращает уникальные ID членов проекта: владелец + все коллабораторы.
 * При ошибке чтения коллабораторов не роняет основной поток — возвращает
 * только владельца (если он задан) и логирует ошибку.
 * @param projectId - ID проекта
 * @param ownerId - ID владельца проекта (или null, если неизвестен)
 * @returns Массив уникальных ID получателей
 */
export async function getProjectMemberIds(
  projectId: number,
  ownerId: number | null,
): Promise<number[]> {
  try {
    const collaborators = await storage.getCollaborators(projectId);
    const ids = [ownerId, ...collaborators.map((c) => c.userId)];
    return Array.from(
      new Set(ids.filter((id): id is number => typeof id === 'number')),
    );
  } catch (err) {
    console.error(`[resolveProjectMembers] Ошибка получения коллабораторов проекта ${projectId}:`, err);
    return ownerId != null ? [ownerId] : [];
  }
}
