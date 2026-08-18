/**
 * @fileoverview Выставляет dropEffect, который источник DnD реально разрешает.
 * Иначе Windows/Telegram отменяют drop при copy vs move/none.
 * @module components/editor/properties/media/apply-compatible-drop-effect
 */

/**
 * Подбирает dropEffect под effectAllowed. При none/uninitialized ничего не ставит —
 * достаточно preventDefault, иначе Chromium глушит событие drop.
 * @param data - DataTransfer текущего dragover/drop
 * @returns void
 */
export function applyCompatibleDropEffect(data: DataTransfer): void {
  const allowed = String(data.effectAllowed || '').toLowerCase();
  if (!allowed || allowed === 'none' || allowed === 'uninitialized') return;
  if (allowed.includes('copy')) {
    data.dropEffect = 'copy';
    return;
  }
  if (allowed.includes('move')) {
    data.dropEffect = 'move';
    return;
  }
  if (allowed.includes('link')) data.dropEffect = 'link';
}
