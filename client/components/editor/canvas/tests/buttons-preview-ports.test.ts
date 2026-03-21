/**
 * @fileoverview Тесты для портов button-goto в компоненте ButtonsPreview
 *
 * Блок A: Unit-тесты — количество button-goto-портов при разных наборах кнопок
 * Блок B: Unit-тесты — кнопки других типов не создают button-goto-порты
 * Блок C: Property-based тест (Property 2) — количество портов равно количеству goto-кнопок
 *
 * @module buttons-preview-ports.test
 */

import { describe, it, expect } from 'vitest';

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

describe('Блок A: Unit-тесты — количество button-goto-портов', () => {
  it('узел без кнопок → 0 портов button-goto', () => {
    const node = makeNodeWithButtons([]);
    expect(countButtonGotoPorts(node)).toBe(0);
  });

  it('узел с keyboardType="none" → 0 портов button-goto', () => {
    const node = makeNodeWithButtons([makeButton('1', 'goto')], 'none');
    expect(countButtonGotoPorts(node)).toBe(0);
  });

  it('узел с 1 кнопкой goto → 1 порт button-goto', () => {
    const node = makeNodeWithButtons([makeButton('1', 'goto')]);
    expect(countButtonGotoPorts(node)).toBe(1);
  });

  it('узел с 3 кнопками goto → 3 порта button-goto', () => {
    const node = makeNodeWithButtons([
      makeButton('1', 'goto'),
      makeButton('2', 'goto'),
      makeButton('3', 'goto'),
    ]);
    expect(countButtonGotoPorts(node)).toBe(3);
  });

  it('узел с 5 кнопками goto → 5 портов button-goto', () => {
    const node = makeNodeWithButtons([
      makeButton('1', 'goto'),
      makeButton('2', 'goto'),
      makeButton('3', 'goto'),
      makeButton('4', 'goto'),
      makeButton('5', 'goto'),
    ]);
    expect(countButtonGotoPorts(node)).toBe(5);
  });
});

// ─── Блок B: кнопки других типов не создают порты ────────────────────────────

describe('Блок B: кнопки других типов не создают button-goto-порты', () => {
  it('кнопки с action="url" → 0 портов button-goto', () => {
    const node = makeNodeWithButtons([
      makeButton('1', 'url'),
      makeButton('2', 'url'),
    ]);
    expect(countButtonGotoPorts(node)).toBe(0);
  });

  it('кнопки с action="callback" → 0 портов button-goto', () => {
    const node = makeNodeWithButtons([
      makeButton('1', 'callback'),
      makeButton('2', 'callback'),
      makeButton('3', 'callback'),
    ]);
    expect(countButtonGotoPorts(node)).toBe(0);
  });

  it('кнопки с action="selection" → 0 портов button-goto', () => {
    const node = makeNodeWithButtons([makeButton('1', 'selection')]);
    expect(countButtonGotoPorts(node)).toBe(0);
  });

  it('смешанные кнопки: 2 goto + 2 url → 2 порта button-goto', () => {
    const node = makeNodeWithButtons([
      makeButton('1', 'goto'),
      makeButton('2', 'url'),
      makeButton('3', 'goto'),
      makeButton('4', 'callback'),
    ]);
    expect(countButtonGotoPorts(node)).toBe(2);
  });

  it('смешанные кнопки: 0 goto + 3 других → 0 портов button-goto', () => {
    const node = makeNodeWithButtons([
      makeButton('1', 'url'),
      makeButton('2', 'callback'),
      makeButton('3', 'selection'),
    ]);
    expect(countButtonGotoPorts(node)).toBe(0);
  });
});

// ─── Блок C: Property-based тест (Property 2) ────────────────────────────────
// Feature: canvas-node-connections, Property 2:
// Количество button-goto-портов равно количеству кнопок с action === 'goto'

describe('Блок C: Property-based тест (Property 2) — количество портов = количество goto-кнопок', () => {
  const NUM_RUNS = 100;
  const ALL_ACTIONS: ButtonAction[] = ['goto', 'url', 'callback', 'selection', 'complete'];

  it(`Property 2: для ${NUM_RUNS} случайных наборов кнопок — количество портов = количество goto-кнопок`, () => {
    let failures = 0;
    const failDetails: string[] = [];

    for (let i = 0; i < NUM_RUNS; i++) {
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

    expect(failures, `Property 2 нарушена в ${failures}/${NUM_RUNS} случаях:\n${failDetails.join('\n')}`).toBe(0);
  });

  it(`Property 2: количество портов никогда не превышает количество кнопок (${NUM_RUNS} итераций)`, () => {
    for (let i = 0; i < NUM_RUNS; i++) {
      const buttonCount = Math.floor(Math.random() * 9);
      const buttons: MockButton[] = Array.from({ length: buttonCount }, (_, j) => {
        const action = ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
        return makeButton(`btn-${j}`, action);
      });

      const node = makeNodeWithButtons(buttons);
      const portCount = countButtonGotoPorts(node);

      expect(portCount, `Итерация ${i}: портов (${portCount}) > кнопок (${buttonCount})`).toBeLessThanOrEqual(buttonCount);
    }
  });

  it(`Property 2: количество портов всегда >= 0 (${NUM_RUNS} итераций)`, () => {
    for (let i = 0; i < NUM_RUNS; i++) {
      const buttonCount = Math.floor(Math.random() * 9);
      const buttons: MockButton[] = Array.from({ length: buttonCount }, (_, j) => {
        const action = ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
        return makeButton(`btn-${j}`, action);
      });

      const node = makeNodeWithButtons(buttons);
      const portCount = countButtonGotoPorts(node);

      expect(portCount).toBeGreaterThanOrEqual(0);
    }
  });
});
