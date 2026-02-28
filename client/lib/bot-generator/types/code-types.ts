/**
 * @fileoverview Типы для карты кода
 * Определяет структуру для связи строк кода с узлами бота
 */

/** Диапазон строк кода, связанного с узлом */
export interface CodeNodeRange {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Номер начальной строки кода */
  startLine: number;
  /** Номер конечной строки кода */
  endLine: number;
}

/** Код вместе с картой узлов */
export interface CodeWithMap {
  /** Строковое представление кода */
  code: string;
  /** Массив диапазонов строк узлов */
  nodeMap: CodeNodeRange[];
}
