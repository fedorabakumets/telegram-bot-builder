/**
 * @fileoverview Тесты для перевода экранных координат canvas-редактора
 *
 * Проверяем, что расчет учитывает scroll контейнера, pan и zoom.
 */

import { screenPointToCanvasPoint } from '../canvas/utils/canvas-coordinate-utils';

const viewport = {
  left: 100,
  top: 200,
  scrollLeft: 350,
  scrollTop: 120,
};

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${label}\n  ${message}`);
    process.exitCode = 1;
  }
}

test('scroll-aware conversion keeps the point aligned', () => {
  const point = screenPointToCanvasPoint(450, 500, viewport, { x: 20, y: 30 }, 200);
  assert(point.x === 340, `ожидалось 340, получено ${point.x}`);
  assert(point.y === 195, `ожидалось 195, получено ${point.y}`);
});

test('conversion without pan and zoom matches viewport offsets', () => {
  const point = screenPointToCanvasPoint(450, 500, viewport, { x: 0, y: 0 }, 100);
  assert(point.x === 700, `ожидалось 700, получено ${point.x}`);
  assert(point.y === 420, `ожидалось 420, получено ${point.y}`);
});

test('zero scroll remains stable', () => {
  const point = screenPointToCanvasPoint(260, 340, { left: 10, top: 20, scrollLeft: 0, scrollTop: 0 }, { x: 0, y: 0 }, 100);
  assert(point.x === 250, `ожидалось 250, получено ${point.x}`);
  assert(point.y === 320, `ожидалось 320, получено ${point.y}`);
});
