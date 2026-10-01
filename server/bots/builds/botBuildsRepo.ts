/**
 * @fileoverview Доступ к таблице `bot_builds`
 * @module server/bots/builds/botBuildsRepo
 */

import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { botBuilds, type BotBuild, type InsertBotBuild } from "@shared/schema";
import { db } from "../../database/db";

/**
 * Ищет сборку токена по отпечатку.
 * @param tokenId - ID токена
 * @param fingerprint - Отпечаток генерации
 * @returns Запись сборки или null
 */
export async function findBotBuild(tokenId: number, fingerprint: string): Promise<BotBuild | null> {
  const rows = await db
    .select()
    .from(botBuilds)
    .where(and(eq(botBuilds.tokenId, tokenId), eq(botBuilds.fingerprint, fingerprint)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Вставляет сборку; при гонке за ту же пару (токен, отпечаток) ничего не делает.
 * @param build - Данные сборки
 * @returns true, если строка вставлена
 */
export async function insertBotBuild(build: InsertBotBuild): Promise<boolean> {
  const rows = await db
    .insert(botBuilds)
    .values(build)
    .onConflictDoNothing({ target: [botBuilds.tokenId, botBuilds.fingerprint] })
    .returning({ id: botBuilds.id });
  return rows.length > 0;
}

/**
 * Возвращает сборки токена, новые первыми.
 * @param tokenId - ID токена
 * @returns Список сборок
 */
export async function listBotBuilds(tokenId: number): Promise<BotBuild[]> {
  return db
    .select()
    .from(botBuilds)
    .where(eq(botBuilds.tokenId, tokenId))
    .orderBy(desc(botBuilds.createdAt), desc(botBuilds.id));
}

/**
 * Возвращает сборки, лежащие не в указанном хранилище (кандидаты на перенос).
 * @param configId - ID целевого хранилища
 * @returns Список сборок, старые первыми
 */
export async function listBotBuildsOutside(configId: string): Promise<BotBuild[]> {
  return db
    .select()
    .from(botBuilds)
    .where(ne(botBuilds.storageConfigId, configId))
    .orderBy(asc(botBuilds.id));
}

/**
 * Переключает запись сборки на другое хранилище.
 * @param id - ID сборки
 * @param configId - ID нового хранилища
 */
export async function setBotBuildStorage(id: number, configId: string): Promise<void> {
  await db.update(botBuilds).set({ storageConfigId: configId }).where(eq(botBuilds.id, id));
}

/**
 * Удаляет записи сборок по ID.
 * @param ids - ID сборок
 */
export async function deleteBotBuilds(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db.delete(botBuilds).where(inArray(botBuilds.id, ids));
}
