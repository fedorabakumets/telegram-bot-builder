/** @fileoverview Публичные start-метки, auth-префиксы и адресность групповых команд проверяются независимо от атрибуции. */
import { describe, expect, it } from 'vitest';
import { parseStartObservation, type StartObservationRow } from './start-observation';
const row: StartObservationRow = { id: 1, user_id: '100', message_type: 'user', message_text: '/start channel_post', message_data: {},
  telegram_message_id: 10, chat_type: 'private', chat_id: '100', created_at: new Date('2026-10-01'), directed_event: false, is_bot: false };
describe('Безопасное наблюдение /start', () => {
  it('выделяет метку и физический ключ, не подтверждая источник или реферера', () => {
    expect(parseStartObservation(row, 'first_bot').observation).toMatchObject({ key: 'msg:100:10', marker: 'channel_post', category: 'marker' });
    expect(parseStartObservation({ ...row, message_text: '/start ref_42' }, 'first_bot').observation).toMatchObject({ marker: 'ref_42', category: 'referral_unknown' });
    expect(parseStartObservation({ ...row, message_text: '/start' }, 'first_bot').observation).toMatchObject({ marker: null, category: 'no_marker' });
  });
  it('никогда не сохраняет голые, вложенные, длинные или уже скрытые auth-параметры', () => {
    for (const payload of ['link_', 'link_secret', 'campaign_link_secret', 'LINK_SECRET', 'link_[скрыто]', `link_${'x'.repeat(100)}`]) {
      const value = parseStartObservation({ ...row, message_text: `/start ${payload}` }, 'first_bot');
      expect(value.observation).toMatchObject({ marker: null, category: 'auth_candidate' });
      expect(JSON.stringify(value)).not.toContain(payload);
    }
    expect(parseStartObservation({ ...row, message_text: `/start ${'x'.repeat(65)}` }, 'first_bot').reason).toBe('invalid_public_marker');
  });
  it('исключает чужого бота, недоказанную групповую команду, ботов и анонимных отправителей', () => {
    expect(parseStartObservation({ ...row, message_text: '/start@other_bot public' }, 'first_bot').reason).toBe('other_bot_command');
    const group = { ...row, chat_type: 'group', chat_id: '-100' };
    expect(parseStartObservation(group, 'first_bot').reason).toBe('unconfirmed_group_command');
    expect(parseStartObservation({ ...group, directed_event: true }, 'first_bot').observation?.marker).toBe('channel_post');
    expect(parseStartObservation({ ...group, message_text: '/start@FIRST_BOT public' }, 'first_bot').observation?.key).toBe('msg:-100:10');
    for (const message_data of [{ from_user: { is_bot: true } }, { from: { is_bot: true } }, { sender_chat: { id: -100 } }]) {
      expect(parseStartObservation({ ...row, message_data }, 'first_bot').reason).toBe('not_human_message');
    }
    expect(parseStartObservation({ ...row, telegram_message_id: null }, 'first_bot').reason).toBe('message_identity_missing');
  });
});
