/** @fileoverview Выделение неудачных доставок пользователям и доступным группам одного бота. */
import type { BroadcastResult } from '../types';

/**
 * Собирает уникальных получателей с прочими ошибками, исключая успехи и ограничения.
 * @param results - Результаты исходной рассылки
 * @param availableGroups - Telegram ID групп выбранного бота
 * @returns Раздельные списки пользователей и групп
 */
export function resolveRetryAudience(results: Pick<BroadcastResult, 'userId' | 'status'>[], availableGroups: string[]) {
  const owned = new Set(availableGroups);
  const excluded = new Set(results.filter((r) => r.status !== 'failed').map((r) => r.userId));
  const failed = [...new Set(results.filter((r) => r.status === 'failed' && !excluded.has(r.userId)).map((r) => r.userId))];
  return {
    userIds: failed.filter((id) => /^[1-9]\d*$/.test(id)),
    groupIds: failed.filter((id) => /^-[1-9]\d*$/.test(id) && owned.has(id)),
  };
}
