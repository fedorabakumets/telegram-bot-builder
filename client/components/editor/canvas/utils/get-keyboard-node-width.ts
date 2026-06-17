/**
 * @fileoverview Вычисление динамической ширины узла keyboard на холсте
 * @module components/editor/canvas/utils/get-keyboard-node-width
 */

import { Node } from '@/types/bot';
import { computeKeyboardNodeWidthFromRows, getKeyboardRows, KEYBOARD_NODE_MIN_WIDTH } from './get-keyboard-layout';
import { resolveKeyboardPreviewParams } from './resolve-keyboard-preview-buttons';

/**
 * Вычисляет ширину узла keyboard по раскладке и тексту кнопок.
 *
 * @param node - Узел типа `keyboard`
 * @returns Ширина узла в пикселях
 */
export function getKeyboardNodeWidth(node: Node): number {
  const params = resolveKeyboardPreviewParams(node);
  if (!params) {
    return KEYBOARD_NODE_MIN_WIDTH;
  }

  const rows = getKeyboardRows(
    params.previewButtons,
    params.keyboardLayout,
    params.defaultColumns,
  );

  return computeKeyboardNodeWidthFromRows(rows);
}
