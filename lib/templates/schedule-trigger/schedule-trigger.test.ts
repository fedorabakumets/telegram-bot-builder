/**
 * @fileoverview Тесты для шаблона schedule_trigger
 * @module templates/schedule-trigger/schedule-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateScheduleTrigger,
  generateScheduleTriggerHandlers,
  collectScheduleTriggerEntries,
} from './schedule-trigger.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  nodesWithTrigger,
  nodesWithMissingTarget,
  nodesWithoutTriggers,
} from './schedule-trigger.fixture';
import { scheduleTriggerParamsSchema } from './schedule-trigger.schema';

// ─── generateScheduleTrigger() ───────────────────────────────────────────────

describe('generateScheduleTrigger()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateScheduleTrigger(validParamsEmpty)).toBe('');
  });

  it('генерирует async def _schedule_task_ функцию', () => {
    const r = generateScheduleTrigger(validParamsSingle);
    expect(r).toContain('async def _schedule_task_schedule_fetch_rates');
  });

  it('генерирует функцию _calc_delay_', () => {
    const r = generateScheduleTrigger(validParamsSingle);
    expect(r).toContain('def _calc_delay_schedule_fetch_rates');
  });

  it('генерирует функцию _schedule_execute_', () => {
    const r = generateScheduleTrigger(validParamsSingle);
    expect(r).toContain('async def _schedule_execute_schedule_fetch_rates');
  });

  it('содержит регистрацию задачи через _schedule_tasks.append', () => {
    const r = generateScheduleTrigger(validParamsSingle);
    expect(r).toContain('_schedule_tasks.append');
  });

  it('содержит timezone из параметров', () => {
    const r = generateScheduleTrigger(validParamsSingle);
    expect(r).toContain('Europe/Moscow');
  });

  it('interval mode — содержит расчёт интервала', () => {
    const r = generateScheduleTrigger(validParamsSingle);
    expect(r).toContain('5 * 60');
  });

  it('cron mode — содержит croniter', () => {
    const r = generateScheduleTrigger(validParamsMultiple);
    expect(r).toContain('croniter');
    expect(r).toContain('*/5 9-18 * * 1-5');
  });

  it('несколько триггеров генерируют несколько задач', () => {
    const r = generateScheduleTrigger(validParamsMultiple);
    expect(r).toContain('_schedule_task_schedule_interval');
    expect(r).toContain('_schedule_task_schedule_weekday');
    expect(r).toContain('_schedule_task_schedule_cron');
  });

  it('runOnStart=true — содержит запуск при старте', () => {
    const r = generateScheduleTrigger(validParamsMultiple);
    expect(r).toContain('await _schedule_execute_schedule_interval()');
  });
});

// ─── scheduleTriggerParamsSchema ─────────────────────────────────────────────

describe('scheduleTriggerParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(scheduleTriggerParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(scheduleTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(scheduleTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = { entries: [{ safeName: 'x', targetNodeId: 'y', targetNodeType: 'message', rules: [], timezone: 'UTC', runOnStart: false, enabled: true, maxConcurrent: 1 }] };
    expect(scheduleTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('отклоняет невалидный mode в правиле', () => {
    const invalid = {
      entries: [{
        nodeId: 'x', safeName: 'x', targetNodeId: 'y', targetNodeType: 'message',
        rules: [{ mode: 'invalid_mode' }],
        timezone: 'UTC', runOnStart: false, enabled: true, maxConcurrent: 1,
      }],
    };
    expect(scheduleTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectScheduleTriggerEntries() ─────────────────────────────────────────

describe('collectScheduleTriggerEntries()', () => {
  it('собирает триггер с правильными полями', () => {
    const entries = collectScheduleTriggerEntries(nodesWithTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('sched-1');
    expect(entries[0].safeName).toBe('sched_1');
    expect(entries[0].targetNodeId).toBe('msg-target');
    expect(entries[0].targetNodeType).toBe('message');
    expect(entries[0].timezone).toBe('Europe/Moscow');
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectScheduleTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает узлы не типа schedule_trigger', () => {
    expect(collectScheduleTriggerEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectScheduleTriggerEntries([])).toEqual([]);
  });
});

// ─── generateScheduleTriggerHandlers() ───────────────────────────────────────

describe('generateScheduleTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateScheduleTriggerHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateScheduleTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('_schedule_task_sched_1');
    expect(r).toContain('handle_callback_msg_target');
  });

  it('узлы без триггеров → пустая строка', () => {
    expect(generateScheduleTriggerHandlers(nodesWithoutTriggers)).toBe('');
  });
});
