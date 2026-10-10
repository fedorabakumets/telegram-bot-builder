/**
 * @fileoverview Тесты поиска нод: URL/copyText в кнопках
 * @module lib/bot-tools/node-query-db.test
 */

import { describe, expect, it } from 'vitest';
import { buildSearchText } from './node-query-db.ts';

describe('buildSearchText', () => {
  it('находит подстроку URL в buttons[].url (регистронезависимо)', () => {
    const text = buildSearchText({
      id: 'msg-1',
      type: 'message',
      data: {
        messageText: 'Hello',
        buttons: [
          { id: 'b1', text: 'Open', action: 'url', url: 'https://TorLink.example/path' },
        ],
      },
    });
    expect(text.includes('torlink.example/path')).toBe(true);
    expect(text.includes('open')).toBe(true);
  });

  it('включает copyText и webAppUrl кнопок', () => {
    const text = buildSearchText({
      id: 'kb-1',
      type: 'keyboard',
      data: {
        buttons: [
          { id: 'c1', text: 'Copy', action: 'copy_text', copyText: 'PROMO-CODE-42' },
          { id: 'w1', text: 'App', action: 'web_app', webAppUrl: 'https://mini.app/start' },
        ],
      },
    });
    expect(text.includes('promo-code-42')).toBe(true);
    expect(text.includes('https://mini.app/start')).toBe(true);
  });

  it('включает href внутри messageText', () => {
    const text = buildSearchText({
      id: 'm2',
      type: 'message',
      data: { messageText: 'See <a href="https://docs.example/x">docs</a>' },
    });
    expect(text.includes('https://docs.example/x')).toBe(true);
  });
});
