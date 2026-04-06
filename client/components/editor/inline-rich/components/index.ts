/**
 * @fileoverview Публичный API компонентов inline-rich редактора
 */

export { Toolbar } from './Toolbar';
export type { ToolbarProps } from './Toolbar';

export { EditorContent } from './EditorContent';
export type { EditorContentProps } from './EditorContent';

export { StatsBar } from './StatsBar';
export type { StatsBarProps } from './StatsBar';

export { UsedVariablesList } from './UsedVariablesList';
export { FormattedText } from './FormattedText';
export type { FormattedTextProps } from './FormattedText';

export { VariablesMenu } from './VariablesMenu';
export type { VariablesMenuProps } from './VariablesMenu';

export { VariableFilterMenu } from './VariableFilterMenu';
export { VariableFilterToggle } from './VariableFilterToggle';
export { VariableMenuItem } from './variable-menu-item';

export { getMediaIcon, getBadgeText, getNodeInfo } from './variable-display-utils';
