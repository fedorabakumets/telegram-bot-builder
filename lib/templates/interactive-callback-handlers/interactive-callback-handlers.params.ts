/**
 * @fileoverview Параметры шаблона interactive-callback-handlers
 * @module templates/interactive-callback-handlers/interactive-callback-handlers.params
 */

/** Параметры для генерации интерактивных callback-обработчиков */
export interface InteractiveCallbackHandlersTemplateParams {
  /** Inline узлы (с кнопками) */
  inlineNodes: any[];
  /** Set всех referenced ID узлов */
  allReferencedNodeIds: Set<string>;
  /** Set всех условных кнопок */
  allConditionalButtons: Set<string>;
  /** Все узлы проекта */
  nodes: any[];
  /** Все ID узлов */
  allNodeIds: string[];
  /** Соединения между узлами */
  connections: any[];
  /** Включена ли БД пользователей */
  userDatabaseEnabled: boolean;
  /** Карта медиа-переменных */
  mediaVariablesMap: Map<string, { type: string; variable: string }>;
  /** Функция обработки кнопок узлов */
  processNodeButtonsAndGenerateHandlers: (processedCallbacks: Set<string>) => void;
}
