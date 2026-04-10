/**
 * @fileoverview Тесты для шаблона обработчиков узла edit_message
 * @module templates/edit-message/edit-message.test
 */

import { describe, it, expect } from 'vitest';
import {
  generateEditMessage,
  generateEditMessageHandlers,
  collectEditMessageEntries,
} from './edit-message.renderer';
import {
  validParamsEmpty,
  validParamsSingle,
  validParamsMultiple,
  nodesWithNode,
  nodesWithoutNodes,
  nodesWithNullAndMixed,
  makeNode,
} from './edit-message.fixture';
import { editMessageParamsSchema } from './edit-message.schema';

// ─── generateEditMessage() ────────────────────────────────────────────────────

describe('generateEditMessage()', () => {
  it('пустой массив → пустая строка', () => {
    expect(generateEditMessage(validParamsEmpty)).toBe('');
  });

  it('генерирует @dp.callback_query декоратор', () => {
    const r = generateEditMessage(validParamsSingle);
    expect(r).toContain('@dp.callback_query(lambda c: c.data == "edit_1")');
  });

  it('имя функции содержит nodeId', () => {
    const r = generateEditMessage(validParamsSingle);
    expect(r).toContain('async def handle_callback_edit_1');
  });

  it('вызывает edit_message_text при editMode=text', () => {
    const r = generateEditMessage(validParamsSingle);
    expect(r).toContain('await bot.edit_message_text(');
  });

  it('передаёт parse_mode=HTML при editFormatMode=html', () => {
    const r = generateEditMessage(validParamsSingle);
    expect(r).toContain('parse_mode="HTML"');
  });

  it('вызывает edit_message_reply_markup при editMode=markup', () => {
    const r = generateEditMessage(validParamsMultiple);
    expect(r).toContain('await bot.edit_message_reply_markup(');
  });

  it('вызывает handle_callback следующего узла', () => {
    const r = generateEditMessage(validParamsSingle);
    expect(r).toContain('await handle_callback_next_node(callback_query)');
  });

  it('не вызывает handle_callback если targetNodeId пустой', () => {
    const r = generateEditMessage({
      entries: [{ ...validParamsMultiple.entries[1], nodeId: 'edit_no_target' }],
    });
    expect(r).not.toContain('await handle_callback_(callback_query)');
  });
});

// ─── editMessageParamsSchema ──────────────────────────────────────────────────

describe('editMessageParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(editMessageParamsSchema.safeParse(validParamsSingle).success).toBe(true);
  });

  it('принимает пустой массив', () => {
    expect(editMessageParamsSchema.safeParse(validParamsEmpty).success).toBe(true);
  });

  it('принимает несколько узлов', () => {
    expect(editMessageParamsSchema.safeParse(validParamsMultiple).success).toBe(true);
  });

  it('отклоняет отсутствие обязательного поля nodeId', () => {
    const invalid = {
      entries: [{
        targetNodeId: 'msg_1', targetNodeType: 'message',
        editMode: 'text', editMessageText: '', editFormatMode: 'none',
        editMessageIdSource: 'last_bot_message', editMessageIdManual: '',
        editKeyboardMode: 'keep', editKeyboardNodeId: '',
      }],
    };
    expect(editMessageParamsSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── collectEditMessageEntries() ─────────────────────────────────────────────

describe('collectEditMessageEntries()', () => {
  it('возвращает пустой массив для пустого входа', () => {
    expect(collectEditMessageEntries([])).toEqual([]);
  });

  it('собирает узел с правильными полями', () => {
    const entries = collectEditMessageEntries(nodesWithNode);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('edit_1');
    expect(entries[0].targetNodeId).toBe('msg_1');
    expect(entries[0].editMessageText).toBe('Привет!');
  });

  it('включает узел без autoTransitionTo (конечный узел)', () => {
    const nodes = [makeNode('edit_end', 'edit_message', { editMode: 'text', editMessageText: 'Конец' })];
    const entries = collectEditMessageEntries(nodes);
    expect(entries).toHaveLength(1);
    expect(entries[0].targetNodeId).toBe('');
  });

  it('пропускает null узлы', () => {
    const entries = collectEditMessageEntries(nodesWithNullAndMixed);
    expect(entries).toHaveLength(1);
    expect(entries[0].nodeId).toBe('edit_1');
  });

  it('пропускает узлы не типа edit_message', () => {
    expect(collectEditMessageEntries(nodesWithoutNodes)).toHaveLength(0);
  });
});

// ─── generateEditMessageHandlers() ───────────────────────────────────────────

describe('generateEditMessageHandlers()', () => {
  it('пустые узлы → пустая строка', () => {
    expect(generateEditMessageHandlers([])).toBe('');
  });

  it('генерирует код из узлов напрямую', () => {
    const r = generateEditMessageHandlers(nodesWithNode);
    expect(r).toContain('handle_callback_edit_1');
    expect(r).toContain('handle_callback_msg_1');
  });

  it('фильтрует null узлы и не-action узлы', () => {
    const r = generateEditMessageHandlers(nodesWithNullAndMixed);
    expect(r).toContain('handle_callback_edit_1');
  });

  it('узлы без edit_message → пустая строка', () => {
    expect(generateEditMessageHandlers(nodesWithoutNodes)).toBe('');
  });
});
