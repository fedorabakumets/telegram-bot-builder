/** @fileoverview Показывает параметры Docker только для контейнерных воркеров. */
import type { RuntimeFieldView } from './runtime-types';

/** Определяет, нужно ли отображать поле настроек в выбранной среде. */
export function showRuntimeField(group: string, field: RuntimeFieldView, runtime: string): boolean {
  if (group !== 'workers' || runtime === 'docker') return true;
  return !field.env.startsWith('WORKER_DOCKER_')
    && field.env !== 'WORKER_MEMORY_LIMIT'
    && field.env !== 'WORKER_CPUS';
}
