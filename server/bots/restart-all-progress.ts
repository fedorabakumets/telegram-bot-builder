/** @fileoverview Прогресс и защита от параллельного пакетного перезапуска проекта. */
import type { TokenRestartResult } from './restartAllRunningBots';

/** Снимок этапов пакетного перезапуска без секретов токенов. */
export interface RestartAllProgress {
  /** Текущая стадия операции. */
  phase: 'stopping' | 'cooldown' | 'starting' | 'completed';
  /** Число ботов, отобранных для перезапуска. */
  total: number;
  /** Число ботов с окончательным исходом. */
  completed: number;
  /** Число подтверждённых остановок. */
  stopped: number;
  /** Число неудачных остановок. */
  stopFailed: number;
  /** Число завершённых попыток запуска. */
  attempted: number;
  /** Число успешных запусков. */
  restarted: number;
  /** Число окончательных ошибок остановки или запуска. */
  failed: number;
  /** Копии окончательных исходов по токенам. */
  results: TokenRestartResult[];
}

/** Необязательное наблюдение за выполнением пакетного перезапуска. */
export interface RestartAllOptions {
  /** Получает снимок после каждого завершённого этапа или токена. */
  onProgress?: (progress: RestartAllProgress) => void;
}

const activeProjects = new Set<number>();

/** Ошибка повторного запуска пакета для уже занятого проекта. */
export class RestartAllInProgressError extends Error {
  /** Создать понятное сообщение о занятом проекте. */
  constructor(projectId: number) {
    super(`Перезапуск ботов проекта ${projectId} уже выполняется`);
    this.name = 'RestartAllInProgressError';
  }
}

/** Проверить, выполняется ли пакет проекта в текущем процессе панели. */
export function isRestartAllRunning(projectId: number): boolean { return activeProjects.has(projectId); }

/** Захватить проект до первого ожидания; вызывающий обязан освободить в finally. */
export function admitRestartAll(projectId: number): () => void {
  if (activeProjects.has(projectId)) throw new RestartAllInProgressError(projectId);
  activeProjects.add(projectId);
  return () => { activeProjects.delete(projectId); };
}
