/**
 * @fileoverview Экспорт хуков для управления листами
 *
 * Централизованный экспорт всех хуков для операций с листами:
 * - useSheetAdd - добавление нового листа
 * - useSheetDelete - удаление листа
 * - useSheetRename - переименование листа
 * - useSheetDuplicate - дублирование листа
 * - useSheetSelect - переключение между листами
 * - useSheetHandlers - объединённый хук для всех операций
 *
 * @module SheetsHooks
 */

export { useSheetAdd } from './use-sheet-add';
export { useSheetDelete } from './use-sheet-delete';
export { useSheetRename } from './use-sheet-rename';
export { useSheetDuplicate } from './use-sheet-duplicate';
export { useSheetSelect } from './use-sheet-select';
export { useSheetHandlers } from './use-sheet-handlers';
