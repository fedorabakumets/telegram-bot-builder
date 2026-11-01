/** @fileoverview Проверка разрешённых целей прикрепления и исключения служебных блоков. */
import { describe, expect, it } from 'vitest';
import { canAttachNodeMedia } from '../panel/can-attach-node-media';

describe('Поддержка вложений блоком', () => {
  it.each(['message', 'start', 'command', 'media', 'broadcast', 'userbot_message'])('разрешает %s', type => {
    expect(canAttachNodeMedia({ type })).toBe(true);
  });
  it.each(['command_trigger', 'callback_trigger', 'keyboard', 'input', 'condition', 'http_request', 'edit_message', 'set_variable', 'unknown'])('исключает %s', type => {
    expect(canAttachNodeMedia({ type })).toBe(false);
  });
  it('исключает отсутствующий блок и неизвестный тип', () => {
    expect(canAttachNodeMedia(null)).toBe(false);
    expect(canAttachNodeMedia(undefined)).toBe(false);
    expect(canAttachNodeMedia({})).toBe(false);
  });
});
