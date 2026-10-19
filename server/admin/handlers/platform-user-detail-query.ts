/**
 * @fileoverview Запрос карточки аккаунта платформы
 * @module server/admin/handlers/platform-user-detail-query
 */

import {
  botProjects,
  projectCollaborators,
  telegramUsers,
} from "@shared/schema";
import type {
  PlatformUserDetailResponse,
  PlatformUserProfile,
  PlatformUserProjectSummary,
  PlatformUserSharedProjectSummary,
} from "@shared/admin/platform-users.types";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../database/db";
import { listSessions } from "../../auth/session-registry";

/** Псевдоним таблицы владельца проекта */
const ownerUser = alias(telegramUsers, "owner_user");

/**
 * Преобразует дату в ISO-строку
 * @param value - Значение из базы
 * @returns ISO или null
 */
function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Формирует отображаемое имя владельца
 * @param firstName - Имя
 * @param lastName - Фамилия
 * @param username - Имя вида @name
 * @param id - Опознаватель
 * @returns Строка для UI
 */
function formatDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  username: string | null | undefined,
  id: number | null | undefined,
): string {
  if (username) return `@${username.replace(/^@/, "")}`;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (id != null) return String(id);
  return "—";
}

/**
 * Загружает карточку аккаунта по опознавателю
 * @param userId - Опознаватель Telegram
 * @returns Карточка или null, если запись не найдена
 */
export async function queryPlatformUserDetail(
  userId: number,
): Promise<PlatformUserDetailResponse | null> {
  const [userRow] = await db
    .select({
      id: telegramUsers.id,
      firstName: telegramUsers.firstName,
      lastName: telegramUsers.lastName,
      username: telegramUsers.username,
      photoUrl: telegramUsers.photoUrl,
      createdAt: telegramUsers.createdAt,
      updatedAt: telegramUsers.updatedAt,
    })
    .from(telegramUsers)
    .where(eq(telegramUsers.id, userId))
    .limit(1);

  if (!userRow) return null;

  const user: PlatformUserProfile = {
    id: userRow.id,
    firstName: userRow.firstName,
    lastName: userRow.lastName,
    username: userRow.username,
    photoUrl: userRow.photoUrl,
    createdAt: toIso(userRow.createdAt),
    updatedAt: toIso(userRow.updatedAt),
  };

  const ownedRows = await db
    .select({
      id: botProjects.id,
      name: botProjects.name,
      createdAt: botProjects.createdAt,
      updatedAt: botProjects.updatedAt,
    })
    .from(botProjects)
    .where(eq(botProjects.ownerId, userId))
    .orderBy(asc(botProjects.name));

  const ownedProjects: PlatformUserProjectSummary[] = ownedRows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }));

  const ownerUserTable = ownerUser;
  const sharedRows = await db
    .select({
      id: botProjects.id,
      name: botProjects.name,
      createdAt: botProjects.createdAt,
      updatedAt: botProjects.updatedAt,
      ownerId: botProjects.ownerId,
      ownerFirstName: ownerUserTable.firstName,
      ownerLastName: ownerUserTable.lastName,
      ownerUsername: ownerUserTable.username,
    })
    .from(projectCollaborators)
    .innerJoin(botProjects, eq(projectCollaborators.projectId, botProjects.id))
    .leftJoin(ownerUserTable, eq(botProjects.ownerId, ownerUserTable.id))
    .where(eq(projectCollaborators.userId, userId))
    .orderBy(asc(botProjects.name));

  const sharedProjects: PlatformUserSharedProjectSummary[] = sharedRows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    ownerId: row.ownerId,
    ownerDisplayName: formatDisplayName(
      row.ownerFirstName,
      row.ownerLastName,
      row.ownerUsername,
      row.ownerId,
    ),
  }));

  const sessions = (await listSessions(userId, "")).map(({ sessionId: _sessionId, isCurrent: _isCurrent, ...session }) => ({
    ...session,
    ip: session.ip ?? null,
  }));

  return { user, ownedProjects, sharedProjects, sessions };
}
