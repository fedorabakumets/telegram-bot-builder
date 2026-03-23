/**
 * @fileoverview Тесты для шаблона обработчиков узлов условия
 * @module templates/condition/condition.test
 */

import { describe, it, expect } from 'vitest';
import {
  collectConditionEntries,
  generateConditionHandlers,
} from './condition.renderer';
import {
  validParamsEmpty,
  validParamsFilledEmpty,
  validParamsEquals,
  validParamsContains,
  validParamsMultiple,
  validParamsGreaterThan,
  validParamsLessThan,
  validParamsBetween,
  nodesWithConditionFilledEmpty,
  nodesWithConditionEquals,
  nodesWithConditionContains,
  nodesWithConditionGreaterThan,
  nodesWithConditionLessThan,
  nodesWithConditionBetween,
  nodesWithMissingVariable,
  nodesWithNoBranches,
  nodesWithoutCondition,
  nodesWithNullAndMixed,
} from './condition.fixture';
import { conditionParamsSchema } from './condition.schema';

// ─── collectConditionEntries() ────────────────────────────────────────────────

describe('collectConditionEntries()', () => {
  it('возвращает пустой массив если нет condition-узлов', () => {
    expect(collectConditionEntries(nodesWithoutCondition)).toEqual([]);
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectConditionEntries([])).toEqual([]);
  });

  it('корректно собирает узел с ветками filled/empty/else', () => {
    const entries = collectConditionEntries(nodesWithConditionFilledEmpty);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('condition_check_name');
    expect(entries[0].variable).toBe('user_name');
    expect(entries[0].branches).toHaveLength(3);
    expect(entries[0].branches[0].operator).toBe('filled');
    expect(entries[0].branches[1].operator).toBe('empty');
    expect(entries[0].branches[2].operator).toBe('else');
  });

  it('корректно собирает узел с ветками equals / else', () => {
    const entries = collectConditionEntries(nodesWithConditionEquals);
    expect(entries).toHaveLength(1);
    expect(entries[0].branches[0].operator).toBe('equals');
    expect(entries[0].branches[0].value).toBe('admin');
  });

  it('корректно собирает узел с ветками contains / else', () => {
    const entries = collectConditionEntries(nodesWithConditionContains);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('condition_check_email');
    expect(entries[0].variable).toBe('user_email');
    expect(entries[0].branches[0].operator).toBe('contains');
    expect(entries[0].branches[0].value).toBe('gmail');
  });

  it('пропускает узел без variable', () => {
    expect(collectConditionEntries(nodesWithMissingVariable)).toHaveLength(0);
  });

  it('пропускает узел без веток', () => {
    expect(collectConditionEntries(nodesWithNoBranches)).toHaveLength(0);
  });

  it('фильтрует null-узлы', () => {
    const entries = collectConditionEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('condition_check_name');
  });

  it('передаёт target из ветки', () => {
    const entries = collectConditionEntries(nodesWithConditionFilledEmpty);
    expect(entries[0].branches[0].target).toBe('msg_greet');
  });
});

// ─── generateConditionHandlers() (из Node[]) ─────────────────────────────────

describe('generateConditionHandlers() из Node[]', () => {
  it('возвращает пустую строку если нет узлов', () => {
    expect(generateConditionHandlers([])).toBe('');
  });

  it('возвращает пустую строку если нет condition-узлов', () => {
    expect(generateConditionHandlers(nodesWithoutCondition)).toBe('');
  });

  it('генерирует код содержащий handle_callback_', () => {
    const r = generateConditionHandlers(nodesWithConditionFilledEmpty);
    expect(r).toContain('handle_callback_');
  });

  it('сгенерированный код содержит init_all_user_vars', () => {
    const r = generateConditionHandlers(nodesWithConditionFilledEmpty);
    expect(r).toContain('init_all_user_vars');
  });

  it('содержит имя переменной из узла', () => {
    const r = generateConditionHandlers(nodesWithConditionFilledEmpty);
    expect(r).toContain('user_name');
  });

  it('генерирует if/elif/else для веток', () => {
    const r = generateConditionHandlers(nodesWithConditionFilledEmpty);
    expect(r).toContain('if val');
    expect(r).toContain('not val');
    expect(r).toContain('else:');
  });

  it('генерирует сравнение для оператора equals', () => {
    const r = generateConditionHandlers(nodesWithConditionEquals);
    expect(r).toContain('val == "admin"');
  });

  it('генерирует проверку подстроки для оператора contains', () => {
    const r = generateConditionHandlers(nodesWithConditionContains);
    expect(r).toContain('"gmail" in val');
  });

  it('содержит logging.info', () => {
    const r = generateConditionHandlers(nodesWithConditionFilledEmpty);
    expect(r).toContain('logging.info');
  });
});

// ─── generateConditionHandlers() (из ConditionTemplateParams) ────────────────

describe('generateConditionHandlers() из ConditionTemplateParams', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateConditionHandlers(validParamsEmpty)).toBe('');
  });

  it('генерирует код для filled/empty/else', () => {
    const r = generateConditionHandlers(validParamsFilledEmpty);
    expect(r).toContain('handle_callback_condition_check_name');
    expect(r).toContain('init_all_user_vars');
  });

  it('генерирует код для equals', () => {
    const r = generateConditionHandlers(validParamsEquals);
    expect(r).toContain('val == "admin"');
    expect(r).toContain('val == "moderator"');
  });

  it('генерирует код для contains', () => {
    const r = generateConditionHandlers(validParamsContains);
    expect(r).toContain('"gmail" in val');
    expect(r).toContain('"yahoo" in val');
  });

  it('несколько узлов → несколько функций', () => {
    const r = generateConditionHandlers(validParamsMultiple);
    const count = (r.match(/async def handle_callback_/g) || []).length;
    expect(count).toBe(3);
  });
});

// ─── generateConditionHandlers() — числовые операторы ────────────────────────

describe('generateConditionHandlers() — числовые операторы', () => {
  it('greater_than → генерирует _num_val > N', () => {
    const r = generateConditionHandlers(nodesWithConditionGreaterThan);
    expect(r).toContain('_num_val > 18');
  });

  it('greater_than → генерирует блок try/except для _num_val', () => {
    const r = generateConditionHandlers(nodesWithConditionGreaterThan);
    expect(r).toContain('_num_val = float(val)');
    expect(r).toContain('except (ValueError, TypeError)');
  });

  it('less_than → генерирует _num_val < N', () => {
    const r = generateConditionHandlers(nodesWithConditionLessThan);
    expect(r).toContain('_num_val < 18');
  });

  it('less_than → генерирует блок try/except для _num_val', () => {
    const r = generateConditionHandlers(nodesWithConditionLessThan);
    expect(r).toContain('_num_val = float(val)');
  });

  it('between → генерирует N1 <= _num_val <= N2', () => {
    const r = generateConditionHandlers(nodesWithConditionBetween);
    expect(r).toContain('18 <= _num_val <= 65');
  });

  it('between → генерирует блок try/except для _num_val', () => {
    const r = generateConditionHandlers(nodesWithConditionBetween);
    expect(r).toContain('_num_val = float(val)');
  });

  it('greater_than params → генерирует _num_val > N', () => {
    const r = generateConditionHandlers(validParamsGreaterThan);
    expect(r).toContain('_num_val > 18');
  });

  it('less_than params → генерирует _num_val < N', () => {
    const r = generateConditionHandlers(validParamsLessThan);
    expect(r).toContain('_num_val < 18');
  });

  it('between params → генерирует N1 <= _num_val <= N2', () => {
    const r = generateConditionHandlers(validParamsBetween);
    expect(r).toContain('18 <= _num_val <= 65');
  });
});

describe('conditionParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(conditionParamsSchema.safeParse(validParamsFilledEmpty).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(conditionParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает оператор equals', () => {
    expect(conditionParamsSchema.safeParse(validParamsEquals).success).toBe(true);
  });

  it('принимает оператор contains', () => {
    expect(conditionParamsSchema.safeParse(validParamsContains).success).toBe(true);
  });

  it('принимает оператор greater_than', () => {
    expect(conditionParamsSchema.safeParse(validParamsGreaterThan).success).toBe(true);
  });

  it('принимает оператор less_than', () => {
    expect(conditionParamsSchema.safeParse(validParamsLessThan).success).toBe(true);
  });

  it('принимает оператор between', () => {
    expect(conditionParamsSchema.safeParse(validParamsBetween).success).toBe(true);
  });

  it('отклоняет неизвестный оператор', () => {
    const bad = {
      entries: [{
        nodeId: 'n1',
        variable: 'x',
        branches: [{ id: 'b1', operator: '==', value: '' }],
      }],
    };
    expect(conditionParamsSchema.safeParse(bad).success).toBe(false);
  });

  it('отклоняет пустой nodeId', () => {
    const bad = {
      entries: [{
        nodeId: '',
        variable: 'x',
        branches: [{ id: 'b1', operator: 'else', value: '' }],
      }],
    };
    expect(conditionParamsSchema.safeParse(bad).success).toBe(false);
  });
});
