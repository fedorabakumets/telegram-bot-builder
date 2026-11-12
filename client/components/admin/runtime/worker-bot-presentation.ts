/** @fileoverview Русские подписи достоверных режимов и состояний ботов в мониторе. */
import type { WorkerBotRuntimeActivity, WorkerBotRuntimeMode } from '@shared/worker-bot-runtime';
/** Названия режимов без технических сокращений. */
const modes: Record<WorkerBotRuntimeMode, string> = {
  direct: 'Постоянная работа', ondemand: 'Сон сценария', process: 'Освобождение памяти',
};
/** Возвращает название режима или отсутствие подтверждённого измерения. */
export function workerBotMode(mode: WorkerBotRuntimeMode | null): string {
  return mode === null ? 'Не подтверждён' : modes[mode];
}
/** Названия фактических состояний сценария. */
const activities: Record<WorkerBotRuntimeActivity, string> = {
  active: 'Сценарий загружен', sleeping: 'Спит', waiting: 'Ожидает слот', starting: 'Запускается',
  stopped: 'Остановлен', error: 'Ошибка', unknown: 'Нет данных',
};
/** Показывает состояние без приравнивания регистрации к работающему сценарию. */
export function workerBotActivity(activity: WorkerBotRuntimeActivity): string { return activities[activity]; }
/** Выбирает спокойное оформление индикатора состояния. */
export function workerBotActivityClass(activity: WorkerBotRuntimeActivity): string {
  if (activity === 'active') return 'border-emerald-700/40 text-emerald-300';
  if (activity === 'error') return 'border-destructive/40 text-destructive';
  if (activity === 'starting' || activity === 'waiting') return 'border-amber-700/40 text-amber-200';
  return 'border-border text-muted-foreground';
}
