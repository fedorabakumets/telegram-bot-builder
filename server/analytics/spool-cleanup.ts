/** @fileoverview Очистка приватной локальной очереди только после удаления проекта или бота из PostgreSQL. */
import { lstat, realpath, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';

/** Проверяет, что абсолютная цель находится внутри настроенного каталога очереди. */
function within(root: string, target: string): boolean {
  const path = relative(root, target);
  return !!path && !path.startsWith('..') && !isAbsolute(path);
}

/**
 * Удаляет только очередь подтверждённо удалённой области; не следует ссылкам за пределы корня.
 * @param projectId - Числовой ID удалённого проекта.
 * @param tokenId - ID удалённого бота; без него очищается проект.
 * @param configuredRoot - Постоянный каталог, общий с Python-рантаймом.
 * @returns Завершение очистки; отсутствующий каталог уже считается очищенным.
 */
export async function deleteAnalyticsSpool(projectId: number, tokenId?: number, configuredRoot = process.env.ANALYTICS_SPOOL_DIR || join(homedir(), '.botcraft', 'analytics-spool')): Promise<void> {
  if (!Number.isSafeInteger(projectId) || projectId <= 0 || (tokenId !== undefined && (!Number.isSafeInteger(tokenId) || tokenId <= 0))) throw new Error('Некорректная область очереди');
  const root = resolve(configuredRoot), target = resolve(root, String(projectId), ...(tokenId === undefined ? [] : [String(tokenId)]));
  if (!within(root, target)) throw new Error('Каталог очереди выходит за настроенную область');
  try {
    const stat = await lstat(target);
    if (stat.isSymbolicLink()) throw new Error('Очередь не должна быть символической ссылкой');
    const realRoot = await realpath(root), realTarget = await realpath(target);
    if (!within(realRoot, realTarget)) throw new Error('Реальный каталог очереди выходит за настроенную область');
    await rm(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
}
