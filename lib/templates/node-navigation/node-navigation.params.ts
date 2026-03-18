/**
 * @fileoverview Параметры для шаблона навигации по узлам
 * @module templates/node-navigation/node-navigation.params
 */

/** Один целевой узел навигации */
export interface NavigationTargetNode {
  /** ID узла */
  id: string;
  /** Текст сообщения */
  messageText?: string;
  /** Прикреплённые медиа */
  attachedMedia?: string[];
  /** Включён ли автопереход */
  enableAutoTransition?: boolean;
  /** ID целевого узла автоперехода */
  autoTransitionTo?: string;
  /** Безопасное имя функции автоперехода */
  autoTransitionSafeName?: string;
  /** Собирать ли ввод */
  collectUserInput?: boolean;
  /** Автопереход найден среди узлов */
  autoTransitionExists?: boolean;
}

/** Параметры для генерации навигации */
export interface NodeNavigationParams {
  /** Целевые узлы */
  nodes: NavigationTargetNode[];
  /** Базовый отступ */
  baseIndent: string;
  /** Имя переменной с ID следующего узла */
  nextNodeIdVar: string;
  /** Имя переменной сообщения */
  messageVar: string;
  /** Имя переменной с данными пользователя */
  userVarsVar: string;
}
