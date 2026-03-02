/**
 * @fileoverview Тип предыдущих вкладок редактора
 *
 * Вкладки, которые могут быть сохранены как предыдущие.
 */

import type { EditorTab } from './editor-common-types';

/** Предыдущие вкладки (без export и preview) */
export type PreviousEditorTab = Exclude<EditorTab, 'preview' | 'export'>;
