/**
 * @fileoverview Тесты для шаблона обработчиков узла answer_callback_query
 * @module templates/answer-callback-query/answer-callback-query.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateAnswerCallbackQuery,
  generateAnswerCallbackQueryHandlers,
  collectAnswerCallbackQueryEntries,
} from './answer-callback-query.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  nodesWithNode,
  nodesWithMissingTarget,
  nodesWithoutNodes,
  nodesWithNullAndMixed,
} from './answer-callback-query.fixture';
import { answerCallbackQueryParamsSchema } from './answer-callback-query.schema';

// ─── generateAnswerCallbackQuery() ───────────────────────────────────────────

describe('generateAnswerCallbackQuery()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateAnswerCallbackQuery(validParamsEmpty)).toBe('');
  });

  it('генерирует @dp.callback_query декоратор', () => {
    const r = generateAnswerCallbackQuery(validParamsSingle);
    expect(r).toContain('@dp.callback_query(lambda c: c.data == "node_id_123")');
  });

  it('имя функции содержит nodeId', () => {
    const r = generateAnswerCallbackQuery(validParamsSingle);
    expect(r).toContain('async def handle_callback_node_id_123');
  });

  it('вызывает callback_query.answer() с текстом', () => {
    const r = generateAnswerCallbackQuery(validParamsSingle);
    expect(r).toContain('await callback_query.answer(');
    expect(r).toContain('_notification_text');
  });

  it('передаёт show_alert=False когда showAlert=false', () => {
    const r = generateAnswerCallbackQuery(validParamsSingle);
    expect(r).toContain('show_alert=False');
  });

  it('передаёт show_alert=True и cache_time когда showAlert=true', () => {
    const r = generateAnswerCallbackQuery(validParamsMultiple);
    expect(r).toContain('show_alert=True');
    expect(r).toContain('cache_time=5');
  });

  it('вызывает handle_callback следующего узла', () => {
    const r = generateAnswerCallbackQuery(validParamsSingle);
    expect(r).toContain('await handle_callback_next_node(callback_query)');
  });

  it('без текста вызывает answer() без аргументов', () => {
    const r = generateAnswerCallbackQuery({
      entries: [{
        nodeId: 'acq_empty',
        targetNodeId: 'msg_1',
        targetNodeType: 'message',
        notificationText: '',
        showAlert: false,
        cacheTime: 0,
      }],
    });
    expect(r).toContain('await callback_query.answer()');
    expect(r).not.toContain('_notification_text');
  });
});

// ─── answerCallbackQueryParamsSchema ─────────────────────────────────────────

describe('answerCallbackQueryParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(answerCallbackQueryParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(answerCallbackQueryParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько узлов', () => {
    expect(answerCallbackQueryParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = { entries: [{ targetNodeId: 'msg_1', targetNodeType: 'message', notificationText: '', showAlert: false, cacheTime: 0 }] };
    expect(answerCallbackQueryParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectAnswerCallbackQueryEntries() ─────────────────────────────────────

describe('collectAnswerCallbackQueryEntries()', () => {
  it('возвращает пустой массив для пустого входа', () => {
    expect(collectAnswerCallbackQueryEntries([])).toEqual([]);
  });

  it('собирает узел с правильными полями', () => {
    const entries = collectAnswerCallbackQueryEntries(nodesWithNode);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('acq_1');
    expect(entries[0].targetNodeId).toBe('msg_1');
    expect(entries[0].notificationText).toBe('Готово!');
  });

  it('пропускает узел без autoTransitionTo', () => {
    expect(collectAnswerCallbackQueryEntries(nodesWithMissingTarget)).toHaveLength(0);
  });

  it('пропускает null узлы', () => {
    const entries = collectAnswerCallbackQueryEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('acq_1');
  });

  it('пропускает узлы не типа answer_callback_query', () => {
    expect(collectAnswerCallbackQueryEntries(nodesWithoutNodes)).toHaveLength(0);
  });
});

// ─── generateAnswerCallbackQueryHandlers() ───────────────────────────────────

describe('generateAnswerCallbackQueryHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateAnswerCallbackQueryHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateAnswerCallbackQueryHandlers(nodesWithNode);
    expect(r).toContain('handle_callback_acq_1');
    expect(r).toContain('handle_callback_msg_1');
  });

  it('фильтрует null узлы и не-action узлы', () => {
    const r = generateAnswerCallbackQueryHandlers(nodesWithNullAndMixed);
    expect(r).toContain('handle_callback_acq_1');
  });

  it('узлы без answer_callback_query → пустая строка', () => {
    expect(generateAnswerCallbackQueryHandlers(nodesWithoutNodes)).toBe('');
  });
});
