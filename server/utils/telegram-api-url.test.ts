/**
 * @fileoverview Проверка выбора и валидации адреса Telegram Bot API.
 */
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { setRuntimeOverlay } from '../services/runtime-overlay';
import { isLocalTelegramResponse } from '../admin/telegram-connection-test';
import { getTelegramApiBaseUrl, validateTelegramApiUrl } from './telegram-api-url';

afterEach(() => setRuntimeOverlay({}));

test('выбирает официальный сервер по умолчанию и локальный из настроек', () => {
  setRuntimeOverlay({ TELEGRAM_BOT_API_MODE: 'official', TELEGRAM_BOT_API_URL: 'http://localhost:8081' });
  assert.equal(getTelegramApiBaseUrl(), 'https://api.telegram.org');
  setRuntimeOverlay({ TELEGRAM_BOT_API_MODE: 'local', TELEGRAM_BOT_API_URL: 'http://localhost:8081/' });
  assert.equal(getTelegramApiBaseUrl(), 'http://localhost:8081');
  assert.equal(getTelegramApiBaseUrl({ apiMode: 'local', apiUrl: 'http://127.0.0.1:8081' }), 'http://127.0.0.1:8081');
});

test('отклоняет небезопасные и неполные адреса', () => {
  for (const address of ['', 'localhost:8081', 'ftp://localhost', 'http://user:pass@localhost', 'http://localhost/path', 'http://localhost/?x=1']) {
    assert.throws(() => validateTelegramApiUrl(address));
  }
  assert.throws(() => getTelegramApiBaseUrl({ apiMode: 'local', apiUrl: '' }));
  assert.throws(() => getTelegramApiBaseUrl({ apiMode: 'unknown', apiUrl: '' }));
});

test('проверка локального сервера распознаёт ожидаемый ответ на фиктивный токен', () => {
  assert.equal(isLocalTelegramResponse(401, { ok: false, error_code: 401, description: 'Unauthorized: invalid token specified' }), true);
  assert.equal(isLocalTelegramResponse(404, null), false);
  assert.equal(isLocalTelegramResponse(401, { ok: false, error_code: 401, description: 'Unauthorized' }), false);
});
