/**
 * @fileoverview Тесты для шаблона обработчиков узла получения токена управляемого бота
 * @module templates/get-managed-bot-token/get-managed-bot-token.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateGetManagedBotToken,
  generateGetManagedBotTokenHandlers,
  collectGetManagedBotTokenEntries,
} from './get-managed-bot-token.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  nodesWithTrigger,
  nodesWithMissingTarget,
  nodesWithoutTriggers,
  nodesWithNullAndMixed,
  nodesWithManualId,
} from './get-managed-bot-token.fixture';
import { getManagedBotTokenParamsSchema } from './get-managed-bot-token.schema';

// ─── generateGetManagedBotToken() ─────────────────────────────────────────────

describe('generateGetManagedBotToken()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateGetManagedBotToken(validParamsEmpty)).toBe('');
  });

  it('генерирует @dp.callback_query декоратор', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('@dp.callback_query(');
    expect(r).not.toContain('@dp.message(');
  });

  it('содержит вызов get_managed_bot_token', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('get_managed_bot_token');
  });

  it('сохраняет токен в user_data', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('user_data[user_id]["bot_token"]');
  });

  it('вызывает handle_callback с правильным targetNodeId', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('await handle_callback_msg_1(fake_cb)');
  });

  it('содержит logging.info и logging.error', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('logging.info');
    expect(r).toContain('logging.error');
  });

  it('несколько записей генерируют несколько обработчиков', () => {
    const r = generateGetManagedBotToken(validParamsMultiple);
    expect(r).toContain('handle_callback_get_token_1');
    expect(r).toContain('handle_callback_get_token_2');
  });

  it('содержит маркеры NODE_START и NODE_END', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('@@NODE_START:get_token_1@@');
    expect(r).toContain('@@NODE_END:get_token_1@@');
  });
});

// ─── getManagedBotTokenParamsSchema ───────────────────────────────────────────

describe('getManagedBotTokenParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(getManagedBotTokenParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(getManagedBotTokenParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько записей', () => {
    expect(getManagedBotTokenParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = { entries: [{ targetNodeId: 'msg_1', targetNodeType: 'message' }] };
    expect(getManagedBotTokenParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectGetManagedBotTokenEntries() ───────────────────────────────────────

describe('collectGetManagedBotTokenEntries()', () => {
  it('собирает запись с правильными полями', () => {
    const entries = collectGetManagedBotTokenEntries(nodesWithTrigger);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('get_token_1');
    expect(entries[0].targetNodeId).toBe('msg_1');
    expect(entries[0].saveTokenTo).toBe('bot_token');
  });

  it('пропускает узел без autoTransitionTo', () => {
    expect(collectGetManagedBotTokenEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает узлы не типа get_managed_bot_token', () => {
    expect(collectGetManagedBotTokenEntries(nodesWithoutTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectGetManagedBotTokenEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('get_token_1');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectGetManagedBotTokenEntries([])).toEqual([]);
  });
});

// ─── generateGetManagedBotTokenHandlers() ─────────────────────────────────────

describe('generateGetManagedBotTokenHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateGetManagedBotTokenHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateGetManagedBotTokenHandlers(nodesWithTrigger);
    expect(r).toContain('handle_callback_get_token_1');
    expect(r).toContain('handle_callback_msg_1');
  });

  it('фильтрует null узлы и не-action узлы', () => {
    const r = generateGetManagedBotTokenHandlers(nodesWithNullAndMixed);
    expect(r).toContain('handle_callback_get_token_1');
  });

  it('узлы без get_managed_bot_token → пустая строка', () => {
    expect(generateGetManagedBotTokenHandlers(nodesWithoutTriggers)).toBe('');
  });
});

// ─── Специфика узла get_managed_bot_token ─────────────────────────────────────

describe('Специфика узла get_managed_bot_token', () => {
  it('читает bot_id из переменной когда botIdSource = variable', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('user_data.get(user_id, {}).get("bot_id")');
  });

  it('использует ручной bot_id когда botIdSource = manual', () => {
    const r = generateGetManagedBotTokenHandlers(nodesWithManualId);
    expect(r).toContain('_bot_id = 123456789');
    expect(r).not.toContain('user_data.get(user_id, {}).get(');
  });

  it('сохраняет ошибку в saveErrorTo когда задан', () => {
    const r = generateGetManagedBotTokenHandlers(nodesWithManualId);
    expect(r).toContain('user_data.setdefault(user_id, {})["token_error"]');
  });

  it('содержит FakeCallbackQuery с _is_fake = True', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('FakeCallbackQuery');
    expect(r).toContain('_is_fake = True');
  });

  it('FakeCallbackQuery содержит self.message', () => {
    const r = generateGetManagedBotToken(validParamsSingle);
    expect(r).toContain('self.message');
  });
});

// ─── Производительность ───────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateGetManagedBotToken: быстрее 100ms', () => {
    const start = Date.now();
    generateGetManagedBotToken(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateGetManagedBotTokenHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateGetManagedBotTokenHandlers(nodesWithTrigger);
    expect(Date.now() - start).toBeLessThan(100);
  });
});
