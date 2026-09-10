/**
 * @fileoverview Тесты для шаблона узла stop_processing
 * @module templates/stop-processing/stop-processing.test
 */

import { describe, it, expect } from 'vitest';
import {
  collectStopProcessingEntries,
  generateStopProcessing,
  generateStopProcessingHandlers,
} from './stop-processing.renderer';
import { validParamsEmpty, validParamsSingle, nodesWithStopProcessing } from './stop-processing.fixture';

describe('generateStopProcessing()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateStopProcessing(validParamsEmpty)).toBe('');
  });

  it('генерирует установку _stop_processing', () => {
    const code = generateStopProcessing(validParamsSingle);
    expect(code).toContain('_stop_processing');
    expect(code).toContain('user_data[user_id]["_stop_processing"] = True');
  });

  it('генерирует callback-обработчик', () => {
    const code = generateStopProcessing(validParamsSingle);
    expect(code).toContain('@dp.callback_query');
    expect(code).toContain('handle_callback_stop1');
  });
});

describe('collectStopProcessingEntries()', () => {
  it('собирает узлы stop_processing', () => {
    const entries = collectStopProcessingEntries(nodesWithStopProcessing);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('stop1');
  });
});

describe('generateStopProcessingHandlers()', () => {
  it('генерирует код из узлов', () => {
    const code = generateStopProcessingHandlers(nodesWithStopProcessing);
    expect(code).toContain('stop_processing');
  });
});
