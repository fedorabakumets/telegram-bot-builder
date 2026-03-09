/**
 * @fileoverview Утилита для логирования удаления листа
 *
 * Фиксирует удаление листа из проекта.
 *
 * @module sheet-delete-logger
 */

/**
 * Параметры для логирования удаления листа
 */
export interface SheetDeleteLogOptions {
  /** Название удалённого листа */
  sheetName: string;
  /** ID удалённого листа */
  sheetId: string;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует удаление листа в историю действий
 *
 * @param {SheetDeleteLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logSheetDelete({
 *   sheetName: 'Лист 2',
 *   sheetId: 'abc123',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logSheetDelete({ sheetName, sheetId, onActionLog }: SheetDeleteLogOptions): void {
  onActionLog('sheet_delete', `Удалён лист "${sheetName}" (${sheetId})`);
}
