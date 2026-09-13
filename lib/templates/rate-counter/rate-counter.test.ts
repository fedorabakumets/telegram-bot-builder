/**
 * @fileoverview Тесты для шаблона узла rate_counter
 * @module templates/rate-counter/rate-counter.test
 */

import { describe, it, expect } from 'vitest';
import {
  collectRateCounterEntries,
  generateRateCounter,
  generateRateCounterHandlers,
} from './rate-counter.renderer';
import { validParamsEmpty, validParamsSingle, nodesWithRateCounter } from './rate-counter.fixture';

describe('generateRateCounter()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateRateCounter(validParamsEmpty)).toBe('');
  });

  it('генерирует deque и time.time()', () => {
    const code = generateRateCounter(validParamsSingle);
    expect(code).toContain('_rate_counter_deques');
    expect(code).toContain('deque()');
    expect(code).toContain('time.time()');
  });

  it('сохраняет результат в переменную', () => {
    const code = generateRateCounter(validParamsSingle);
    expect(code).toContain('"msg_rate"');
  });
});

describe('collectRateCounterEntries()', () => {
  it('собирает узлы rate_counter', () => {
    const entries = collectRateCounterEntries(nodesWithRateCounter);
    expect(entries).toHaveLength(1);
    expect(entries[0].counterKey).toBe('spam_key');
    expect(entries[0].saveResultTo).toBe('spam_count');
  });
});

describe('generateRateCounterHandlers()', () => {
  it('генерирует код из узлов', () => {
    const code = generateRateCounterHandlers(nodesWithRateCounter);
    expect(code).toContain('rate_counter');
  });
});
