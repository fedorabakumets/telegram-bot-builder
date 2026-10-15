/**
 * @fileoverview Склейка задачи проверки доступов из API и WebSocket.
 * @module client/components/editor/analytics/analytics-access-check-merge
 */
import type {
  ChatAccessCheckJobView,
  ChatAccessCheckProgressPayload,
} from '@shared/project-sync/project-event';

/** Приоритет статуса: финальный не затирается более ранним событием. */
const STATUS_RANK: Record<string, number> = {
  pending: 1, running: 1, cancelling: 2, cancelled: 3, completed: 3, failed: 3,
};

/**
 * Склеивает задачу из API и более свежий WS-снимок.
 * @param current - Задача из кэша
 * @param progress - Событие WebSocket
 * @param projectId - Проект
 * @returns Актуальная карточка
 */
export function mergeJob(
  current: ChatAccessCheckJobView | null | undefined,
  progress: ChatAccessCheckProgressPayload,
  projectId: number,
): ChatAccessCheckJobView {
  if (!current || progress.jobId > current.jobId) {
    return { projectId, startedAt: null, finishedAt: null, ...progress };
  }
  if (current.jobId > progress.jobId) return current;
  if ((STATUS_RANK[current.status] ?? 0) > (STATUS_RANK[progress.status] ?? 0)) return current;
  if (progress.processedCount < current.processedCount) return current;
  return { ...current, ...progress, startedAt: current.startedAt, finishedAt: current.finishedAt };
}
