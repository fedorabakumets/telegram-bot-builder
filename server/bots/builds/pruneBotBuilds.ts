/**
 * @fileoverview Удаление старых сборок токена сверх лимита
 * @module server/bots/builds/pruneBotBuilds
 */

import type { BotBuildDeps } from "./botBuildDeps";

/**
 * Оставляет последние `keep` сборок токена, остальные удаляет из хранилища и таблицы.
 * Ошибка удаления объекта не мешает удалить строку: осиротевший объект безвреден.
 * @param tokenId - ID токена
 * @param keep - Сколько последних сборок оставить
 * @param deps - Таблица и хранилище
 * @returns Количество удалённых сборок
 */
export async function pruneBotBuilds(tokenId: number, keep: number, deps: BotBuildDeps): Promise<number> {
  const stale = (await deps.listBuilds(tokenId)).slice(Math.max(1, keep));
  if (stale.length === 0) return 0;

  for (const build of stale) {
    try {
      const backend = await deps.resolveBackend(build.storageConfigId);
      await backend?.delete(build.objectKey);
    } catch (error) {
      console.warn(
        `[BotBuilds] Не удалось удалить объект сборки ${build.id}: ${(error as Error)?.message ?? error}`,
      );
    }
  }
  await deps.deleteBuilds(stale.map((build) => build.id));
  return stale.length;
}
