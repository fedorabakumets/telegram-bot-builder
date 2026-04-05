/**
 * @fileoverview Экспорт хуков редактора
 *
 * Централизованный экспорт всех хуков компонента Editor.
 *
 * @module EditorHooks
 */

// Хуки для управления листами
export { useSheetAdd } from './use-sheet-add';
export { useSheetDelete } from './use-sheet-delete';
export { useSheetRename } from './use-sheet-rename';
export { useSheetDuplicate } from './use-sheet-duplicate';
export { useSheetSelect } from './use-sheet-select';
export { useSheetHandlers } from './use-sheet-handlers';

// Хуки состояний
export { useEditorUIStates } from './use-editor-ui-states';
export { useSheetStates } from './use-sheet-states';
export { useCodeStates } from './use-code-states';

// Хуки обработчиков
export { useDialogHandlers } from './use-dialog-handlers';
export { useMobileHandlers } from './use-mobile-handlers';
export { useCodePanelHandlers } from './use-code-panel-handlers';

// Новые хуки
export { useApplyTemplate } from './use-apply-template';
export { useNodesSync } from './use-nodes-sync';
export { useNodeFocus } from './use-node-focus';
