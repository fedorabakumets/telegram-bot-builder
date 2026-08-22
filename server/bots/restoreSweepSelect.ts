/**
 * @fileoverview Чистый выбор кандидатов контрольного прохода restore (без БД).
 * @module server/bots/restoreSweepSelect
 */

/** Маркер graceful shutdown / деплоя */
export const SERVER_RESTART_MARKER = '__server_restart__';

export interface SweepInstanceInput {
  id: number;
  projectId: number;
  tokenId: number | null;
  status: string;
  errorMessage?: string | null;
  isActive?: number | null;
}

/**
 * Выбирает инстансы для контрольного подъёма.
 * Не трогает ручной stop и неактивные токены.
 *
 * @param instances - Инстансы + опциональный isActive токена
 * @param isActuallyRunning - Жив ли процесс/воркер для tokenId
 * @param failedTokenIds - Токены, упавшие на всех попытках основного restore
 */
export function selectSweepCandidates(
  instances: SweepInstanceInput[],
  isActuallyRunning: (tokenId: number) => boolean,
  failedTokenIds: ReadonlySet<number> = new Set(),
): SweepInstanceInput[] {
  const out: SweepInstanceInput[] = [];

  for (const inst of instances) {
    if (inst.tokenId == null) continue;
    if (inst.isActive === 0) continue;

    const tokenId = inst.tokenId;
    const hasMarker = inst.errorMessage === SERVER_RESTART_MARKER;
    const wasFailed = failedTokenIds.has(tokenId);
    const phantomRunning =
      inst.status === 'running' && !isActuallyRunning(tokenId);

    // Ручной stop без маркера и не из списка неудач — не трогаем
    if (inst.status === 'stopped' && !hasMarker && !wasFailed) {
      continue;
    }

    if (phantomRunning || hasMarker || wasFailed) {
      if (isActuallyRunning(tokenId)) continue;
      out.push(inst);
    }
  }

  return out;
}
