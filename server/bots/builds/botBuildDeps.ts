/**
 * @fileoverview Зависимости операций со сборками (таблица + хранилище) — подменяются в тестах
 * @module server/bots/builds/botBuildDeps
 */

import type { BotBuild, InsertBotBuild } from "@shared/schema";
import type { StorageBackend } from "../../storage/storage-backend";

/** Набор зависимостей для сохранения, загрузки и чистки сборок */
export interface BotBuildDeps {
  /** Поиск сборки по токену и отпечатку */
  findBuild(tokenId: number, fingerprint: string): Promise<BotBuild | null>;
  /** Вставка сборки; false — такая уже есть */
  insertBuild(build: InsertBotBuild): Promise<boolean>;
  /** Сборки токена, новые первыми */
  listBuilds(tokenId: number): Promise<BotBuild[]>;
  /** Удаление записей сборок */
  deleteBuilds(ids: number[]): Promise<void>;
  /** Хранилище для записи новых сборок */
  getWritableBackend(): Promise<StorageBackend>;
  /** Хранилище по ID из записи сборки */
  resolveBackend(configId: string): Promise<StorageBackend | null>;
}

/**
 * Создаёт рабочие зависимости поверх БД и реестра хранилищ (ленивый импорт,
 * чтобы модули сборок можно было тестировать без подключения к БД).
 * @returns Зависимости по умолчанию
 */
export async function createDefaultBotBuildDeps(): Promise<BotBuildDeps> {
  const repo = await import("./botBuildsRepo");
  const backends = await import("./botBuildsBackend");
  return {
    findBuild: repo.findBotBuild,
    insertBuild: repo.insertBotBuild,
    listBuilds: repo.listBotBuilds,
    deleteBuilds: repo.deleteBotBuilds,
    getWritableBackend: backends.getWritableBotBuildsBackend,
    resolveBackend: backends.resolveBotBuildsBackend,
  };
}
