/**
 * @fileoverview Тесты для шаблона обработчиков триггеров создания управляемого бота
 * @module templates/managed-bot-updated-trigger/managed-bot-updated-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateManagedBotUpdatedTriggers,
  generateManagedBotUpdatedTriggerHandlers,
  collectManagedBotUpdatedTriggerEntries,
} from './managed-bot-updated-trigger.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  nodesWithTrigger,
  nodesWithMissingTarget,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
  nodesWithFilter,
} from './managed-bot-updated-trigger.fixture';
import { managedBotUpdatedTriggerParamsSchema } from './managed-bot-updated-trigger.schema';

// ─── generateManagedBotUpdatedTriggers() ─────────────────────────────────────

describe('generateManagedBotUpdatedTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateManagedBotUpdatedTriggers(validParamsEmpty)).toBe('');
  });

  it('генерирует @dp.message декоратор', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('@dp.message(');
    expect(r).not.toContain('@dp.update.outer_middleware()');
  });

  it('принимает types.Message', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('message: types.Message');
    expect(r).not.toContain('event: types.Update');
  });

  it('проверяет managed_bot_created', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('managed_bot_created');
    expect(r).not.toContain('managed_bot_token_changed');
    expect(r).not.toContain('event.managed_bot');
  });

  it('имя обработчика содержит nodeId', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('managed_bot_updated_trigger_mbu_trigger_1_handler');
  });

  it('содержит сохранение bot_id в user_data', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('user_data[user_id]["bot_id"]');
  });

  it('вызывает handle_callback с правильным targetNodeId', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('await handle_callback_msg_1(fake_cb)');
  });

  it('содержит logging.info с user_id', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('logging.info');
    expect(r).toContain('user_id');
  });

  it('содержит logging.error для обработки исключений', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('logging.error');
  });

  it('несколько триггеров генерируют несколько обработчиков', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsMultiple);
    expect(r).toContain('managed_bot_updated_trigger_mbu_trigger_1_handler');
    expect(r).toContain('managed_bot_updated_trigger_mbu_trigger_2_handler');
  });
});

// ─── managedBotUpdatedTriggerParamsSchema ─────────────────────────────────────

describe('managedBotUpdatedTriggerParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(managedBotUpdatedTriggerParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(managedBotUpdatedTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(managedBotUpdatedTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = { entries: [{ targetNodeId: 'msg_1', targetNodeType: 'message' }] };
    expect(managedBotUpdatedTriggerParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectManagedBotUpdatedTriggerEntries() ─────────────────────────────────

describe('collectManagedBotUpdatedTriggerEntries()', () => {
  it('собирает триггер с правильными полями', () => {
    const entries = collectManagedBotUpdatedTriggerEntries(nodesWithTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('mbu_trigger_1');
    expect(entries[0].targetNodeId).toBe('msg_1');
    expect(entries[0].saveBotIdTo).toBe('bot_id');
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectManagedBotUpdatedTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает узлы не типа managed_bot_updated_trigger', () => {
    expect(collectManagedBotUpdatedTriggerEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectManagedBotUpdatedTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('mbu_trigger_1');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectManagedBotUpdatedTriggerEntries([])).toEqual([]);
  });
});

// ─── generateManagedBotUpdatedTriggerHandlers() ───────────────────────────────

describe('generateManagedBotUpdatedTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateManagedBotUpdatedTriggerHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateManagedBotUpdatedTriggerHandlers(nodesWithTrigger);
    expect(r).toContain('managed_bot_updated_trigger_mbu_trigger_1_handler');
    expect(r).toContain('handle_callback_msg_1');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateManagedBotUpdatedTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('managed_bot_updated_trigger_mbu_trigger_1_handler');
  });

  it('узлы без триггеров → пустая строка', () => {
    expect(generateManagedBotUpdatedTriggerHandlers(nodesWithoutTriggers)).toBe('');
  });
});

// ─── Специфика триггера managed_bot_updated ───────────────────────────────────

describe('Специфика триггера managed_bot_updated', () => {
  it('сохраняет bot_id, bot_username, creator_id в user_data', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('user_data[user_id]["bot_id"]');
    expect(r).toContain('user_data[user_id]["bot_username"]');
    expect(r).toContain('user_data[user_id]["creator_id"]');
  });

  it('содержит фильтр по user_id когда filterByUserId задан', () => {
    const r = generateManagedBotUpdatedTriggerHandlers(nodesWithFilter);
    expect(r).toContain('"123456789"');
    expect(r).toContain('str(user_id)');
  });

  it('не содержит фильтр по user_id когда filterByUserId не задан', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).not.toContain('str(user_id) !=');
  });

  it('содержит FakeCallbackQuery без FakeMessage', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('FakeCallbackQuery');
    expect(r).not.toContain('FakeMessage');
  });

  it('содержит _is_fake = True в FakeCallbackQuery', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('_is_fake = True');
  });

  it('FakeCallbackQuery содержит self.message', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('self.message');
  });

  it('не использует event.managed_bot и не использует outer_middleware', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).not.toContain('event.managed_bot');
    expect(r).not.toContain('outer_middleware');
  });

  it('обработчик регистрируется через @dp.message декоратор', () => {
    const r = generateManagedBotUpdatedTriggers(validParamsSingle);
    expect(r).toContain('@dp.message(lambda m: m.managed_bot_created is not None)');
    expect(r).toContain('async def managed_bot_updated_trigger_');
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateManagedBotUpdatedTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateManagedBotUpdatedTriggers(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateManagedBotUpdatedTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateManagedBotUpdatedTriggerHandlers(nodesWithTrigger);
    expect(Date.now() - start).toBeLessThan(100);
  });
});
