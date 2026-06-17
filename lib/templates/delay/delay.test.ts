/**
 * @fileoverview Тесты для шаблона узла delay
 * @module templates/delay/delay.test
 */

import { describe, it, expect } from 'vitest';
import { collectDelayEntries, generateDelayHandlers } from './delay.renderer';
import { validParamsSingle, validParamsBackground, nodesWithDelay, nodesWithoutDelay } from './delay.fixture';

describe('generateDelayHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateDelayHandlers([])).toBe('');
  });

  it('узлы без delay → пустая строка', () => {
    expect(generateDelayHandlers(nodesWithoutDelay)).toBe('');
  });

  it('генерирует async def handle_callback_', () => {
    const r = generateDelayHandlers(nodesWithDelay);
    expect(r).toContain('async def handle_callback_');
  });

  it('содержит asyncio.sleep для blocking', () => {
    const r = generateDelayHandlers(nodesWithDelay);
    expect(r).toContain('asyncio.sleep');
  });

  it('содержит logging.info', () => {
    const r = generateDelayHandlers(nodesWithDelay);
    expect(r).toContain('logging.info');
  });

  it('содержит replace_variables_in_text', () => {
    const r = generateDelayHandlers(nodesWithDelay);
    expect(r).toContain('replace_variables_in_text');
  });

  it('поддерживает дробные секунды (float, не int)', () => {
    const r = generateDelayHandlers([
      {
        id: 'delay_frac',
        type: 'delay',
        position: { x: 0, y: 0 },
        data: {
          seconds: '0.1',
          unit: 'seconds',
          mode: 'blocking',
          autoTransitionTo: 'msg_1',
          enableAutoTransition: true,
        },
      },
    ]);
    expect(r).toContain('float(_delay_val)');
    expect(r).not.toMatch(/int\(float\(_delay_val\)\)/);
  });
});

describe('collectDelayEntries()', () => {
  it('собирает delay-узлы', () => {
    const entries = collectDelayEntries(nodesWithDelay);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('delay_1');
    expect(entries[0].seconds).toBe('5');
  });

  it('пропускает не-delay узлы', () => {
    expect(collectDelayEntries(nodesWithoutDelay)).toHaveLength(0);
  });
});
