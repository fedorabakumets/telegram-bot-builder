/**
 * @fileoverview Тесты для шаблона узла rate_counter
 * @module templates/rate-counter/rate-counter.test
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
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

/** Проверяет очистку настоящего Python-помощника без запуска Telegram и базы данных. */
describe('очистка истёкших ключей', () => {
  it('сохраняет границу окна, ограничивает обход и освобождает метаданные', () => {
    const code = generateRateCounter(validParamsSingle);
    const helper = code.slice(0, code.indexOf('# Обработчики узлов rate_counter'));
    const script = `from collections import deque
import time
_rate_counter_deques = {}
${helper}
for key in range(100):
    _rate_counter_deques[key] = deque([1.0])
    _rate_counter_windows[key] = 60.0
    _rate_counter_cleanup_keys.append(key)
_cleanup_rate_counter_keys(100.0, 32)
assert len(_rate_counter_deques) == 68
assert len(_rate_counter_windows) == 68
assert len(_rate_counter_cleanup_keys) == 68
for _ in range(3):
    _cleanup_rate_counter_keys(100.0)
assert not _rate_counter_deques and not _rate_counter_windows
assert not _rate_counter_cleanup_keys
_rate_counter_deques['boundary'] = deque([40.0])
_rate_counter_windows['boundary'] = 60.0
_rate_counter_cleanup_keys.append('boundary')
_cleanup_rate_counter_keys(100.0)
assert 'boundary' in _rate_counter_deques
_cleanup_rate_counter_keys(100.001)
assert 'boundary' not in _rate_counter_deques
_rate_counter_deques['recent'] = deque([99.0] * 10000)
_rate_counter_windows['recent'] = 60.0
_rate_counter_cleanup_keys.append('recent')
_cleanup_rate_counter_keys(100.0)
assert len(_rate_counter_deques['recent']) == 10000
`;
    execFileSync('python', ['-c', script], { stdio: 'pipe' });
  });
});
