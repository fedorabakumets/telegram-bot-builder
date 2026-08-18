/**
 * @fileoverview Выбор dropEffect, совместимого с источником перетаскивания.
 * @module components/editor/properties/media/apply-compatible-drop-effect.test
 */

import { describe, it, expect } from 'vitest';
import { applyCompatibleDropEffect } from './apply-compatible-drop-effect';

/**
 * Собирает DataTransfer-заглушку с заданным effectAllowed.
 * @param effectAllowed - Что сообщает источник DnD
 * @returns Объект с полями effectAllowed и dropEffect
 */
function stub(effectAllowed: string): { effectAllowed: string; dropEffect: string } {
  return { effectAllowed, dropEffect: 'none' };
}

describe('applyCompatibleDropEffect', () => {
  it('не трогает none и uninitialized — иначе Chromium глушит drop', () => {
    const none = stub('none');
    applyCompatibleDropEffect(none as unknown as DataTransfer);
    expect(none.dropEffect).toBe('none');
    const raw = stub('uninitialized');
    applyCompatibleDropEffect(raw as unknown as DataTransfer);
    expect(raw.dropEffect).toBe('none');
  });

  it('ставит copy, если источник его разрешает', () => {
    const data = stub('copyMove');
    applyCompatibleDropEffect(data as unknown as DataTransfer);
    expect(data.dropEffect).toBe('copy');
  });

  it('ставит move, если copy недоступен', () => {
    const data = stub('move');
    applyCompatibleDropEffect(data as unknown as DataTransfer);
    expect(data.dropEffect).toBe('move');
  });
});
