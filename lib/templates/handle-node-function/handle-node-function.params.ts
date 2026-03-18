/**
 * @fileoverview Параметры для шаблона handle_node_* функций
 * @module templates/handle-node-function/handle-node-function.params
 */

/** Одно условное сообщение */
export interface ConditionalMessage {
  /** Имя переменной (одиночное) */
  variableName?: string;
  /** Имена переменных (множественное) */
  variableNames?: string[];
  /** Логический оператор: AND | OR */
  logicOperator?: 'AND' | 'OR';
  /** Условие */
  condition?: string;
  /** Текст сообщения при выполнении условия */
  messageText?: string;
  /** Приоритет */
  priority?: number;
}

/** Параметры для генерации одной handle_node_* функции */
export interface HandleNodeFunctionParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Безопасное имя функции (nodeId с заменёнными спецсимволами) */
  safeName: string;
  /** Текст сообщения */
  messageText?: string;
  /** Режим форматирования */
  formatMode?: string;
  /** URL изображения */
  imageUrl?: string;
  /** Прикреплённые медиафайлы */
  attachedMedia?: string[];
  /** Включены ли условные сообщения */
  enableConditionalMessages?: boolean;
  /** Список условных сообщений */
  conditionalMessages?: ConditionalMessage[];
  /** JSON-строка фильтров переменных */
  variableFiltersJson?: string;
  /** Включён ли автопереход */
  enableAutoTransition?: boolean;
  /** ID узла для автоперехода */
  autoTransitionTo?: string;
  /** Собирать ли пользовательский ввод */
  collectUserInput?: boolean;
  /** Тип ввода */
  inputType?: string;
  /** ID целевого узла для ввода */
  inputTargetNodeId?: string;
  /** Переменные используемые в тексте (для загрузки из БД) */
  usedVariables?: string[];
}

/** Параметры для генерации всех handle_node_* функций */
export interface HandleNodeFunctionsParams {
  /** Узлы для генерации */
  nodes: HandleNodeFunctionParams[];
}
