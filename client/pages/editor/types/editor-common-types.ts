/**
 * @fileoverview Общие типы редактора
 *
 * Базовые типы и константы для компонента Editor.
 *
 * @module EditorCommonTypes
 */

/** Максимальное количество строк кода для отображения */
export const MAX_VISIBLE_LINES = 1000;

/** Максимальное количество элементов в истории действий */
export const MAX_HISTORY_ITEMS = 50;

/**
 * Тип вкладки редактора
 */
export type EditorTab =
  | 'editor'
  | 'bot'
  | 'users'
  | 'user-ids'
  | 'client-api'
  | 'groups'
  | 'export'
  | 'preview';

/**
 * Тип предыдущей вкладки
 */
export type PreviousEditorTab = EditorTab | 'code';
