/**
 * @fileoverview Unit-тесты для шаблона userbot-click-button
 * @module templates/userbot-click-button/userbot-click-button.test
 */

import { describe, it, expect } from 'vitest';
import { generateUserbotClickButton, generateUserbotClickButtonHandlers } from './userbot-click-button.renderer';
import { userbotClickButtonParamsSchema } from './userbot-click-button.schema';
import type { Node } from '@shared/schema';

describe('generateUserbotClickButton()', () => {
  it('генерирует обработчик с handle_callback_', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c1', userbotEntity: '@bot', messageId: '123', clickValue: 'Play' });
    expect(code).toContain('handle_callback_ub_c1');
  });

  it('содержит userbot_client.get_messages', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c2', userbotEntity: '@bot', messageId: '123', clickValue: 'X' });
    expect(code).toContain('userbot_client.get_messages');
  });

  it('clickMode=text → поиск кнопки по тексту', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c3', clickMode: 'text', clickValue: 'Играть' });
    expect(code).toContain('_click_val in _btn.text');
    expect(code).toContain('GetBotCallbackAnswerRequest');
  });

  it('clickMode=data → поиск кнопки по callback_data', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c4', clickMode: 'data', clickValue: 'menu_games' });
    expect(code).toContain("_click_val.encode('utf-8') in _btn.data");
    expect(code).toContain('GetBotCallbackAnswerRequest');
  });

  it('clickMode=index → парсинг индекса', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c5', clickMode: 'index', clickValue: '0, 1' });
    expect(code).toContain('_idx_parts');
    expect(code).toContain('_msg.reply_markup.rows[_r].buttons[_c]');
  });

  it('saveAlertTo → сохраняет alert', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c6', saveAlertTo: 'my_alert' });
    expect(code).toContain('my_alert');
    expect(code).toContain('set_user_var');
  });

  it('saveResultTo → сохраняет текст', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c7', saveResultTo: 'new_text' });
    expect(code).toContain('new_text');
    expect(code).toContain('_updated.text');
  });

  it('saveButtonsTo → сохраняет JSON кнопок', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c8', saveButtonsTo: 'btns' });
    expect(code).toContain('btns');
    expect(code).toContain('json.dumps');
  });

  it('saveHasMediaTo → сохраняет флаг медиа', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c9', saveHasMediaTo: 'has_m' });
    expect(code).toContain('has_m');
    expect(code).toContain('"true"');
    expect(code).toContain('"false"');
  });

  it('saveMediaTo → сохраняет медиа-объект', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c10', saveMediaTo: 'media_obj' });
    expect(code).toContain('media_obj');
    expect(code).toContain('_updated.media');
  });

  it('autoTransitionTo → FakeCallbackQuery', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c11', autoTransitionTo: 'next' });
    expect(code).toContain('handle_callback_next');
    expect(code).toContain('FakeCallbackQuery');
  });

  it('projectId → get_content для entity, msg_id, click_val', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c12', userbotEntity: '@b', messageId: '1', clickValue: 'X', projectId: 5 });
    expect(code).toContain('get_content("ub-c12.entity"');
    expect(code).toContain('get_content("ub-c12.msg_id"');
    expect(code).toContain('get_content("ub-c12.click_val"');
  });

  it('без projectId → нет get_content', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c13', userbotEntity: '@b', projectId: null });
    expect(code).not.toContain('get_content');
  });

  it('содержит FloodWait обработку', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c14' });
    expect(code).toContain('FloodWaitError');
  });

  it('содержит fire-and-forget через create_task', () => {
    const code = generateUserbotClickButton({ nodeId: 'ub-c15', saveResultTo: 'txt' });
    expect(code).toContain('asyncio.create_task(_fire_click())');
    expect(code).toContain('fire-and-forget');
  });

  it('messageIdSource=last → последнее сообщение бота с reply_markup', () => {
    const code = generateUserbotClickButton({
      nodeId: 'ub-c16',
      messageIdSource: 'last',
      clickValue: 'OK',
    });
    expect(code).toContain('limit=12');
    expect(code).toContain('_cand.reply_markup');
    expect(code).toContain('нет сообщений бота с кнопками');
  });
});

describe('userbotClickButtonParamsSchema', () => {
  it('валидирует минимальные параметры', () => {
    const result = userbotClickButtonParamsSchema.parse({ nodeId: 'test' });
    expect(result.nodeId).toBe('test');
    expect(result.clickMode).toBe('text');
  });

  it('валидирует полные параметры', () => {
    const result = userbotClickButtonParamsSchema.parse({
      nodeId: 'ub-c1',
      userbotEntity: '@bot',
      messageId: '123',
      clickMode: 'data',
      clickValue: 'menu',
      saveAlertTo: 'a',
      saveResultTo: 'r',
      saveButtonsTo: 'b',
      saveHasMediaTo: 'h',
      saveMediaTo: 'm',
      autoTransitionTo: 'next',
      projectId: 3,
    });
    expect(result.clickMode).toBe('data');
    expect(result.projectId).toBe(3);
  });

  it('отклоняет невалидный clickMode', () => {
    expect(() => userbotClickButtonParamsSchema.parse({ nodeId: 'x', clickMode: 'invalid' })).toThrow();
  });
});

describe('generateUserbotClickButtonHandlers()', () => {
  it('возвращает пустую строку без userbot_click_button нод', () => {
    const nodes = [{ id: 'msg-1', type: 'message', position: { x: 0, y: 0 }, data: {} }] as Node[];
    expect(generateUserbotClickButtonHandlers(nodes)).toBe('');
  });

  it('генерирует код для userbot_click_button нод', () => {
    const nodes = [{
      id: 'ub-c1', type: 'userbot_click_button' as any, position: { x: 0, y: 0 },
      data: { userbotEntity: '@bot', messageId: '1', clickValue: 'Go' },
    }] as Node[];
    const code = generateUserbotClickButtonHandlers(nodes, 1);
    expect(code).toContain('handle_callback_ub_c1');
    expect(code).toContain('get_content');
  });

  it('генерирует несколько обработчиков', () => {
    const nodes = [
      { id: 'c1', type: 'userbot_click_button' as any, position: { x: 0, y: 0 }, data: { clickValue: 'A' } },
      { id: 'c2', type: 'userbot_click_button' as any, position: { x: 0, y: 0 }, data: { clickValue: 'B' } },
    ] as Node[];
    const code = generateUserbotClickButtonHandlers(nodes);
    expect(code).toContain('handle_callback_c1');
    expect(code).toContain('handle_callback_c2');
  });
});
