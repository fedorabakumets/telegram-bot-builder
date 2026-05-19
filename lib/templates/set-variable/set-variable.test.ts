/**
 * @fileoverview Тесты для шаблона узла set_variable
 * @module templates/set-variable/set-variable.test
 */

import { describe, it, expect } from 'vitest';
import {
  collectSetVariableEntries,
  generateSetVariableHandlers,
} from './set-variable.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsExpression,
  validParamsMultiple,
  nodesWithSetVariable,
  nodesWithMissingAssignments,
  nodesWithoutSetVariable,
  nodesWithNullAndMixed,
} from './set-variable.fixture';
import { setVariableParamsSchema } from './set-variable.schema';

// ─── generateSetVariableHandlers() ───────────────────────────────────────────

describe('generateSetVariableHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateSetVariableHandlers([])).toBe('');
  });

  it('узлы без set_variable → пустая строка', () => {
    expect(generateSetVariableHandlers(nodesWithoutSetVariable)).toBe('');
  });

  it('генерирует async def handle_callback_', () => {
    const r = generateSetVariableHandlers(nodesWithSetVariable);
    expect(r).toContain('async def handle_callback_');
  });

  it('содержит user_data[user_id]', () => {
    const r = generateSetVariableHandlers(nodesWithSetVariable);
    expect(r).toContain('user_data[user_id]');
  });

  it('содержит replace_variables_in_text для режима text', () => {
    const r = generateSetVariableHandlers(nodesWithSetVariable);
    expect(r).toContain('replace_variables_in_text');
  });

  it('содержит logging.info', () => {
    const r = generateSetVariableHandlers(nodesWithSetVariable);
    expect(r).toContain('logging.info');
  });

  it('содержит logging.error', () => {
    const r = generateSetVariableHandlers(nodesWithSetVariable);
    expect(r).toContain('logging.error');
  });

  it('узел без assignments генерирует корректный код', () => {
    const r = generateSetVariableHandlers(nodesWithMissingAssignments);
    expect(r).toContain('async def handle_callback_sv_bad');
  });
});

// ─── setVariableParamsSchema ──────────────────────────────────────────────────

describe('setVariableParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(setVariableParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустые assignments', () => {
    expect(setVariableParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько assignments', () => {
    expect(setVariableParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие nodeId', () => {
    const invalid = { assignments: [], autoTransitionTo: '' };
    expect(setVariableParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('принимает режим expression', () => {
    expect(setVariableParamsSchema.safeParse(validParamsExpression).success).toBe(true);
  });
});

// ─── collectSetVariableEntries() ─────────────────────────────────────────────

describe('collectSetVariableEntries()', () => {
  it('собирает узел с правильными полями', () => {
    const entries = collectSetVariableEntries(nodesWithSetVariable);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('sv_1');
    expect(entries[0].assignments).toHaveLength(1);
    expect(entries[0].autoTransitionTo).toBe('msg_1');
  });

  it('пропускает null-узлы', () => {
    const entries = collectSetVariableEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('sv_1');
  });

  it('пропускает узлы не типа set_variable', () => {
    expect(collectSetVariableEntries(nodesWithoutSetVariable)).toHaveLength(0);
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectSetVariableEntries([])).toEqual([]);
  });

  it('assignments по умолчанию пустой массив', () => {
    const entries = collectSetVariableEntries(nodesWithMissingAssignments);
    expect(entries[0].assignments).toEqual([]);
  });
});

// ─── Режим expression ────────────────────────────────────────────────────────

describe('Режим expression', () => {
  it('содержит _eval_expr при mode: expression', () => {
    const nodes = [
      { id: 'sv_expr', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'step', value: '{step} + 1', mode: 'expression' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('_eval_expr');
  });

  it('не містить _eval_expr при mode: text', () => {
    const nodes = [
      { id: 'sv_text', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'name', value: 'Иван', mode: 'text' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).not.toContain('_eval_expr');
    expect(r).toContain('replace_variables_in_text');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateSetVariableHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateSetVariableHandlers(nodesWithSetVariable);
    expect(Date.now() - start).toBeLessThan(100);
  });
});

// ─── Режим random ────────────────────────────────────────────────────────────

describe('Режим random', () => {
  it('содержит random.randint при mode: random', () => {
    const nodes = [
      { id: 'sv_rand', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'salary', value: '500', maxValue: '900', mode: 'random' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('randint');
  });

  it('содержит import random', () => {
    const nodes = [
      { id: 'sv_rand2', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'exp_gain', value: '8', maxValue: '16', mode: 'random' }],
        autoTransitionTo: 'msg_1',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('import random');
  });

  it('содержит logging.info с random', () => {
    const nodes = [
      { id: 'sv_rand3', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'reward', value: '100', maxValue: '500', mode: 'random' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('random');
    expect(r).toContain('logging.info');
  });
});

// ─── Режим timestamp ─────────────────────────────────────────────────────────

describe('Режим timestamp', () => {
  it('содержит time.time() при mode: timestamp', () => {
    const nodes = [
      { id: 'sv_ts', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'cooldown_until', value: '90', mode: 'timestamp' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('time()');
  });

  it('содержит import time', () => {
    const nodes = [
      { id: 'sv_ts2', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'expires_at', value: '3600', mode: 'timestamp' }],
        autoTransitionTo: 'msg_1',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('import time');
  });

  it('offset=0 генерирует текущий timestamp', () => {
    const nodes = [
      { id: 'sv_ts3', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'now_ts', value: '0', mode: 'timestamp' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('timestamp');
    expect(r).toContain('logging.info');
  });
});

// ─── Режим random_item ───────────────────────────────────────────────────────

describe('Режим random_item', () => {
  it('содержит random.choice при mode: random_item', () => {
    const nodes = [
      { id: 'sv_ri', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'emoji', value: '🔧,💥,💡,⚡', mode: 'random_item' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('choice');
  });

  it('содержит split(",") для разделения элементов', () => {
    const nodes = [
      { id: 'sv_ri2', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'greeting', value: 'Привет,Здравствуйте,Хай', mode: 'random_item' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('split');
  });

  it('содержит logging.info с random_item', () => {
    const nodes = [
      { id: 'sv_ri3', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'item', value: 'a,b,c', mode: 'random_item' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('random_item');
    expect(r).toContain('logging.info');
  });
});

// ─── Режим array_item ────────────────────────────────────────────────────────

describe('Режим array_item', () => {
  it('содержит json.loads для парсинга массива', () => {
    const nodes = [
      { id: 'sv_ai', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'item', value: '{items}', maxValue: '0', mode: 'array_item' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('json');
  });

  it('поддерживает dot-notation в индексе', () => {
    const nodes = [
      { id: 'sv_ai2', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'name', value: '{response}', maxValue: 'data.user.name', mode: 'array_item' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('split');
    expect(r).toContain('array_item');
  });

  it('содержит logging.info', () => {
    const nodes = [
      { id: 'sv_ai3', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'val', value: '{arr}', maxValue: '1', mode: 'array_item' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('logging.info');
  });
});
