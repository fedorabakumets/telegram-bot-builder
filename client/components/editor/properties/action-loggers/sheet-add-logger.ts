/**
 * @fileoverview Утилита для логирования добавления листа
 *
 * Фиксирует добавление нового листа в проект.
 *
 * @module sheet-add-logger
 */

/**
 * Параметры для логирования добавления листа
 */
export interface SheetAddLogOptions {
  /** Название добавленного листа */
  sheetName: string;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует добавление листа в историю действий
 *
 * @param {SheetAddLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logSheetAdd({
 *   sheetName: 'Лист 2',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logSheetAdd({ sheetName, onActionLog }: SheetAddLogOptions): void {
  onActionLog('sheet_add', `Добавлен лист "${sheetName}"`);
}
