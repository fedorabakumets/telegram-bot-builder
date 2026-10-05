/**
 * @fileoverview Проекты общего воркера, чьи каталоги uploads можно монтировать.
 * Без изоляции список не строится: вызывающий оставляет прежнее монтирование всего uploads.
 * @module server/bots/workerSharedProjects
 */

/**
 * Оставляет уникальные положительные ID проектов в порядке появления.
 * Ноль — ключ общего воркера, не каталог uploads.
 * @param launchProjectId - Проект запускаемого бота
 * @param memberProjectIds - Проекты ботов, которые уже будут в этом воркере
 * @returns ID каталогов uploads; пустой массив, если проектов нет
 */
export function sharedUploadProjectIds(
  launchProjectId: number,
  memberProjectIds: readonly number[] = [],
): number[] {
  const ids: number[] = [];
  const seen = new Set<number>();
  for (const id of [launchProjectId, ...memberProjectIds]) {
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Проекты uploads общего воркера.
 * Без изоляции возвращает null: монтируется весь каталог, как раньше.
 * С изоляцией — только проекты, которые попадут в этот воркер, включая пустой список.
 * @param isolate - Включён ли WORKER_DOCKER_ISOLATE
 * @param launchProjectId - Проект запускаемого бота
 * @param memberProjectIds - Проекты ботов, которые уже будут в воркере
 * @returns null или список ID
 */
export function selectSharedUploadProjects(
  isolate: boolean,
  launchProjectId: number,
  memberProjectIds: readonly number[] = [],
): number[] | null {
  if (!isolate) return null;
  return sharedUploadProjectIds(launchProjectId, memberProjectIds);
}

/**
 * Собирает проекты активных токенов воркера (их боты переносятся в новый контейнер)
 * @param tokenIds - Токены, которые сейчас работают в воркере
 * @param projectIdOf - Проект токена, если он известен
 * @returns ID проектов этих токенов
 */
export function projectIdsOfTokens(
  tokenIds: Iterable<number>,
  projectIdOf: (tokenId: number) => number | undefined,
): number[] {
  const ids: number[] = [];
  for (const tokenId of tokenIds) {
    const id = projectIdOf(tokenId);
    if (id !== undefined) ids.push(id);
  }
  return ids;
}
