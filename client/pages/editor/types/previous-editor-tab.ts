/**
 * @fileoverview Тип предыдущих вкладок редактора
 *
 * Вкладки, которые могут быть сохранены как предыдущие.
 */

import type { EditorTab } from './editor-tab';

/** Предыдущие вкладки (без export и preview) */
export type PreviousEditorTab = Exclude<EditorTab, 'preview' | 'export'>;
