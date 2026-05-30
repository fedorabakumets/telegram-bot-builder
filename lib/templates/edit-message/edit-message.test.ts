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

// ─── dynamic callbackPattern (customCallbackData с переменными) ───────────────

describe('dynamic callbackPattern (customCallbackData with variables)', () => {
  it('generates startsWith when customCallbackData contains {variable}', () => {
    const nodes = [
      makeNode('edit_approve', 'edit_message', { editMode: 'text', editMessageText: 'Одобрено', editFormatMode: 'html', autoTransitionTo: 'msg_next' }),
      makeNode('kb1', 'keyboard', { buttons: [{ id: 'b1', text: 'OK', action: 'goto', target: 'edit_approve', customCallbackData: 'edit_approve_{user_id}' }], keyboardType: 'inline' }),
      makeNode('msg_next', 'message', { messageText: 'Done' }),
    ];
    const code = generateEditMessageHandlers(nodes);
    expect(code).toContain('c.data.startswith("edit_approve_")');
    expect(code).not.toContain('c.data == "edit_approve"');
  });

  it('extracts _cb_dynamic_id from callback suffix', () => {
    const nodes = [
      makeNode('edit_reject', 'edit_message', { editMode: 'text', editMessageText: 'Отклонено', editFormatMode: 'none', autoTransitionTo: '' }),
      makeNode('kb1', 'keyboard', { buttons: [{ id: 'b1', text: 'No', action: 'goto', target: 'edit_reject', customCallbackData: 'edit_reject_{user_id}' }], keyboardType: 'inline' }),
    ];
    const code = generateEditMessageHandlers(nodes);
    expect(code).toContain('_cb_dynamic_id');
    expect(code).toContain('set_user_var');
  });

  it('uses exact match when no customCallbackData targets the node', () => {
    const nodes = [
      makeNode('edit_plain', 'edit_message', { editMode: 'text', editMessageText: 'Plain', editFormatMode: 'none', autoTransitionTo: 'msg1' }),
      makeNode('msg1', 'message', { messageText: 'Next' }),
    ];
    const code = generateEditMessageHandlers(nodes);
    expect(code).toContain('c.data == "edit_plain"');
    expect(code).not.toContain('startswith');
  });

  it('uses exact match when customCallbackData has no variables', () => {
    const nodes = [
      makeNode('edit_static', 'edit_message', { editMode: 'text', editMessageText: 'Static', editFormatMode: 'none', autoTransitionTo: '' }),
      makeNode('kb1', 'keyboard', { buttons: [{ id: 'b1', text: 'Go', action: 'goto', target: 'edit_static', customCallbackData: 'my_static_cb' }], keyboardType: 'inline' }),
    ];
    const code = generateEditMessageHandlers(nodes);
    expect(code).toContain('c.data == "my_static_cb"');
    expect(code).not.toContain('startswith');
  });
});
