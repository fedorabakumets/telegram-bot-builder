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
  /** Режим: "text" — шаблон, "expression" — арифметическое выражение, "random" — случайное число, "random_item" — случайный элемент из списка, "array_item" — элемент массива/объекта по индексу/ключу, "timestamp" — временная метка, "format_duration" — форматирование секунд в MM:SS, "regex_extract" — извлечение по регулярке, "extract_number" — первое число из строки, "split_get" — разделить и взять N-й элемент, "json_get" — значение из JSON по пути, "substring" — подстрока */
  mode: 'text' | 'expression' | 'random' | 'random_item' | 'array_item' | 'timestamp' | 'format_duration' | 'format_number' | 'regex_extract' | 'extract_number' | 'split_get' | 'json_get' | 'substring';
  /** Максимальное значение для mode=random */
  maxValue?: string;
  /** Регулярное выражение для mode=regex_extract */
  pattern?: string;
  /** Номер группы захвата для mode=regex_extract (по умолчанию "0" — всё совпадение) */
  regexGroup?: string;
  /** Разделитель для split_get */
  separator?: string;
  /** Путь для json_get (dot notation) */
  jsonPath?: string;
  /** Начальный индекс для substring */
  startIndex?: string;
  /** Конечный индекс для substring */
  endIndex?: string;
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
