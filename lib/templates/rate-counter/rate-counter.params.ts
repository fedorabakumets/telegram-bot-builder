/**
 * @fileoverview Параметры для шаблона узла rate_counter
 * @module templates/rate-counter/rate-counter.params
 */

/** Параметры одного узла rate_counter */
export interface RateCounterEntry {
  /** ID узла */
  nodeId: string;
  /** Ключ счётчика (поддерживает {переменные}) */
  counterKey: string;
  /** Размер окна в секундах (поддерживает {переменные}) */
  windowSeconds: string;
  /** Имя переменной для сохранения результата */
  saveResultTo: string;
  /** ID следующего узла */
  autoTransitionTo: string;
}

/** Параметры шаблона rate_counter */
export interface RateCounterTemplateParams {
  /** Массив узлов rate_counter */
  rateCounterEntries: RateCounterEntry[];
}
