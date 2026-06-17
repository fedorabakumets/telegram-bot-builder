/**
 * Тесты стека предыдущих видов холста
 * Запуск: npx tsx client/components/editor/canvas/tests/canvas-view-history.test.ts
 */
export {};

import {
  createCanvasViewState,
  pushCanvasViewState,
  popCanvasViewState,
} from '../canvas/use-canvas-view-history';

let passed = 0;
let failed = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`  ✗ ${label}\n    ${message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

console.log('canvas-view-history');

test('createCanvasViewState копирует pan', () => {
  const pan = { x: 10, y: 20 };
  const state = createCanvasViewState(pan, 75);
  pan.x = 999;
  assert(state.pan.x === 10, 'pan должен быть скопирован');
  assert(state.zoom === 75, 'zoom сохраняется');
});

test('pushCanvasViewState добавляет элементы', () => {
  const stack = pushCanvasViewState([], createCanvasViewState({ x: 0, y: 0 }, 100), 8);
  assert(stack.length === 1, 'длина стека 1');
});

test('pushCanvasViewState обрезает до maxDepth', () => {
  let stack: ReturnType<typeof createCanvasViewState>[] = [];
  for (let i = 0; i < 10; i++) {
    stack = pushCanvasViewState(stack, createCanvasViewState({ x: i, y: 0 }, 100), 3);
  }
  assert(stack.length === 3, 'стек обрезан до 3');
  assert(stack[0].pan.x === 7, 'удалены самые старые записи');
  assert(stack[2].pan.x === 9, 'последняя запись сохранена');
});

test('popCanvasViewState возвращает LIFO', () => {
  let stack = pushCanvasViewState([], createCanvasViewState({ x: 1, y: 0 }, 50), 8);
  stack = pushCanvasViewState(stack, createCanvasViewState({ x: 2, y: 0 }, 60), 8);
  const [afterFirst, first] = popCanvasViewState(stack);
  assert(first?.pan.x === 2 && first.zoom === 60, 'последний push извлекается первым');
  const [, second] = popCanvasViewState(afterFirst);
  assert(second?.pan.x === 1, 'следующий уровень');
});

test('popCanvasViewState на пустом стеке', () => {
  const [stack, restored] = popCanvasViewState([]);
  assert(stack.length === 0, 'стек пуст');
  assert(restored === null, 'ничего не восстанавливается');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
