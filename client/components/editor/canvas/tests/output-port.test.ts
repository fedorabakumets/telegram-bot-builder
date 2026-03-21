/**
 * @fileoverview Тесты для OutputPort и PORT_COLORS
 *
 * Блок A: PORT_COLORS — наличие всех типов портов
 * Блок B: PORT_COLORS — корректность цветов
 * Блок C: PORT_COLORS — качество данных
 * Блок D: Property-based тест (Property 3) — цвет порта соответствует типу
 *
 * @module output-port.test
 */

import { describe, it, expect } from 'vitest';
import { PORT_COLORS, PortType } from '../canvas-node/port-colors';

/** Все допустимые типы портов */
const PORT_TYPES: PortType[] = ['trigger-next', 'auto-transition', 'button-goto'];

// ─── Блок A: PORT_COLORS — наличие всех типов портов ─────────────────────────

describe('Блок A: PORT_COLORS — наличие всех типов портов', () => {
  for (const portType of PORT_TYPES) {
    it(`PORT_COLORS содержит тип "${portType}"`, () => {
      expect(portType in PORT_COLORS).toBe(true);
      expect(!!PORT_COLORS[portType]).toBe(true);
    });
  }

  it('PORT_COLORS содержит ровно 3 типа', () => {
    const count = Object.keys(PORT_COLORS).length;
    expect(count).toBe(3);
  });
});

// ─── Блок B: PORT_COLORS — корректность цветов ───────────────────────────────

describe('Блок B: PORT_COLORS — корректность цветов', () => {
  it('trigger-next — жёлтый #eab308', () => {
    expect(PORT_COLORS['trigger-next']).toBe('#eab308');
  });

  it('auto-transition — зелёный #22c55e', () => {
    expect(PORT_COLORS['auto-transition']).toBe('#22c55e');
  });

  it('button-goto — синий #3b82f6', () => {
    expect(PORT_COLORS['button-goto']).toBe('#3b82f6');
  });

  it('все цвета начинаются с "#"', () => {
    const invalid = Object.entries(PORT_COLORS)
      .filter(([, v]) => !v.startsWith('#'))
      .map(([k]) => k);
    expect(invalid).toHaveLength(0);
  });

  it('все цвета — валидные hex (#rrggbb)', () => {
    const hexRegex = /^#[0-9a-f]{6}$/i;
    const invalid = Object.entries(PORT_COLORS)
      .filter(([, v]) => !hexRegex.test(v))
      .map(([k, v]) => `${k}: "${v}"`);
    expect(invalid).toHaveLength(0);
  });
});

// ─── Блок C: PORT_COLORS — качество данных ───────────────────────────────────

describe('Блок C: PORT_COLORS — качество данных', () => {
  it('PORT_COLORS не содержит undefined значений', () => {
    const bad = Object.entries(PORT_COLORS)
      .filter(([, v]) => v === undefined)
      .map(([k]) => k);
    expect(bad).toHaveLength(0);
  });

  it('PORT_COLORS не содержит пустых строк', () => {
    const bad = Object.entries(PORT_COLORS)
      .filter(([, v]) => !v || !v.trim())
      .map(([k]) => k);
    expect(bad).toHaveLength(0);
  });

  it('все ключи PORT_COLORS — строки без пробелов', () => {
    const bad = Object.keys(PORT_COLORS).filter(k => /\s/.test(k));
    expect(bad).toHaveLength(0);
  });

  it('все цвета уникальны (нет дублей)', () => {
    const values = Object.values(PORT_COLORS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

// ─── Блок D: Property-based тест (Property 3) ────────────────────────────────
// Feature: canvas-node-connections, Property 3: цвет порта соответствует типу
// Для любого portType из PORT_TYPES: PORT_COLORS[portType] — непустая hex-строка

describe('Блок D: Property-based тест (Property 3) — цвет порта соответствует типу', () => {
  const NUM_RUNS = 100;
  const hexRegex = /^#[0-9a-f]{6}$/i;

  it(`Property 3: для всех ${NUM_RUNS} итераций PORT_COLORS[portType] — валидный hex`, () => {
    let failures = 0;
    const failDetails: string[] = [];

    for (let i = 0; i < NUM_RUNS; i++) {
      const portType = PORT_TYPES[Math.floor(Math.random() * PORT_TYPES.length)];
      const color = PORT_COLORS[portType];

      if (!color || !hexRegex.test(color)) {
        failures++;
        failDetails.push(`portType="${portType}" → color="${color}"`);
      }
    }

    expect(failures, `Property 3 нарушена в ${failures}/${NUM_RUNS} случаях:\n${failDetails.join('\n')}`).toBe(0);
  });

  it(`Property 3: каждый тип порта имеет уникальный цвет (${NUM_RUNS} итераций)`, () => {
    for (let i = 0; i < NUM_RUNS; i++) {
      const portType = PORT_TYPES[Math.floor(Math.random() * PORT_TYPES.length)];
      const color1 = PORT_COLORS[portType];
      const color2 = PORT_COLORS[portType];
      expect(color1).toBe(color2);
    }
  });

  it(`Property 3: trigger-next всегда жёлтый (${NUM_RUNS} итераций)`, () => {
    for (let i = 0; i < NUM_RUNS; i++) {
      expect(PORT_COLORS['trigger-next']).toBe('#eab308');
    }
  });

  it(`Property 3: auto-transition всегда зелёный (${NUM_RUNS} итераций)`, () => {
    for (let i = 0; i < NUM_RUNS; i++) {
      expect(PORT_COLORS['auto-transition']).toBe('#22c55e');
    }
  });

  it(`Property 3: button-goto всегда синий (${NUM_RUNS} итераций)`, () => {
    for (let i = 0; i < NUM_RUNS; i++) {
      expect(PORT_COLORS['button-goto']).toBe('#3b82f6');
    }
  });
});
