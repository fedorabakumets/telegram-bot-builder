/**
 * @fileoverview Проекты, чьи каталоги uploads видит Docker-воркер.
 * В режиме shared без изоляции список не строится (монтируется весь uploads).
 * С изоляцией в общий воркер попадают только проекты, которые в нём работают.
 * @module server/bots/resolveWorkerProjects
 */

import { storage } from "../storages/storage";
import { getWorkerGroupingMode } from "./workerGrouping";
import { isWorkerDockerIsolate } from "./workerDockerFlags";
import { selectSharedUploadProjects } from "./workerSharedProjects";

/**
 * Определяет проекты, чьи uploads видит воркер
 * @param workerKey - Ключ воркера
 * @param projectId - Проект запускаемого бота
 * @param memberProjectIds - Проекты ботов, которые уже будут в этом воркере
 * @returns ID проектов; null — общий воркер без изоляции (весь каталог uploads)
 */
export async function resolveWorkerProjects(
  workerKey: number,
  projectId: number,
  memberProjectIds: readonly number[] = [],
): Promise<number[] | null> {
  const mode = getWorkerGroupingMode();
  if (mode === "shared") {
    return selectSharedUploadProjects(isWorkerDockerIsolate(), projectId, memberProjectIds);
  }
  if (mode === "owner" && workerKey > 0) {
    const owned = await storage.getUserBotProjects(workerKey, { ignoreArchive: true });
    return [...new Set([projectId, ...owned.map((p) => p.id)])];
  }
  return [projectId];
}
