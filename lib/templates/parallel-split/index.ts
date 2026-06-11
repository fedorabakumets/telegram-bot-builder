/**
 * @fileoverview Экспорт модуля parallel-split — параллельный запуск веток (fan-out)
 * @module templates/parallel-split/index
 */

export { collectParallelSplitEntries, generateParallelSplit, generateParallelSplitHandlers } from './parallel-split.renderer';
export { parallelSplitEntrySchema, parallelSplitBranchSchema } from './parallel-split.schema';
export type { ParallelSplitEntry, ParallelSplitBranchEntry, ParallelSplitTemplateParams } from './parallel-split.params';
