/** @fileoverview Проверка подсчёта вложений в списке блоков. */
import { describe, expect, it } from 'vitest';
import { countNodeMedia } from '../panel/node-media-summary';

describe('Количество медиа блока', () => {
  it('считает разные виды медиа и исключает дубли старых полей', () => {
    expect(countNodeMedia({ attachedMedia: ['/a.jpg', '/b.mp4', '/a.jpg'], imageUrl: '/a.jpg', audioUrl: '/c.mp3' })).toBe(3);
  });
  it('игнорирует пустые и повреждённые значения', () => {
    expect(countNodeMedia({ attachedMedia: ['', ' ', null, 1], videoUrl: ' ' })).toBe(0);
    expect(countNodeMedia({})).toBe(0);
  });
});
