/**
 * @fileoverview Выбор «текущего» запуска с учётом live-статуса
 * @module bot/card/select-current-launch
 */

import type { BotLaunchHistory as LaunchRecord } from '@shared/schema';

/**
 * Выбирает карточку «Текущий» с учётом live-статуса.
 * Если бот онлайн, а в истории нет строки `running` (например sync закрыл launch
 * как «процесс не найден»), показываем последнюю запись как Онлайн — иначе
 * в «Текущий» остаётся ложный «Остановлен».
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
    if (running) {
      current = running;
    } else if (history[0]) {
      current = {
        ...history[0],
        status: 'running',
        stoppedAt: null,
        errorMessage: null,
      };
    } else {
      current = null;
    }
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
