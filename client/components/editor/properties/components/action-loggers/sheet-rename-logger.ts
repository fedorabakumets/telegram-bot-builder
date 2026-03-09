/**
 * @fileoverview Утилита для логирования переименования листа
 *
 * Фиксирует изменение названия листа.
 *
 * @module sheet-rename-logger
 */

/**
 * Параметры для логирования переименования листа
 */
export interface SheetRenameLogOptions {
  /** ID переименованного листа */
  sheetId: string;
  /** Старое название листа */
  oldName: string;
  /** Новое название листа */
  newName: string;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует переименование листа в историю действий
 *
 * @param {SheetRenameLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logSheetRename({
 *   sheetId: 'abc123',
 *   oldName: 'Лист 2',
 *   newName: 'Основной',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logSheetRename({ sheetId, oldName, newName, onActionLog }: SheetRenameLogOptions): void {
  onActionLog('sheet_rename', `Переименован лист "${oldName}" → "${newName}" (${sheetId})`);
}
