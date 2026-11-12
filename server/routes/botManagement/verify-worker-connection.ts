/** @fileoverview Проверка связи с исполнителями перед показом сохранённой статистики. */
import { getProjectPlacement } from '../../bots/botPlacement';
import { RemoteRunnerHub } from '../../bots/remoteRunnerHub';
import { resolveRunnerRedisUrl } from '../../bots/resolveRunnerRedisUrl';

/**
 * Подтверждает доступность каждого удалённого исполнителя один раз за запрос.
 * @param projectIds - Проекты, доступные текущему пользователю.
 * @returns false, если хотя бы один исполнитель не ответил.
 */
export async function verifyWorkerConnection(projectIds: number[]): Promise<boolean> {
  const runners = new Set(projectIds.map(id => getProjectPlacement(id).runnerId).filter(Boolean));
  const results = await Promise.all([...runners].map(async runnerId => {
    try {
      const hub = await RemoteRunnerHub.get(runnerId!, resolveRunnerRedisUrl());
      await hub.inspect(1500);
      return true;
    } catch { return false; }
  }));
  return results.every(Boolean);
}
