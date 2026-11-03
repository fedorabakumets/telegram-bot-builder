/** @fileoverview Регрессии запоздавших подтверждённых снимков и смены проекта. */
import { describe, expect, it } from 'vitest';
import { acceptsCanvasOrder } from '../../shared/canvas-sync/revision-order';
import { isCanvasSyncMessage } from '../../shared/canvas-sync/canvas-sync-message';

describe('Порядок ревизий холста', () => {
  it('предпочитает ревизию времени доставки', () => {
    const previous = { projectId: 1, timestamp: 100, revision: 5 };
    expect(acceptsCanvasOrder(previous, { projectId: 1, timestamp: 200, revision: 4 })).toBe(false);
    expect(acceptsCanvasOrder(previous, { projectId: 1, timestamp: 50, revision: 6 })).toBe(true);
    expect(acceptsCanvasOrder(previous, { projectId: 1, timestamp: 200, revision: 5 })).toBe(false);
    expect(acceptsCanvasOrder(previous, { projectId: 2, timestamp: 10, revision: 0 })).toBe(true);
  });
  it('сохраняет порядок несохранённых черновиков и проверяет форму ревизии', () => {
    expect(acceptsCanvasOrder({ projectId: 1, timestamp: 100 }, { projectId: 1, timestamp: 99 })).toBe(false);
    const base = { type: 'canvas-sync', projectId: 1, tabId: 't', timestamp: 1, data: {} };
    expect(isCanvasSyncMessage(base)).toBe(true);
    expect(isCanvasSyncMessage({ ...base, revision: 2 })).toBe(true);
    expect(isCanvasSyncMessage({ ...base, revision: -1 })).toBe(false);
    expect(isCanvasSyncMessage({ ...base, revision: '2' })).toBe(false);
  });
});
