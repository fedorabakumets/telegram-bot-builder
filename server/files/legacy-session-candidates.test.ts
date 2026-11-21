/** @fileoverview Не допускает обход проверки сессии через пользовательские переменные. */
import { describe, expect, it } from 'vitest';
import { legacySessionCandidates } from './legacy-session-candidates';

describe('Кандидаты старой сессии', () => {
  it('проверяет запись токена и каждую переменную независимо от регистра и порядка', () => {
    expect(legacySessionCandidates('stored-session', [
      { key: 'USERBOT_SESSION_STRING', value: 'other-session' },
      { key: 'userbot_session_string', value: 'third-session' },
      { key: 'USERBOT_SESSION_STRING', value: 'stored-session' },
      { key: 'UNRELATED', value: 'ignored' },
    ])).toEqual(['stored-session', 'other-session', 'third-session']);
  });

  it('не теряет пользовательскую сессию при пустой записи токена', () => {
    expect(legacySessionCandidates('', [{ key: 'USERBOT_SESSION_STRING', value: 'custom-session' }]))
      .toEqual(['custom-session']);
    expect(legacySessionCandidates(null, [])).toEqual([]);
  });
});
