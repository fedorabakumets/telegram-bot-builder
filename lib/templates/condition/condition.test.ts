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

// ─── Импорт фикстур для системных операторов ─────────────────────────────────
import {
  validParamsIsPrivate,
  validParamsSystemMultiple,
  validParamsIsChannel,
  validParamsIsGroup,
  validParamsMixedSystemAndVar,
  nodesWithConditionIsPrivate,
  nodesWithConditionSystemMultiple,
  nodesWithConditionIsChannel,
  nodesWithConditionMixedSystem,
} from './condition.fixture';

// ─── generateConditionHandlers() — системные операторы ───────────────────────

describe('generateConditionHandlers() — системные операторы', () => {
  it('is_private без переменной — генерирует async def без _all_vars', () => {
    const r = generateConditionHandlers(nodesWithConditionIsPrivate);
    expect(r).toContain('async def handle_callback_condition_check_private');
    expect(r).not.toContain('_all_vars');
    expect(r).not.toContain('init_all_user_vars');
  });

  it('is_private — генерирует проверку chat.type == private', () => {
    const r = generateConditionHandlers(nodesWithConditionIsPrivate);
    expect(r).toContain("callback_query.message.chat.type == 'private'");
  });

  it('is_group — генерирует проверку in (group, supergroup)', () => {
    const r = generateConditionHandlers(validParamsIsGroup);
    expect(r).toContain("callback_query.message.chat.type in ('group', 'supergroup')");
  });

  it('is_channel — генерирует проверку chat.type == channel', () => {
    const r = generateConditionHandlers(nodesWithConditionIsChannel);
    expect(r).toContain("callback_query.message.chat.type == 'channel'");
  });

  it('is_private + is_group + else — корректный if/elif/else', () => {
    const r = generateConditionHandlers(nodesWithConditionSystemMultiple);
    expect(r).toContain("if callback_query.message.chat.type == 'private'");
    expect(r).toContain("elif callback_query.message.chat.type in ('group', 'supergroup')");
    expect(r).toContain('else:');
  });

  it('несколько системных веток — первая if, остальные elif', () => {
    const r = generateConditionHandlers(validParamsSystemMultiple);
    const ifIdx = r.indexOf("if callback_query.message.chat.type == 'private'");
    const elifIdx = r.indexOf("elif callback_query.message.chat.type in ('group', 'supergroup')");
    expect(ifIdx).toBeGreaterThanOrEqual(0);
    expect(elifIdx).toBeGreaterThan(ifIdx);
  });

  it('системная ветка с target — генерирует await handle_callback_', () => {
    const r = generateConditionHandlers(nodesWithConditionIsPrivate);
    expect(r).toContain('await handle_callback_msg_private(callback_query)');
  });

  it('системная ветка без target — генерирует pass', () => {
    const r = generateConditionHandlers(validParamsIsPrivate);
    // validParamsIsPrivate has target, so test without target
    const params = {
      entries: [{
        nodeId: 'cond_no_target',
        variable: '',
        branches: [{ id: 'b1', operator: 'is_private' as const, value: '' }],
      }],
    };
    const r2 = generateConditionHandlers(params);
    expect(r2).toContain('pass');
  });

  it('смешанный is_private + equals — оба прохода генерируются', () => {
    const r = generateConditionHandlers(validParamsMixedSystemAndVar);
    expect(r).toContain("callback_query.message.chat.type == 'private'");
    expect(r).toContain('val == "admin"');
    expect(r).toContain('_all_vars');
  });

  it('смешанный is_private + filled + else — все ветки в коде', () => {
    const r = generateConditionHandlers(nodesWithConditionMixedSystem);
    expect(r).toContain("callback_query.message.chat.type == 'private'");
    expect(r).toContain('val');
    expect(r).toContain('else:');
  });

  it('только системные ветки — нет _all_vars в коде', () => {
    const r = generateConditionHandlers(validParamsSystemMultiple);
    expect(r).not.toContain('_all_vars');
    expect(r).not.toContain('init_all_user_vars');
  });

  it('узел без переменной и без системных веток — пропускается', () => {
    const params = {
      entries: [{
        nodeId: 'cond_skip',
        variable: '',
        branches: [{ id: 'b1', operator: 'filled' as const, value: '' }],
      }],
    };
    // collectConditionEntries should skip this
    const r = generateConditionHandlers(params);
    // When passed as params directly, schema validation will fail on empty variable for non-system
    // But via nodes it should be skipped
    const nodes = [{
      id: 'cond_skip',
      type: 'condition',
      position: { x: 0, y: 0 },
      data: { variable: '', branches: [{ id: 'b1', operator: 'filled', value: '' }] },
    }] as any;
    const r2 = generateConditionHandlers(nodes);
    expect(r2).not.toContain('handle_callback_cond_skip');
  });

  it('else после системных веток — корректный else:', () => {
    const r = generateConditionHandlers(validParamsIsChannel);
    expect(r).toContain("callback_query.message.chat.type == 'channel'");
    expect(r).toContain('else:');
    const channelIdx = r.indexOf("callback_query.message.chat.type == 'channel'");
    const elseIdx = r.indexOf('else:');
    expect(channelIdx).toBeLessThan(elseIdx);
  });
});

// ─── conditionParamsSchema — системные операторы ─────────────────────────────

describe('conditionParamsSchema — системные операторы', () => {
  it('принимает оператор is_private', () => {
    expect(conditionParamsSchema.safeParse(validParamsIsPrivate).success).toBe(true);
  });

  it('принимает оператор is_group', () => {
    expect(conditionParamsSchema.safeParse(validParamsIsGroup).success).toBe(true);
  });

  it('принимает оператор is_channel', () => {
    expect(conditionParamsSchema.safeParse(validParamsIsChannel).success).toBe(true);
  });

  it('принимает смешанные системные + переменные операторы', () => {
    expect(conditionParamsSchema.safeParse(validParamsMixedSystemAndVar).success).toBe(true);
  });
});
