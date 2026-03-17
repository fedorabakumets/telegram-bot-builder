/**
 * @fileoverview Параметры для шаблона обработки reply-ввода пользователя
 * @module templates/reply-input-handler/reply-input-handler.params
 */

/** Узел с командой */
export interface CommandNode {
  /** ID узла */
  id: string;
  /** Тип узла: 'start' | 'command' */
  type: string;
  /** Команда (например '/start', '/help') */
  command: string;
}

/** Узел графа (упрощённый) */
export interface GraphNode {
  /** ID узла */
  id: string;
  /** Безопасное имя (safe_name) */
  safeName: string;
}

/** Параметры шаблона */
export interface ReplyInputHandlerTemplateParams {
  /** Все узлы графа (для goto-навигации) */
  nodes: GraphNode[];
  /** Узлы с командами (start/command) */
  commandNodes: CommandNode[];
  /** Есть ли URL-кнопки в проекте */
  hasUrlButtons: boolean;
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
}
