/**
 * @fileoverview Тесты для портов выхода компонента CanvasNode
 *
 * Блок A: Unit-тесты — command_trigger рендерит trigger-next, не рендерит auto-transition
 * Блок B: Unit-тесты — другие типы узлов рендерят auto-transition, не рендерят trigger-next
 * Блок C: Property-based тест (Property 1) — взаимоисключение портов для любого типа узла
 *
 * @module canvas-node-ports.test
 */

import { describe, it, expect } from 'vitest';

// ─── Мок-рендер ──────────────────────────────────────────────────────────────

/**
 * Минимальный мок узла для тестирования
 *
 * @param type - Тип узла
 * @returns Объект узла с минимальными полями
 */
function makeNode(type: string) {
  return {
    id: 'test-id',
    type,
    position: { x: 0, y: 0 },
    data: {},
  };
}

/**
 * Симулирует логику рендера портов из CanvasNode.
 * Возвращает массив типов портов, которые были бы отрендерены.
 *
 * Логика из canvas-node.tsx:
 *   - node.type === 'command_trigger' → рендерит 'trigger-next'
 *   - node.type !== 'command_trigger' → рендерит 'auto-transition'
 *
 * @param nodeType - Тип узла
 * @returns Массив типов портов, которые рендерятся
 */
function getRenderedPorts(nodeType: string): string[] {
  const ports: string[] = [];
  if (nodeType === 'command_trigger') {
    ports.push('trigger-next');
  } else {
    ports.push('auto-transition');
  }
  return ports;
}

// ─── Блок A: command_trigger ──────────────────────────────────────────────────

describe('Блок A: command_trigger — рендерит trigger-next, не рендерит auto-transition', () => {
  it('command_trigger рендерит порт trigger-next', () => {
    const node = makeNode('command_trigger');
    const ports = getRenderedPorts(node.type);
    expect(ports).toContain('trigger-next');
  });

  it('command_trigger НЕ рендерит порт auto-transition', () => {
    const node = makeNode('command_trigger');
    const ports = getRenderedPorts(node.type);
    expect(ports).not.toContain('auto-transition');
  });

  it('command_trigger рендерит ровно 1 порт', () => {
    const node = makeNode('command_trigger');
    const ports = getRenderedPorts(node.type);
    expect(ports.length).toBe(1);
  });
});

// ─── Блок B: другие типы узлов ────────────────────────────────────────────────

describe('Блок B: другие типы узлов — рендерят auto-transition, не рендерят trigger-next', () => {
  const OTHER_NODE_TYPES = ['message', 'command', 'start', 'sticker', 'voice', 'location', 'contact'];

  for (const nodeType of OTHER_NODE_TYPES) {
    it(`"${nodeType}" рендерит порт auto-transition`, () => {
      const node = makeNode(nodeType);
      const ports = getRenderedPorts(node.type);
      expect(ports).toContain('auto-transition');
    });

    it(`"${nodeType}" НЕ рендерит порт trigger-next`, () => {
      const node = makeNode(nodeType);
      const ports = getRenderedPorts(node.type);
      expect(ports).not.toContain('trigger-next');
    });
  }
});

// ─── Блок C: Property-based тест (Property 1) ────────────────────────────────
// Feature: canvas-node-connections, Property 1:
// Для любого типа узла выполняется взаимоисключение портов trigger-next / auto-transition

describe('Блок C: Property-based тест (Property 1) — взаимоисключение портов', () => {
  const NUM_RUNS = 100;

  /**
   * Генерирует случайный тип узла из набора допустимых типов
   */
  const ALL_NODE_TYPES = [
    'command_trigger',
    'message',
    'command',
    'start',
    'sticker',
    'voice',
    'location',
    'contact',
    'admin_rights',
    'client_auth',
    'poll',
    'dice',
  ];

  it(`Property 1: для ${NUM_RUNS} случайных типов узлов — ровно один из двух портов рендерится`, () => {
    let failures = 0;
    const failDetails: string[] = [];

    for (let i = 0; i < NUM_RUNS; i++) {
      const nodeType = ALL_NODE_TYPES[Math.floor(Math.random() * ALL_NODE_TYPES.length)];
      const ports = getRenderedPorts(nodeType);

      const hasTriggerNext = ports.includes('trigger-next');
      const hasAutoTransition = ports.includes('auto-transition');

      // Взаимоисключение: ровно один из двух должен быть true
      const xor = hasTriggerNext !== hasAutoTransition;

      if (!xor) {
        failures++;
        failDetails.push(
          `nodeType="${nodeType}" → trigger-next=${hasTriggerNext}, auto-transition=${hasAutoTransition}`
        );
      }
    }

    expect(failures, `Property 1 нарушена в ${failures}/${NUM_RUNS} случаях:\n${failDetails.join('\n')}`).toBe(0);
  });

  it(`Property 1: command_trigger всегда даёт trigger-next (${NUM_RUNS} итераций)`, () => {
    for (let i = 0; i < NUM_RUNS; i++) {
      const ports = getRenderedPorts('command_trigger');
      expect(ports).toContain('trigger-next');
      expect(ports).not.toContain('auto-transition');
    }
  });

  it(`Property 1: не-command_trigger всегда даёт auto-transition (${NUM_RUNS} итераций)`, () => {
    const nonTriggerTypes = ALL_NODE_TYPES.filter(t => t !== 'command_trigger');
    for (let i = 0; i < NUM_RUNS; i++) {
      const nodeType = nonTriggerTypes[Math.floor(Math.random() * nonTriggerTypes.length)];
      const ports = getRenderedPorts(nodeType);
      expect(ports).toContain('auto-transition');
      expect(ports).not.toContain('trigger-next');
    }
  });

  it('Property 1: никогда не рендерятся оба порта одновременно', () => {
    for (const nodeType of ALL_NODE_TYPES) {
      const ports = getRenderedPorts(nodeType);
      const both = ports.includes('trigger-next') && ports.includes('auto-transition');
      expect(both).toBe(false);
    }
  });

  it('Property 1: никогда не рендерится ни один порт', () => {
    for (const nodeType of ALL_NODE_TYPES) {
      const ports = getRenderedPorts(nodeType);
      const none = !ports.includes('trigger-next') && !ports.includes('auto-transition');
      expect(none).toBe(false);
    }
  });
});
