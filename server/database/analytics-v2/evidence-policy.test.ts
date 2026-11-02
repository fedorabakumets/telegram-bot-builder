/** @fileoverview Строгая граница между доказательством контакта, настоящим callback и обычной перепиской. */
import { describe, expect, it } from 'vitest';
import { classifyLegacyEvidence, validateEvidencePolicy, type LegacyEvidenceRow } from './evidence-policy';
const policy = validateEvidencePolicy({ projectId: 1, tokenId: 11, throughMessageId: 100, historicalUsername: 'FIRST_bot', writerSha256: 'a'.repeat(64) });
const base: LegacyEvidenceRow = { id: 1, user_id: '100', message_type: 'user', message_text: null, telegram_message_id: null,
  message_data: { button_clicked: true, button_text: 'Меню', callback_data: 'legacy' }, chat_type: 'supergroup', chat_id: '-100', created_at: new Date('2026-10-10'), node_id: null };
describe('Классификация аудированной истории', () => {
  it('принимает только точную форму проверенного callback writer', () => {
    expect(classifyLegacyEvidence(base, policy)).toBe('legacy_callback');
    for (const change of [{ node_id: 'synthetic' }, { telegram_message_id: 1 }, { user_id: '-100' }, { chat_type: 'channel' },
      { message_type: 'bot' }, { message_data: { button_clicked: true } }, { message_data: { ...base.message_data, synthetic: true } }]) {
      expect(classifyLegacyEvidence({ ...base, ...change }, policy)).toBeNull();
    }
  });
  it('обе канонические формы настоящего ID не требуют выдуманной идентичности', () => {
    for (const key of ['callback_query_id', 'callback_id']) expect(classifyLegacyEvidence({ ...base, message_data: { button_clicked: true, [key]: '123456' } }, policy)).toBe('physical_callback');
    expect(classifyLegacyEvidence({ ...base, message_data: { button_clicked: true, callback_query_id: '1', callback_id: '2' } }, policy)).toBeNull();
    expect(classifyLegacyEvidence({ ...base, message_data: { button_clicked: true, callback_id: 'not-a-telegram-id' } }, policy)).toBeNull();
  });
  it('принимает адресную команду с физическим ID и не угадывает обработку других текстов', () => {
    const message = { ...base, message_data: {}, telegram_message_id: 3, message_text: '/start@FIRST_BOT payload' };
    expect(classifyLegacyEvidence(message, policy)).toBe('addressed_command');
    for (const message_text of ['/start', '/start@other_bot', 'Привет @first_bot', '/команда@first_bot', '/start@first_bot_suffix']) {
      expect(classifyLegacyEvidence({ ...message, message_text }, policy)).toBeNull();
    }
    expect(classifyLegacyEvidence({ ...message, telegram_message_id: null }, policy)).toBeNull();
  });
});
