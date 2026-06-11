/**
 * @fileoverview Типы для узла параллельного запуска веток (fan-out)
 *
 * Описывает структуру данных узла типа `parallel_split` —
 * одновременный запуск нескольких независимых веток сценария.
 *
 * @module shared/types/parallel-split-node
 */

/**
 * Одна ветка узла параллельного запуска
 */
export interface ParallelBranch {
  /** Уникальный идентификатор ветки (порта) */
  id: string;
  /** Подпись порта на холсте */
  label: string;
  /** ID стартовой ноды ветки */
  target?: string;
  /** ID ноды, запускаемой при ошибке ветки (фоллбек для паттерна сбора) */
  onErrorTarget?: string;
}

/**
 * Данные узла параллельного запуска
 */
export interface ParallelSplitNodeData {
  /** Список веток для одновременного запуска */
  parallelBranches: ParallelBranch[];
  /** Лимит одновременных веток (0 = без лимита) */
  maxConcurrent?: number;
  /** Ждать завершения всех веток перед выходом из обработчика */
  awaitAll?: boolean;
  /** Не запускать повторно, пока предыдущий прогон пользователя не завершён */
  skipIfRunning?: boolean;
}
