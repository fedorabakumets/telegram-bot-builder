/**
 * @fileoverview Утилита для логирования дублирования листа
 *
 * Фиксирует создание копии листа.
 *
 * @module sheet-duplicate-logger
 */

/**
 * Параметры для логирования дублирования листа
 */
export interface SheetDuplicateLogOptions {
  /** Название оригинального листа */
  originalName: string;
  /** Название нового листа (копии) */
  newName: string;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует дублирование листа в историю действий
 *
 * @param {SheetDuplicateLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logSheetDuplicate({
 *   originalName: 'Лист 1',
 *   newName: 'Лист 1 (копия)',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logSheetDuplicate({ originalName, newName, onActionLog }: SheetDuplicateLogOptions): void {
  onActionLog('sheet_duplicate', `Дублирован лист "${originalName}" → "${newName}"`);
}
