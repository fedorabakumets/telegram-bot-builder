/**
 * @fileoverview Unit-тесты для шаблона userbot-message
 * @module templates/userbot-message/userbot-message.test
 */

import { describe, it, expect } from 'vitest';
import { generateUserbotMessage, generateUserbotMessageHandlers } from './userbot-message.renderer';
import { userbotMessageParamsSchema } from './userbot-message.schema';
import type { Node } from '@shared/schema';

describe('generateUserbotMessage()', () => {
  it('генерирует обработчик с текстом', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-1',
      messageText: 'Привет!',
      userbotEntity: '@test',
    });
    expect(code).toContain('handle_callback_ub_1');
    expect(code).toContain('userbot_client.send_message');
    expect(code).toContain('@test');
  });

  it('использует get_content при наличии projectId', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-2',
      messageText: 'Текст',
      userbotEntity: '@ch',
      projectId: 42,
    });
    expect(code).toContain('get_content("ub-2"');
    expect(code).toContain('get_content("ub-2.entity"');
  });

  it('не использует get_content без projectId', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-3',
      messageText: 'Текст',
      userbotEntity: '@ch',
      projectId: null,
    });
    expect(code).not.toContain('get_content');
  });

  it('генерирует отправку локального файла', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-4',
      messageText: 'Фото',
      userbotEntity: 'me',
      attachedMedia: ['/uploads/1/photo.jpg'],
    });
    expect(code).toContain('send_file');
    expect(code).toContain('get_upload_file_path');
    expect(code).toContain('/uploads/1/photo.jpg');
  });

  it('генерирует отправку по URL', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-5',
      messageText: 'Видео',
      userbotEntity: '-1001234',
      attachedMedia: ['https://example.com/video.mp4'],
    });
    expect(code).toContain('send_file');
    expect(code).toContain('https://example.com/video.mp4');
  });

  it('генерирует альбом из нескольких файлов', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-6',
      messageText: 'Альбом',
      userbotEntity: '@group',
      attachedMedia: ['/uploads/1/a.jpg', '/uploads/1/b.jpg'],
    });
    expect(code).toContain('_album_files');
    expect(code).toContain('send_file(_target, _album_files');
  });

  it('генерирует saveMessageIdTo', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-7',
      messageText: 'Тест',
      userbotEntity: 'me',
      saveMessageIdTo: 'msg_id',
    });
    expect(code).toContain('msg_id');
    expect(code).toContain('set_user_var');
  });

  it('генерирует автопереход', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-8',
      messageText: 'Тест',
      userbotEntity: 'me',
      autoTransitionTo: 'next-node',
    });
    expect(code).toContain('handle_callback_next_node');
    expect(code).toContain('FakeCallbackQuery');
  });

  it('устанавливает parse_mode html', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-9',
      messageText: '<b>Bold</b>',
      userbotEntity: 'me',
      formatMode: 'html',
    });
    expect(code).toContain("_parse_mode = 'html'");
  });

  it('устанавливает parse_mode markdown', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-10',
      messageText: '**Bold**',
      userbotEntity: 'me',
      formatMode: 'markdown',
    });
    expect(code).toContain("_parse_mode = 'md'");
  });

  it('отключает link_preview', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-11',
      messageText: 'https://example.com',
      userbotEntity: 'me',
      disableLinkPreview: true,
    });
    expect(code).toContain('link_preview=False');
  });

  it('обрабатывает FloodWait', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-12',
      messageText: 'Тест',
      userbotEntity: 'me',
    });
    expect(code).toContain('FloodWaitError');
    expect(code).toContain('asyncio.sleep');
  });

  it('генерирует event listener для saveResponseIdTo', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-13',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveResponseIdTo: 'resp_id',
    });
    expect(code).toContain('events.NewMessage(chats=_resp_entity)');
    expect(code).toContain('_on_resp_ub_13');
    expect(code).toContain('asyncio.wait_for(_resp_future');
    expect(code).toContain('remove_event_handler(_on_resp_ub_13');
    expect(code).toContain('resp_id');
    expect(code).not.toContain('await asyncio.sleep(3)\n    _resp_msgs');
  });

  it('генерирует saveResponseTextTo вместе с saveResponseIdTo', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-14',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveResponseIdTo: 'resp_id',
      saveResponseTextTo: 'resp_text',
    });
    expect(code).toContain('resp_text');
    expect(code).toContain('_resp_msg.text');
    expect(code).toContain('set_user_var(user_id, "resp_text"');
  });

  it('использует стратегию first в fallback', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-15',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveResponseIdTo: 'resp_id',
      responseStrategy: 'first',
    });
    expect(code).toContain('_bot_msgs[0] if _bot_msgs else None');
    expect(code).not.toContain('_max_len');
  });

  it('использует стратегию longest в fallback по умолчанию', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-16',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveResponseIdTo: 'resp_id',
      responseStrategy: 'longest',
    });
    expect(code).toContain('_max_len');
    expect(code).toContain('longest');
  });

  it('использует стратегию regex_match: сбор сообщений за таймаут', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-17',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveResponseIdTo: 'resp_id',
      responseStrategy: 'regex_match',
      responseFilterRegex: 'К оплате',
      responseWaitSeconds: 8,
    });
    expect(code).toContain('import re as _re_resp');
    expect(code).toContain('_resp_collected');
    expect(code).toContain('_resp_best_len');
    expect(code).toContain('_resp_future');
    expect(code).toContain('await asyncio.wait_for(_resp_future');
    expect(code).toContain('regex_match (event)');
    expect(code).toContain('events.MessageEdited(chats=_resp_entity)');
  });

  it('regex_match со saveResponseTextTo берёт текст выбранной заявки', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-17b',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveResponseIdTo: 'resp_id',
      saveResponseTextTo: 'crazy_text',
      responseStrategy: 'regex_match',
      responseFilterRegex: 'К оплате',
      responseWaitSeconds: 10,
    });
    expect(code).toContain('_pool[-2]');
    expect(code).toContain('_resp_msg.text');
    expect(code).toContain('Информация по заявке');
  });

  it('regex_match учитывает текст inline-кнопки (GIF без подписи)', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-17c',
      messageText: '/start',
      userbotEntity: '@LuckyExchange_Bot',
      saveResponseIdTo: 'lucky_resp1',
      responseStrategy: 'regex_match',
      responseFilterRegex: 'Купить',
      responseWaitSeconds: 12,
    });
    expect(code).toContain('Inline-кнопка: текст кнопки совпадает с regex');
    expect(code).toContain('_btn_best_id');
  });

  it('использует кастомный таймаут responseWaitSeconds', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-18',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveResponseIdTo: 'resp_id',
      responseWaitSeconds: 10,
    });
    expect(code).toContain('timeout=10');
  });

  it('генерирует saveButtonsTo вместе с saveResponseIdTo', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-19',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveResponseIdTo: 'resp_id',
      saveButtonsTo: 'buttons_json',
    });
    expect(code).toContain('buttons_json');
    // Шаблон использует `import json as _json_btns`, поэтому проверяем оба варианта
    const hasDumps = code.includes('json.dumps') || code.includes('_json_btns.dumps');
    expect(hasDumps).toBe(true);
    expect(code).toContain('reply_markup');
    expect(code).toContain('set_user_var(user_id, "buttons_json"');
    expect(code).toContain('_btns_src_msg');
    expect(code).toContain('Кнопки взяты из сообщения');
  });

  it('не генерирует saveButtonsTo без saveResponseIdTo', () => {
    const code = generateUserbotMessage({
      nodeId: 'ub-20',
      messageText: 'Тест',
      userbotEntity: '@bot',
      saveButtonsTo: 'buttons_json',
    });
    // Без saveResponseIdTo кнопки не сохраняются (нет ответа для парсинга)
    expect(code).not.toContain('reply_markup');
  });
});

describe('userbotMessageParamsSchema', () => {
  it('валидирует минимальные параметры', () => {
    const result = userbotMessageParamsSchema.parse({ nodeId: 'test' });
    expect(result.nodeId).toBe('test');
    expect(result.messageText).toBe('');
    expect(result.formatMode).toBe('html');
  });

  it('валидирует полные параметры', () => {
    const result = userbotMessageParamsSchema.parse({
      nodeId: 'ub-1',
      messageText: 'Привет',
      formatMode: 'markdown',
      userbotEntity: '@test',
      attachedMedia: ['/uploads/1/f.jpg'],
      saveMessageIdTo: 'id',
      autoTransitionTo: 'next',
      projectId: 5,
    });
    expect(result.formatMode).toBe('markdown');
    expect(result.attachedMedia).toHaveLength(1);
    expect(result.projectId).toBe(5);
  });

  it('применяет дефолты', () => {
    const result = userbotMessageParamsSchema.parse({ nodeId: 'x' });
    expect(result.disableLinkPreview).toBe(false);
    expect(result.attachedMedia).toEqual([]);
    expect(result.projectId).toBeNull();
  });

  it('отклоняет невалидный formatMode', () => {
    expect(() => userbotMessageParamsSchema.parse({
      nodeId: 'x',
      formatMode: 'invalid',
    })).toThrow();
  });
});

describe('generateUserbotMessageHandlers()', () => {
  it('возвращает пустую строку если нет userbot_message нод', () => {
    const nodes = [
      { id: 'msg-1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Hi' } },
    ] as Node[];
    expect(generateUserbotMessageHandlers(nodes)).toBe('');
  });

  it('генерирует код для userbot_message нод', () => {
    const nodes = [
      {
        id: 'ub-1',
        type: 'userbot_message' as any,
        position: { x: 0, y: 0 },
        data: { messageText: 'Test', userbotEntity: '@ch' },
      },
    ] as Node[];
    const code = generateUserbotMessageHandlers(nodes, 1);
    expect(code).toContain('handle_callback_ub_1');
    expect(code).toContain('get_content');
  });

  it('фильтрует file_id из attachedMedia', () => {
    const nodes = [
      {
        id: 'ub-2',
        type: 'userbot_message' as any,
        position: { x: 0, y: 0 },
        data: {
          messageText: 'Test',
          userbotEntity: 'me',
          attachedMedia: [
            '/uploads/1/photo.jpg',
            '{"__type":"file_id","fileIdsByToken":{"1":"AgAC..."}}',
          ],
        },
      },
    ] as Node[];
    const code = generateUserbotMessageHandlers(nodes);
    expect(code).toContain('/uploads/1/photo.jpg');
    expect(code).not.toContain('AgAC');
  });

  it('генерирует несколько обработчиков', () => {
    const nodes = [
      { id: 'ub-a', type: 'userbot_message' as any, position: { x: 0, y: 0 }, data: { messageText: 'A', userbotEntity: '@a' } },
      { id: 'ub-b', type: 'userbot_message' as any, position: { x: 0, y: 0 }, data: { messageText: 'B', userbotEntity: '@b' } },
    ] as Node[];
    const code = generateUserbotMessageHandlers(nodes);
    expect(code).toContain('handle_callback_ub_a');
    expect(code).toContain('handle_callback_ub_b');
  });
});
