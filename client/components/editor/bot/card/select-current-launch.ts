/**
 * @fileoverview Выбор «текущего» запуска с учётом live-статуса
 * @module bot/card/select-current-launch
 */

import type { BotLaunchHistory as LaunchRecord } from '@shared/schema';

/**
 * Выбирает карточку «Текущий» с учётом live-статуса
 * @param history - Записи истории
 * @param isLiveRunning - Бот реально онлайн
 * @param compact - Лимит past
 * @returns current и past
 */
export function selectCurrentAndPast(
  history: LaunchRecord[],
  isLiveRunning: boolean,
  compact: boolean,
): { current: LaunchRecord | null; past: LaunchRecord[] } {
  const running = history.find((h) => h.status === 'running');
  let current: LaunchRecord | null;
  if (isLiveRunning) {
    current = running ?? history[0] ?? null;
  } else if (running) {
    current = { ...running, status: 'stopped', stoppedAt: running.stoppedAt ?? new Date() };
  } else {
    current = history[0] ?? null;
  }
  const past = current
    ? history.filter((h) => h.id !== current!.id).slice(0, compact ? 4 : 20)
    : [];
  return { current, past };
}
