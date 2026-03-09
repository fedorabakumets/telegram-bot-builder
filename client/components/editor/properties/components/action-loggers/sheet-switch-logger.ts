/**
 * @fileoverview Утилита для логирования переключения листа
 *
 * Фиксирует смену активного листа.
 *
 * @module sheet-switch-logger
 */

/**
 * Параметры для логирования переключения листа
 */
export interface SheetSwitchLogOptions {
  /** Название предыдущего активного листа */
  fromSheet?: string;
  /** Название нового активного листа */
  toSheet: string;
  /** Функция логирования действий */
  onActionLog: (type: string, description: string) => void;
}

/**
 * Логирует переключение листа в историю действий
 *
 * @param {SheetSwitchLogOptions} options - Параметры логирования
 *
 * @example
 * ```typescript
 * logSheetSwitch({
 *   fromSheet: 'Лист 1',
 *   toSheet: 'Лист 2',
 *   onActionLog: handleActionLog
 * });
 * ```
 */
export function logSheetSwitch({ fromSheet, toSheet, onActionLog }: SheetSwitchLogOptions): void {
  if (fromSheet) {
    onActionLog('sheet_switch', `Переключён лист "${fromSheet}" → "${toSheet}"`);
  } else {
    onActionLog('sheet_switch', `Активный лист: "${toSheet}"`);
  }
}
