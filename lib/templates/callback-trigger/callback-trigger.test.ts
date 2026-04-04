/**
 * @fileoverview Тесты для шаблона обработчиков триггеров inline-кнопок
 * @module templates/callback-trigger/callback-trigger.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateCallbackTriggers,
  generateCallbackTriggerHandlers,
  collectCallbackTriggerEntries,
  collectVirtualCallbackTriggerEntries,
} from './callback-trigger.renderer';
import type { CallbackTriggerTemplateParams } from './callback-trigger.params';
import {
  validParamsEmpty,
  validParamsExact,
  validParamsStartswith,
  validParamsAdminOnly,
  validParamsRequiresAuth,
  validParamsMultiple,
  invalidParamsMissingCallbackData,
  nodesWithCallbackTriggerExact,
  nodesWithCallbackTriggerStartswith,
  nodesWithMissingTarget,
  nodesWithEmptyCallbackData,
  nodesWithoutCallbackTriggers,
  nodesWithNullAndMixed,
  nodesWithAdminOnly,
  nodesWithRequiresAuth,
  nodesWithCustomCallbackButtons,
  makeNode,
} from './callback-trigger.fixture';
import { callbackTriggerParamsSchema } from './callback-trigger.schema';

// ─── generateCallbackTriggers() ──────────────────────────────────────────────

describe('generateCallbackTriggers()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateCallbackTriggers(validParamsEmpty)).toBe('');
  });

  it('exact генерирует lambda c: c.data == "..."', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('lambda c: c.data == "confirm_order"');
  });

  it('startswith генерирует lambda c: c.data and c.data.startswith("...")', () => {
    const r = generateCallbackTriggers(validParamsStartswith);
    expect(r).toContain('lambda c: c.data and c.data.startswith("order_")');
  });

  it('генерирует @dp.callback_query декоратор', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('@dp.callback_query(');
  });

  it('имя функции содержит nodeId', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('callback_trigger_trigger_confirm_handler');
  });

  it('генерирует class MockCallback', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('class MockCallback:');
  });

  it('генерирует mock_callback = MockCallback и вызов handle_callback', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('mock_callback = MockCallback(');
    expect(r).toContain('await handle_callback_msg_confirmed(mock_callback)');
  });

  it('содержит logging.info с user_id', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('logging.info');
    expect(r).toContain('user_id');
  });

  it('adminOnly добавляет проверку is_admin', () => {
    const r = generateCallbackTriggers(validParamsAdminOnly);
    expect(r).toContain('is_admin(user_id)');
    expect(r).toContain('У вас нет прав для выполнения этого действия');
  });

  it('requiresAuth добавляет проверку check_auth', () => {
    const r = generateCallbackTriggers(validParamsRequiresAuth);
    expect(r).toContain('check_auth(user_id)');
    expect(r).toContain('/start');
  });

  it('без adminOnly нет проверки прав', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).not.toContain('is_admin(');
  });

  it('без requiresAuth нет проверки авторизации', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).not.toContain('check_auth(');
  });

  it('несколько триггеров → несколько обработчиков', () => {
    const r = generateCallbackTriggers(validParamsMultiple);
    const count = (r.match(/@dp\.callback_query\(/g) || []).length;
    expect(count).toBe(3);
  });

  it('синтаксически корректный Python — нет незакрытых скобок', () => {
    const r = generateCallbackTriggers(validParamsExact);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });
});

// ─── callbackTriggerParamsSchema ─────────────────────────────────────────────

describe('callbackTriggerParamsSchema', () => {
  it('принимает валидные параметры exact', () => {
    expect(callbackTriggerParamsSchema.safeParse(validParamsExact).success).toBe(true);
  });

  it('принимает валидные параметры startswith', () => {
    expect(callbackTriggerParamsSchema.safeParse(validParamsStartswith).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(callbackTriggerParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько триггеров', () => {
    expect(callbackTriggerParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет пустой callbackData', () => {
    expect(callbackTriggerParamsSchema.safeParse(invalidParamsMissingCallbackData).success).toBe(false);
  });

  it('отклоняет неверный matchType', () => {
    const bad = { entries: [{ nodeId: 'n1', callbackData: 'data', matchType: 'contains', targetNodeId: 't1', targetNodeType: 'message' }] };
    expect(callbackTriggerParamsSchema.safeParse(bad).success).toBe(false);
  });
});

// ─── collectCallbackTriggerEntries() ─────────────────────────────────────────

describe('collectCallbackTriggerEntries()', () => {
  it('собирает триггер с правильными полями (exact)', () => {
    const entries = collectCallbackTriggerEntries(nodesWithCallbackTriggerExact);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_confirm');
    expect(entries[0].callbackData).toBe('confirm_order');
    expect(entries[0].matchType).toBe('exact');
    expect(entries[0].targetNodeId).toBe('msg_confirmed');
  });

  it('собирает триггер с matchType startswith', () => {
    const entries = collectCallbackTriggerEntries(nodesWithCallbackTriggerStartswith);
    expect(entries).toHaveLength(1);
    expect(entries[0].matchType).toBe('startswith');
  });

  it('пропускает триггер без autoTransitionTo', () => {
    expect(collectCallbackTriggerEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает триггер с пустым callbackData', () => {
    expect(collectCallbackTriggerEntries(nodesWithEmptyCallbackData)).toHaveLength(0);
  });

  it('пропускает узлы не типа callback_trigger', () => {
    expect(collectCallbackTriggerEntries(nodesWithoutCallbackTriggers)).toHaveLength(0);
  });

  it('фильтрует null узлы', () => {
    const entries = collectCallbackTriggerEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('trigger_confirm');
  });

  it('возвращает пустой массив для пустого входа', () => {
    expect(collectCallbackTriggerEntries([])).toEqual([]);
  });

  it('передаёт adminOnly из узла', () => {
    const entries = collectCallbackTriggerEntries(nodesWithAdminOnly);
    expect(entries[0].adminOnly).toBe(true);
  });

  it('передаёт requiresAuth из узла', () => {
    const entries = collectCallbackTriggerEntries(nodesWithRequiresAuth);
    expect(entries[0].requiresAuth).toBe(true);
  });
});

// ─── generateCallbackTriggerHandlers() ───────────────────────────────────────

describe('generateCallbackTriggerHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateCallbackTriggerHandlers([])).toBe('');
  });

  it('генерирует exact из узлов напрямую', () => {
    const r = generateCallbackTriggerHandlers(nodesWithCallbackTriggerExact);
    expect(r).toContain('lambda c: c.data == "confirm_order"');
    expect(r).toContain('handle_callback_msg_confirmed');
  });

  it('генерирует startswith из узлов напрямую', () => {
    const r = generateCallbackTriggerHandlers(nodesWithCallbackTriggerStartswith);
    expect(r).toContain('c.data.startswith("order_")');
  });

  it('фильтрует null узлы и не-триггеры', () => {
    const r = generateCallbackTriggerHandlers(nodesWithNullAndMixed);
    expect(r).toContain('lambda c: c.data == "confirm"');
  });

  it('узлы без callback_trigger → пустая строка', () => {
    expect(generateCallbackTriggerHandlers(nodesWithoutCallbackTriggers)).toBe('');
  });
});

// ─── Переменные callback_data и button_text ───────────────────────────────────

describe('Переменные callback_data и button_text', () => {
  it('генерирует сохранение user_data["callback_data"]', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('user_data[user_id]["callback_data"]');
  });

  it('генерирует сохранение user_data["button_text"]', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('user_data[user_id]["button_text"]');
  });

  /**
   * Проверяет, что button_text читается из reply_markup в рантайме,
   * а не из статичной строки _btn_text_map
   */
  it('buttonText из entry используется как значение button_text', () => {
    const paramsWithText: CallbackTriggerTemplateParams = {
      entries: [{ ...validParamsExact.entries[0], buttonText: 'Подтвердить заказ' }],
    };
    const r = generateCallbackTriggers(paramsWithText);
    // Рантайм-чтение из reply_markup должно присутствовать в коде
    expect(r).toContain('reply_markup');
    // Fallback на buttonText из entry тоже должен быть
    expect(r).toContain('"Подтвердить заказ"');
  });

  it('без buttonText используется callbackData как fallback', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('"confirm_order"');
  });
});

// ─── Рантайм-чтение button_text из reply_markup ───────────────────────────────

describe('Рантайм-чтение button_text из reply_markup', () => {
  /**
   * Проверяет наличие чтения из callback_query.message.reply_markup
   */
  it('генерирует чтение из callback_query.message.reply_markup', () => {
    const r = generateCallbackTriggers(validParamsExact);
    expect(r).toContain('reply_markup');
    expect(r).toContain('inline_keyboard');
  });

  /**
   * Проверяет наличие try/except для безопасного чтения reply_markup
   */
  it('генерирует try/except вокруг чтения reply_markup', () => {
    const r = generateCallbackTriggers(validParamsExact);
    // Должен быть try/except для безопасного чтения
    expect(r).toContain('try:');
    expect(r).toContain('except Exception:');
  });

  /**
   * Проверяет fallback на entry.buttonText если reply_markup пуст
   */
  it('генерирует fallback на entry.buttonText если reply_markup пуст', () => {
    const paramsWithText: CallbackTriggerTemplateParams = {
      entries: [{ ...validParamsExact.entries[0], buttonText: 'Подтвердить заказ' }],
    };
    const r = generateCallbackTriggers(paramsWithText);
    // Fallback строка должна быть в коде
    expect(r).toContain('"Подтвердить заказ"');
  });

  /**
   * Проверяет fallback на callbackData если buttonText не задан
   */
  it('генерирует fallback на callbackData если buttonText не задан', () => {
    const r = generateCallbackTriggers(validParamsExact);
    // Fallback на callbackData
    expect(r).toContain('"confirm_order"');
  });

  /**
   * Проверяет, что каждый триггер имеет свой блок чтения reply_markup
   */
  it('несколько триггеров — каждый имеет свой блок чтения reply_markup', () => {
    const r = generateCallbackTriggers(validParamsMultiple);
    // Каждый обработчик должен иметь свой _cb_btn_text
    const count = (r.match(/_cb_btn_text/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  /**
   * Проверяет корректность синтаксиса Python с рантайм-чтением
   */
  it('синтаксис Python корректен с рантайм-чтением', () => {
    const r = generateCallbackTriggers(validParamsMultiple);
    const opens = (r.match(/\(/g) || []).length;
    const closes = (r.match(/\)/g) || []).length;
    expect(opens).toBe(closes);
  });
});

// ─── Виртуальные callback_trigger из customCallbackData кнопок ────────────────

describe('Виртуальные callback_trigger из customCallbackData', () => {
  it('collectVirtualCallbackTriggerEntries: собирает виртуальные триггеры из кнопок', () => {
    const entries = collectVirtualCallbackTriggerEntries(nodesWithCustomCallbackButtons);
    expect(entries).toHaveLength(2);
    expect(entries.map(e => e.callbackData)).toContain('yes');
    expect(entries.map(e => e.callbackData)).toContain('no');
  });

  it('collectVirtualCallbackTriggerEntries: дедупликация по callbackData+target', () => {
    /** Две кнопки с одинаковым customCallbackData к одной ноде — один entry */
    const nodes = [makeNode('src', 'message', {
      keyboardType: 'inline',
      buttons: [
        { id: 'b1', text: 'Да', action: 'goto', target: 'dst', customCallbackData: 'yes' },
        { id: 'b2', text: 'Да тоже', action: 'goto', target: 'dst', customCallbackData: 'yes' },
      ],
    }), makeNode('dst', 'message', {})];
    const entries = collectVirtualCallbackTriggerEntries(nodes as any);
    expect(entries).toHaveLength(1);
  });

  it('collectVirtualCallbackTriggerEntries: пропускает кнопки без customCallbackData', () => {
    const entries = collectVirtualCallbackTriggerEntries(nodesWithCallbackTriggerExact);
    expect(entries).toHaveLength(0);
  });

  it('collectVirtualCallbackTriggerEntries: пропускает кнопки без target', () => {
    const nodes = [makeNode('src', 'message', {
      keyboardType: 'inline',
      buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', customCallbackData: 'cb', target: '' }],
    })];
    const entries = collectVirtualCallbackTriggerEntries(nodes as any);
    expect(entries).toHaveLength(0);
  });

  it('generateCallbackTriggerHandlers: виртуальные триггеры генерируют обработчики', () => {
    const r = generateCallbackTriggerHandlers(nodesWithCustomCallbackButtons as any);
    expect(r).toContain('lambda c: c.data == "yes"');
    expect(r).toContain('lambda c: c.data == "no"');
  });

  it('generateCallbackTriggerHandlers: явный callback_trigger имеет приоритет над виртуальным', () => {
    /** Если есть явный callback_trigger с тем же callbackData — виртуальный не добавляется */
    const nodes = [
      makeNode('explicit_trigger', 'callback_trigger', { callbackData: 'yes', matchType: 'exact', autoTransitionTo: 'msg_answer' }),
      makeNode('msg_src', 'message', {
        keyboardType: 'inline',
        buttons: [{ id: 'btn_yes', text: 'Да', action: 'goto', target: 'msg_answer', customCallbackData: 'yes' }],
      }),
      makeNode('msg_answer', 'message', {}),
    ];
    const r = generateCallbackTriggerHandlers(nodes as any);
    /** Должен быть только один обработчик для "yes" */
    const count = (r.match(/lambda c: c\.data == "yes"/g) || []).length;
    expect(count).toBe(1);
  });
});

// ─── Производительность ──────────────────────────────────────────────────────

describe('Производительность', () => {
  it('generateCallbackTriggers: быстрее 100ms', () => {
    const start = Date.now();
    generateCallbackTriggers(validParamsMultiple);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('generateCallbackTriggerHandlers: быстрее 100ms', () => {
    const start = Date.now();
    generateCallbackTriggerHandlers(nodesWithCallbackTriggerExact);
    expect(Date.now() - start).toBeLessThan(100);
  });
});
