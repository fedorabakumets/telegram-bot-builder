/**
 * @fileoverview Параметры шаблона set-variable
 * @module templates/set-variable/set-variable.params
 */

/** Одно присваивание переменной */
export interface SetVariableAssignment {
  /** Уникальный идентификатор присваивания */
  id: string;
  /** Имя переменной для записи */
  variable: string;
  /** Значение или шаблон с {переменными} */
  value: string;
  /** Режим: "text" — шаблон, "expression" — арифметическое выражение */
  mode: 'text' | 'expression';
}

/** Параметры для генерации кода узла set_variable */
export interface SetVariableTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Список присваиваний переменных */
  assignments: SetVariableAssignment[];
  /** ID следующего узла для автоперехода (пустая строка если нет) */
  autoTransitionTo: string;
}
