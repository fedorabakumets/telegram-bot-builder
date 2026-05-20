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
  /** Режим: "text" — шаблон, "expression" — арифметическое выражение, "random" — случайное число, "random_item" — случайный элемент из списка, "array_item" — элемент массива/объекта по индексу/ключу, "timestamp" — временная метка, "format_duration" — форматирование секунд в MM:SS, "regex_extract" — извлечение по регулярке */
  mode: 'text' | 'expression' | 'random' | 'random_item' | 'array_item' | 'timestamp' | 'format_duration' | 'format_number' | 'regex_extract';
  /** Максимальное значение для mode=random */
  maxValue?: string;
  /** Регулярное выражение для mode=regex_extract */
  pattern?: string;
  /** Номер группы захвата для mode=regex_extract (по умолчанию "0" — всё совпадение) */
  regexGroup?: string;
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
