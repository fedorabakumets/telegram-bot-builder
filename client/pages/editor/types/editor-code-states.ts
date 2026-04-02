/**
 * @fileoverview Типы состояний кода
 *
 * Интерфейсы для управления состояниями кода в редакторе.
 *
 * @module EditorCodeStates
 */

import type { CodeFormat } from '@/components/editor/code/hooks';

/**
 * Состояния управления кодом
 */
export interface EditorCodeStates {
  /** Выбранный формат кода */
  selectedFormat: CodeFormat;
  /** Тема редактора */
  theme: 'light' | 'dark';
  /** Флаг сворачивания всех блоков */
  areAllCollapsed: boolean;
  /** Флаг показа полного кода */
  showFullCode: boolean;
  /** Флаг видимости редактора кода */
  codeEditorVisible: boolean;
  /** Флаг видимости панели кода */
  codePanelVisible: boolean;
}

/**
 * Статистика кода
 */
export interface CodeStats {
  /** Общее количество строк */
  totalLines: number;
  /** Флаг усечения */
  truncated: boolean;
  /** Количество функций */
  functions: number;
  /** Количество классов */
  classes: number;
  /** Количество комментариев */
  comments: number;
}
