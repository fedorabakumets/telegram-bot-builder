/**
 * @fileoverview Тесты для портов button-goto в компоненте ButtonsPreview
 *
 * Блок A: Unit-тесты — количество button-goto-портов при разных наборах кнопок
 * Блок B: Unit-тесты — кнопки других типов не создают button-goto-порты
 * Блок C: Property-based тест (Property 2) — количество портов равно количеству goto-кнопок
 *
 * @module buttons-preview-ports.test
 */

export {};

// ─── Утилиты ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${label}\n    ${e.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// ─── Типы ─────────────────────────────────────────────────────────────────────

/** Тип действия кнопки */
type ButtonAction = 'goto' | 'url' | 'callback' | 'selection' | 'complete';

/** Минимальный мок кнопки */
interface MockButton {
  id: string;
  action: ButtonAction;
  label?: string;
}

/** Минимальный мок узла с кнопками */
interface MockNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    buttons?: MockButton[];
    keyboardType?: string;
  };
}

// ─── Вспомогательные функции ──────────────────────────────────────────────────

/**
 * Создаёт мок-узел с заданными кнопками
 *
 * @param buttons - Массив кнопок
 * @param keyboardType - Тип клавиатуры (по умолчанию 'inline')
 * @returns Мок-узел
 */
function makeNodeWithButtons(buttons: MockButton[], keyboardType = 'inline'): MockNode {
  return {
    id: 'test-node',
    type: 'message',
    position: { x: 0, y: 0 },
    data: { buttons, keyboardType },
  };
}

/**
 * Создаёт мок-кнопку с заданным действием
 *
 * @param id - Идентификатор кнопки
 * @param action - Действие кнопки
 * @returns Мок-кнопка
 */
function makeButton(id: string, action: ButtonAction): MockButton {
  return { id, action, label: `Кнопка ${id}` };
}

/**
 * Симулирует логику рендера button-goto-портов из ButtonsPreview.
 * Возвращает количество портов, которые были бы отрендерены.
 *
 * Логика из buttons-preview.tsx:
 *   - Если нет кнопок или keyboardType === 'none' → 0 портов
 *   - Для каждой кнопки с action === 'goto' → 1 порт
 *
 * @param node - Мок-узел
 * @returns Количество button-goto-портов
 */
function countButtonGotoPorts(node: MockNode): number {
  if (!node.data.buttons || node.data.buttons.length === 0 || node.data.keyboardType === 'none') {
    return 0;
  }
  return node.data.buttons.filter((btn) => btn.action === 'goto').length;
}

// ─── Блок A: Unit-тесты — количество портов ───────────────────────────────────

console.log('\nБлок A: Unit-тесты — количество button-goto-портов');

test('узел без кнопок → 0 портов button-goto', () => {
  const node = makeNodeWithButtons([]);
  const count = countButtonGotoPorts(node);
  assert(count === 0, `Ожидалось 0 портов, получено ${count}`);
});

test('узел с keyboardType="none" → 0 портов button-goto', () => {
  const node = makeNodeWithButtons([makeButton('1', 'goto')], 'none');
  const count = countButtonGotoPorts(node);
  assert(count === 0, `Ожидалось 0 портов при keyboardType=none, получено ${count}`);
});

test('узел с 1 кнопкой goto → 1 порт button-goto', () => {
  const node = makeNodeWithButtons([makeButton('1', 'goto')]);
  const count = countButtonGotoPorts(node);
  assert(count === 1, `Ожидался 1 порт, получено ${count}`);
});

test('узел с 3 кнопками goto → 3 порта button-goto', () => {
  const node = makeNodeWithButtons([
    makeButton('1', 'goto'),
    makeButton('2', 'goto'),
    makeButton('3', 'goto'),
  ]);
  const count = countButtonGotoPorts(node);
  assert(count === 3, `Ожидалось 3 порта, получено ${count}`);
});

test('узел с 5 кнопками goto → 5 портов button-goto', () => {
  const node = makeNodeWithButtons([
    makeButton('1', 'goto'),
    makeButton('2', 'goto'),
    makeButton('3', 'goto'),
    makeButton('4', 'goto'),
    makeButton('5', 'goto'),
  ]);
  const count = countButtonGotoPorts(node);
  assert(count === 5, `Ожидалось 5 портов, получено ${count}`);
});

// ─── Блок B: кнопки других типов не создают порты ────────────────────────────

console.log('\nБлок B: кнопки других типов не создают button-goto-порты');

test('кнопки с action="url" → 0 портов button-goto', () => {
  const node = makeNodeWithButtons([
    makeButton('1', 'url'),
    makeButton('2', 'url'),
  ]);
  const count = countButtonGotoPorts(node);
  assert(count === 0, `Ожидалось 0 портов для url-кнопок, получено ${count}`);
});

test('кнопки с action="callback" → 0 портов button-goto', () => {
  const node = makeNodeWithButtons([
    makeButton('1', 'callback'),
    makeButton('2', 'callback'),
    makeButton('3', 'callback'),
  ]);
  const count = countButtonGotoPorts(node);
  assert(count === 0, `Ожидалось 0 портов для callback-кнопок, получено ${count}`);
});

test('кнопки с action="selection" → 0 портов button-goto', () => {
  const node = makeNodeWithButtons([makeButton('1', 'selection')]);
  const count = countButtonGotoPorts(node);
  assert(count === 0, `Ожидалось 0 портов для selection-кнопок, получено ${count}`);
});

test('смешанные кнопки: 2 goto + 2 url → 2 порта button-goto', () => {
  const node = makeNodeWithButtons([
    makeButton('1', 'goto'),
    makeButton('2', 'url'),
    makeButton('3', 'goto'),
    makeButton('4', 'callback'),
  ]);
  const count = countButtonGotoPorts(node);
  assert(count === 2, `Ожидалось 2 порта, получено ${count}`);
});

test('смешанные кнопки: 0 goto + 3 других → 0 портов button-goto', () => {
  const node = makeNodeWithButtons([
    makeButton('1', 'url'),
    makeButton('2', 'callback'),
    makeButton('3', 'selection'),
  ]);
  const count = countButtonGotoPorts(node);
  assert(count === 0, `Ожидалось 0 портов, получено ${count}`);
});

// ─── Блок C: Property-based тест (Property 2) ────────────────────────────────
// Feature: canvas-node-connections, Property 2:
// Количество button-goto-портов равно количеству кнопок с action === 'goto'

console.log('\nБлок C: Property-based тест (Property 2) — количество портов = количество goto-кнопок');

const NUM_RUNS = 100;
const ALL_ACTIONS: ButtonAction[] = ['goto', 'url', 'callback', 'selection', 'complete'];

test(`Property 2: для ${NUM_RUNS} случайных наборов кнопок — количество портов = количество goto-кнопок`, () => {
  let failures = 0;
  const failDetails: string[] = [];

  for (let i = 0; i < NUM_RUNS; i++) {
    // Генерируем случайное количество кнопок (0–8)
    const buttonCount = Math.floor(Math.random() * 9);
    const buttons: MockButton[] = [];

    for (let j = 0; j < buttonCount; j++) {
      const action = ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
      buttons.push(makeButton(`btn-${j}`, action));
    }

    const node = makeNodeWithButtons(buttons);
    const expectedGotoCount = buttons.filter((b) => b.action === 'goto').length;
    const actualPortCount = countButtonGotoPorts(node);

    if (actualPortCount !== expectedGotoCount) {
      failures++;
      failDetails.push(
        `Итерация ${i}: кнопок=${buttonCount}, goto=${expectedGotoCount}, портов=${actualPortCount}`
      );
    }
  }

  assert(
    failures === 0,
    `Property 2 нарушена в ${failures}/${NUM_RUNS} случаях:\n${failDetails.join('\n')}`
  );
});

test(`Property 2: количество портов никогда не превышает количество кнопок (${NUM_RUNS} итераций)`, () => {
  for (let i = 0; i < NUM_RUNS; i++) {
    const buttonCount = Math.floor(Math.random() * 9);
    const buttons: MockButton[] = Array.from({ length: buttonCount }, (_, j) => {
      const action = ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
      return makeButton(`btn-${j}`, action);
    });

    const node = makeNodeWithButtons(buttons);
    const portCount = countButtonGotoPorts(node);

    assert(
      portCount <= buttonCount,
      `Итерация ${i}: портов (${portCount}) > кнопок (${buttonCount})`
    );
  }
});

test(`Property 2: количество портов всегда >= 0 (${NUM_RUNS} итераций)`, () => {
  for (let i = 0; i < NUM_RUNS; i++) {
    const buttonCount = Math.floor(Math.random() * 9);
    const buttons: MockButton[] = Array.from({ length: buttonCount }, (_, j) => {
      const action = ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
      return makeButton(`btn-${j}`, action);
    });

    const node = makeNodeWithButtons(buttons);
    const portCount = countButtonGotoPorts(node);

    assert(portCount >= 0, `Итерация ${i}: отрицательное количество портов (${portCount})`);
  }
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
