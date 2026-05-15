/**
 * @fileoverview Параметры шаблона loop
 * @module templates/loop/loop.params
 */

/** Параметры одного узла loop */
export interface LoopEntry {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя для Python функции */
  safeName: string;
  /** Имя переменной с массивом */
  sourceVariable: string;
  /** Имя переменной для текущего элемента */
  itemVariable: string;
  /** Имя переменной для индекса */
  indexVariable: string;
  /** Параллельное выполнение */
  parallel: boolean;
  /** Задержка между итерациями (секунды) */
  delaySeconds: number;
  /** Максимум итераций (0 = без лимита) */
  maxIterations: number;
  /** ID ноды тела цикла */
  autoTransitionTo: string;
  /** Безопасное имя целевой ноды тела */
  autoTransitionToSafe: string;
  /** Существует ли целевая нода тела */
  autoTransitionTargetExists: boolean;
  /** ID ноды после цикла */
  afterLoopTo: string;
  /** Безопасное имя целевой ноды после цикла */
  afterLoopToSafe: string;
  /** Существует ли целевая нода после цикла */
  afterLoopTargetExists: boolean;
}

/** Параметры шаблона loop */
export interface LoopTemplateParams {
  /** Массив записей loop-нод */
  entries: LoopEntry[];
}
