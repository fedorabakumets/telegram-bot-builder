/**
 * @fileoverview Поиск ключа объекта в media_files по хранилищу и пути.
 * Запрос к БД передаётся снаружи, чтобы тесты прокси и /uploads не поднимали Postgres.
 * @module server/routes/media/registered-media-key
 */

import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { mediaFiles } from "@shared/schema";

/** Строка media_files, достаточная для проверки доступа к объекту */
export interface RegisteredMediaKey {
  /** Проект, которому принадлежит файл */
  projectId: number;
}

/**
 * Поиск зарегистрированного ключа.
 * null — строки с таким storageConfigId и filePath нет.
 */
export type MediaKeyQuery = (
  storageConfigId: string,
  filePath: string,
) => Promise<RegisteredMediaKey | null>;

/** Клиент drizzle панели. Контракт как у seedDefaultStorageConfigs */
type PanelDatabase = NodePgDatabase<Record<string, unknown>>;

/**
 * Создаёт запрос строки media_files по ID хранилища и ключу объекта.
 * @param database - Клиент drizzle; тесты подставляют свою функцию вместо этого запроса
 * @returns Функция поиска projectId
 */
export function createMediaKeyQuery(database: PanelDatabase): MediaKeyQuery {
  return async (storageConfigId, filePath) => {
    const rows = await database
      .select({ projectId: mediaFiles.projectId })
      .from(mediaFiles)
      .where(and(eq(mediaFiles.storageConfigId, storageConfigId), eq(mediaFiles.filePath, filePath)))
      .limit(1);
    return rows[0] ?? null;
  };
}

/**
 * Ищет ключ в рабочей БД. Импорт клиента ленивый: модуль можно грузить в тестах.
 * @param storageConfigId - ID хранилища (storage_configs.id)
 * @param filePath - Ключ объекта после uploadKeyFromPath
 * @returns Проект файла либо null, если строки нет
 */
export async function findRegisteredMediaKeyFromDb(
  storageConfigId: string,
  filePath: string,
): Promise<RegisteredMediaKey | null> {
  const { db } = await import("../../database/db");
  // Экземпляр db шире узкого контракта NodePgDatabase — тот же приём, что в реестре хранилищ
  return createMediaKeyQuery(db as unknown as PanelDatabase)(storageConfigId, filePath);
}
