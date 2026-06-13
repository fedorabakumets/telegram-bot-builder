/**
 * @fileoverview Параметры шаблона parallel_split — параллельный запуск веток (fan-out)
 * @module templates/parallel-split/parallel-split.params
 */

/** Одна ветка параллельного запуска (только с существующей целью) */
export interface ParallelSplitBranchEntry {
  /** ID ветки (порта) */
  id: string;
  /** Подпись ветки для логов */
  label: string;
  /** ID целевой ноды ветки */
  target: string;
  /** Безопасное имя целевой ноды для Python функции */
  targetSafe: string;
  /** ID ноды-фоллбека при ошибке ветки (пустая строка если нет) */
  onErrorTarget: string;
  /** Безопасное имя ноды-фоллбека */
  onErrorTargetSafe: string;
  /** Существует ли нода-фоллбек */
  onErrorTargetExists: boolean;
}

/** Параметры одного узла parallel_split */
export interface ParallelSplitEntry {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя для Python функции */
  safeName: string;
  /** Ветки с существующими целевыми нодами */
  branches: ParallelSplitBranchEntry[];
  /** Лимит одновременных веток (0 = без лимита) */
  maxConcurrent: number;
  /** Ждать завершения всех веток перед выходом из обработчика */
  awaitAll: boolean;
  /** Не запускать повторно, пока предыдущий прогон пользователя не завершён */
  skipIfRunning: boolean;
  /** ID узла для автоперехода после запуска веток (пустая строка — без перехода) */
  autoTransitionTo?: string;
}

/** Параметры шаблона parallel_split */
export interface ParallelSplitTemplateParams {
  /** Массив записей parallel_split-нод */
  entries: ParallelSplitEntry[];
}
