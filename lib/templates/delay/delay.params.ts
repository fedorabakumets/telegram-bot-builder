/**
 * @fileoverview Параметры шаблона delay
 * @module templates/delay/delay.params
 */

/** Параметры одного узла delay */
export interface DelayEntry {
  /** ID узла */
  nodeId: string;
  /** Значение задержки (поддерживает {переменные}) */
  seconds: string;
  /** Единица измерения: seconds, minutes, hours, days, weeks */
  unit: string;
  /** Режим: blocking — пауза, background — фоновый таймер */
  mode: 'blocking' | 'background';
  /** ID следующего узла для автоперехода */
  autoTransitionTo: string;
  /** Тип целевого узла */
  targetNodeType: string;
}

/** Параметры для генерации кода всех delay-узлов */
export interface DelayTemplateParams {
  /** Массив delay-узлов */
  entries: DelayEntry[];
}
