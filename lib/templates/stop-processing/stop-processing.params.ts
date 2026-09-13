/**
 * @fileoverview Параметры для шаблона узла stop_processing
 * @module templates/stop-processing/stop-processing.params
 */

/** Параметры одного узла stop_processing */
export interface StopProcessingEntry {
  /** ID узла */
  nodeId: string;
  /** ID следующего узла */
  autoTransitionTo: string;
}

/** Параметры шаблона stop_processing */
export interface StopProcessingTemplateParams {
  /** Массив узлов stop_processing */
  stopProcessingEntries: StopProcessingEntry[];
}
