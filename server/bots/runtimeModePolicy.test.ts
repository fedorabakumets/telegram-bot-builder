/** @fileoverview Адресные проверки приоритетов режима и освобождения памяти при вебхуке. */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRuntimeMode, resolveRuntimeModeSettings, validateRuntimeMode } from './runtimeModePolicy';

describe('сохранённый режим обработчика', () => {
  it('использует постоянную работу при отсутствии настроек', () => {
    assert.deepEqual(resolveRuntimeModeSettings([], null, {}), {
      mode: 'direct', source: 'default', launchMode: 'polling', requiresRestart: true,
    });
  });
  it('читает настройку сервера и возвращает только безопасные поля', () => {
    assert.deepEqual(resolveRuntimeModeSettings([], 'polling', { BOT_POLLING_MODE: 'process', BOT_TOKEN: 'secret' }), {
      mode: 'process', source: 'server', launchMode: 'polling', requiresRestart: true,
    });
  });
  it('индивидуальная постоянная работа перекрывает сон на сервере', () => {
    const settings = resolveRuntimeModeSettings([{ key: 'BOT_POLLING_MODE', value: 'direct' }], 'polling', {
      BOT_POLLING_MODE: 'ondemand',
    });
    assert.equal(settings.mode, 'direct');
    assert.equal(settings.source, 'bot');
  });
  it('отклоняет неизвестные и нечёткие значения', () => {
    for (const value of ['DIRECT', ' direct ', '', null, undefined, 1, {}, 'webhook']) {
      assert.throws(() => parseRuntimeMode(value));
    }
  });
  it('принимает все три режима для polling', () => {
    for (const mode of ['direct', 'ondemand', 'process'] as const) validateRuntimeMode(mode, 'polling');
  });
  it('при вебхуке разрешает постоянную работу и освобождение процесса', () => {
    validateRuntimeMode('direct', 'webhook');
    validateRuntimeMode('process', 'webhook');
    assert.throws(() => validateRuntimeMode('ondemand', 'webhook'));
  });
  it('сохраняет индивидуальный process при переключении транспорта на webhook', () => {
    const settings = resolveRuntimeModeSettings([{ key: 'BOT_POLLING_MODE', value: 'process' }], 'webhook', {
      BOT_POLLING_MODE: 'direct',
    }, 58);
    assert.equal(settings.mode, 'process');
    assert.equal(settings.source, 'bot');
    assert.equal(settings.launchMode, 'webhook');
    validateRuntimeMode(settings.mode, settings.launchMode);
  });
  it('учитывает серверный список только при отсутствии индивидуального режима', () => {
    const env = { BOT_POLLING_MODE: 'process', BOT_ON_DEMAND_TOKEN_IDS: '31, 32' };
    assert.equal(resolveRuntimeModeSettings([], 'polling', env, 31).mode, 'process');
    assert.equal(resolveRuntimeModeSettings([], 'polling', env, 35).mode, 'direct');
    assert.equal(resolveRuntimeModeSettings([{ key: 'BOT_POLLING_MODE', value: 'ondemand' }], 'polling', env, 35).mode, 'ondemand');
  });
});
