/**
 * @fileoverview Хендлер списка коллабораторов проекта для UI файлового хранилища
 * (GET /api/projects/:projectId/collaborators).
 *
 * Возвращает массив `CollaboratorInfo[]` — участников проекта (владелец +
 * коллабораторы) с отображаемым именем и аватаркой. Используется фильтром
 * «Сотрудник» и столбцом-аватаром в таблице файлов (Req 6.5, 9.3). Доступ
 * проверяется middleware `requireProjectAccess`. Данные собираются из
 * `project_collaborators` и `telegram_users` через слой `storage`.
 * @module botIntegration/handlers/botData/getCollaboratorsInfoHandler
 */

import type { Request, Response } from "express";

import { storage } from "../../../../storages/storage";

/** Информация о коллабораторе для аватара/селектора «Сотрудник» */
interface CollaboratorInfo {
  /** ID пользователя (telegram_users.id) */
  userId: number;
  /** Отображаемое имя */
  name: string;
  /** URL аватарки (может отсутствовать) */
  photoUrl?: string | null;
}

/**
 * Формирует отображаемое имя пользователя Telegram.
 * @param user - Запись пользователя (firstName/lastName/username) или undefined
 * @param userId - ID пользователя для запасного варианта имени
 * @returns Человекочитаемое имя коллаборатора
 */
function buildDisplayName(
  user: { firstName?: string | null; lastName?: string | null; username?: string | null } | undefined,
  userId: number,
): string {
  if (user) {
    const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    if (full) return full;
    if (user.username) return `@${user.username}`;
  }
  return `Пользователь #${userId}`;
}

/**
 * Возвращает список коллабораторов проекта (`CollaboratorInfo[]`): владелец и
 * приглашённые участники с именем и аватаркой, без дублей.
 *
 * @route GET /api/projects/:projectId/collaborators
 * @param req - Запрос с projectId в params
 * @param res - Ответ: массив CollaboratorInfo
 */
export async function getCollaboratorsInfoHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: "Неверный projectId" });
      return;
    }

    const project = await storage.getBotProject(projectId);
    if (!project) {
      res.status(404).json({ message: "Проект не найден" });
      return;
    }

    // Уникальные ID участников: владелец проекта + коллабораторы.
    const collaborators = await storage.getCollaborators(projectId);
    const userIds = new Set<number>();
    if (typeof project.ownerId === "number") userIds.add(project.ownerId);
    for (const collab of collaborators) {
      if (typeof collab.userId === "number") userIds.add(collab.userId);
    }

    // Резолвим имя/аватар по каждому участнику (N невелико — список команды).
    const items: CollaboratorInfo[] = await Promise.all(
      Array.from(userIds).map(async (userId) => {
        const user = await storage.getTelegramUser(userId);
        return {
          userId,
          name: buildDisplayName(user, userId),
          photoUrl: user?.photoUrl ?? null,
        };
      }),
    );

    res.json(items);
  } catch (error) {
    console.error("Ошибка получения коллабораторов проекта:", error);
    res.status(500).json({ message: "Не удалось получить коллабораторов" });
  }
}
