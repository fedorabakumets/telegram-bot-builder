/**
 * @fileoverview Перенос сохранённых сборок ботов в другое хранилище (например, с локальной папки в S3)
 * @module server/bots/builds/moveBotBuilds
 */

import type { BotBuild } from "@shared/schema";
import type { StorageBackend } from "../../storage/storage-backend";
import { readStreamToBuffer, unpackBotBuild } from "./botBuildCodec";

/** Зависимости переноса */
export interface MoveBotBuildsDeps {
  /** Сборки вне целевого хранилища */
  listOutside(configId: string): Promise<BotBuild[]>;
  /** Переключить запись сборки на хранилище */
  setStorage(id: number, configId: string): Promise<void>;
  /** Хранилище по ID */
  resolveBackend(configId: string): Promise<StorageBackend | null>;
}

/** Параметры переноса */
export interface MoveBotBuildsOptions {
  /** Только показать, что будет перенесено */
  dryRun?: boolean;
  /** Не удалять объект из исходного хранилища */
  keepSource?: boolean;
  /** Колбэк для лога по каждой сборке */
  log?: (message: string) => void;
}

/** Итог переноса */
export interface MoveBotBuildsResult {
  /** Перенесено сборок */
  moved: number;
  /** Пропущено из-за ошибок */
  failed: number;
  /** Всего кандидатов */
  total: number;
}

/**
 * Переносит сборки в целевое хранилище: копия с проверкой sha256 → запись в БД → удаление исходника.
 * Сбой на любом шаге оставляет сборку рабочей: строка переключается только после успешной записи.
 * @param targetId - ID целевого хранилища
 * @param deps - Таблица и хранилища
 * @param options - Пробный прогон, сохранение исходника, лог
 * @returns Счётчики перенесённых и пропущенных сборок
 * @throws Если целевое хранилище не найдено или только для чтения
 */
export async function moveBotBuilds(
  targetId: string,
  deps: MoveBotBuildsDeps,
  options: MoveBotBuildsOptions = {},
): Promise<MoveBotBuildsResult> {
  const log = options.log ?? (() => {});
  const target = await deps.resolveBackend(targetId);
  if (!target) throw new Error(`Целевое хранилище "${targetId}" не найдено`);
  if (target.readOnly) throw new Error(`Целевое хранилище "${targetId}" доступно только для чтения`);

  const builds = await deps.listOutside(targetId);
  const result: MoveBotBuildsResult = { moved: 0, failed: 0, total: builds.length };

  for (const build of builds) {
    const label = `сборка ${build.id} (токен ${build.tokenId}, ${build.storageConfigId} → ${targetId})`;
    if (options.dryRun) {
      log(`будет перенесена: ${label}`);
      continue;
    }
    try {
      const source = await deps.resolveBackend(build.storageConfigId);
      if (!source) throw new Error(`исходное хранилище "${build.storageConfigId}" не найдено`);
      const packed = await readStreamToBuffer(await source.get(build.objectKey));
      unpackBotBuild(packed, { size: build.size, sha256: build.sha256 });
      await target.put(build.objectKey, packed, "application/gzip");
      await deps.setStorage(build.id, targetId);
      if (!options.keepSource) await source.delete(build.objectKey);
      result.moved++;
      log(`перенесена: ${label}`);
    } catch (error) {
      result.failed++;
      log(`ошибка: ${label}: ${(error as Error)?.message ?? error}`);
    }
  }
  return result;
}
