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

  it('содержит resolve_var для режима text', () => {
    const r = generateSetVariableHandlers(nodesWithSetVariable);
    expect(r).toContain('resolve_var');
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
  it('содержит eval_expr при mode: expression', () => {
    const nodes = [
      { id: 'sv_expr', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'step', value: '{step} + 1', mode: 'expression' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).toContain('eval_expr');
  });

  it('не содержит eval_expr при mode: text', () => {
    const nodes = [
      { id: 'sv_text', type: 'set_variable', data: {
        assignments: [{ id: 'a1', variable: 'name', value: 'Иван', mode: 'text' }],
        autoTransitionTo: '',
      }, position: { x: 0, y: 0 } } as any,
    ];
    const r = generateSetVariableHandlers(nodes);
    expect(r).not.toContain('eval_expr');
    expect(r).toContain('resolve_var');
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
