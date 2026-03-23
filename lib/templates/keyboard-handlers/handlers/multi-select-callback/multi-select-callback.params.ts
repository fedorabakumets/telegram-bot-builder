/**
 * @fileoverview Параметры для шаблона обработчика multi-select callback
 * @module templates/handlers/multi-select-callback/multi-select-callback.params
 */

/** Кнопка с pre-computed значениями для генерации */
export interface MultiSelectButton {
  /** ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: string;
  /** Target для перехода */
  target?: string;
  /** URL для action='url' */
  url?: string;
  /** Pre-computed значение для callback_data */
  value: string;
  /** Pre-computed обрезанное значение (последние 8 символов) */
  valueTruncated: string;
  /** Pre-computed escaped текст для f-string */
  escapedText: string;
  /** Pre-computed callback_data */
  callbackData: string;
}

/** Обычная кнопка (не selection) */
export interface RegularButton {
  /** ID кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: 'goto' | 'url' | 'command';
  /** Target для перехода */
  target?: string;
  /** URL для action='url' */
  url?: string;
}

/** Кнопка завершения */
export interface CompleteButton {
  /** Текст кнопки */
  text: string;
  /** Target для перехода */
  target: string;
}

/** Раскладка клавиатуры */
export interface KeyboardLayout {
  /** Ряды кнопок */
  rows: Array<{ buttonIds: string[] }>;
  /** Количество колонок */
  columns: number;
  /** Авто-раскладка */
  autoLayout: boolean;
}

/** Узел с множественным выбором */
export interface MultiSelectNode {
  /** ID узла */
  id: string;
  /** Короткий ID узла (pre-computed) */
  shortNodeId: string;
  /** Кнопки выбора (selection) */
  selectionButtons: MultiSelectButton[];
  /** Обычные кнопки (goto, url) */
  regularButtons: RegularButton[];
  /** Кнопка завершения */
  completeButton?: CompleteButton;
  /** Pre-computed callback_data для кнопки "Готово" */
  doneCallbackData?: string;
  /** Есть ли раскладка */
  hasKeyboardLayout?: boolean;
  /** Авто-раскладка */
  keyboardLayoutAuto?: boolean;
  /** Код для adjust() */
  adjustCode?: string;
  /** Общее количество кнопок */
  totalButtonsCount?: number;
}

/** Параметры для генерации обработчика multi-select callback */
export interface MultiSelectCallbackTemplateParams {
  /** Массив узлов с множественным выбором */
  multiSelectNodes: MultiSelectNode[];
  /** Массив всех ID узлов для генерации коротких ID */
  allNodeIds: string[];
  /** Уровень отступа (по умолчанию '    ') */
  indentLevel?: string;
}
