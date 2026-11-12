/** @fileoverview Проверки границ настроек воркеров и наследования режима без передачи секретов. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateWorkerSettings } from './runtime-worker-validation';
import { setRuntimeOverlay } from '../services/runtime-overlay';
import { withPollingRuntimeEnv } from '../bots/pollingRuntimeEnv';
import { resolveRuntimeModeSettings } from '../bots/runtimeModePolicy';

describe('проверка настроек воркеров', () => {
  it('принимает границы, перечисления и пустые значения наследования', () => {
    for (const value of [0.1, 86400, '30', '', undefined, null]) {
      assert.doesNotThrow(() => validateWorkerSettings({ BOT_ON_DEMAND_IDLE_SECONDS: value }));
    }
    for (const value of [0, '0', 1, 64, '4', '']) {
      assert.doesNotThrow(() => validateWorkerSettings({ BOT_ON_DEMAND_MAX_ACTIVE: value }));
    }
    for (const mode of ['direct', 'ondemand', 'process']) {
      assert.doesNotThrow(() => validateWorkerSettings({ BOT_POLLING_MODE: mode }));
    }
    for (const grouping of ['project', 'owner', 'shared']) {
      assert.doesNotThrow(() => validateWorkerSettings({ WORKER_GROUPING: grouping }));
    }
  });

  it('отклоняет значения вне диапазона и дробный предел обработчиков', () => {
    for (const value of [0, -1, 0.09, 86401, Infinity, NaN, true, false, 'не число']) {
      assert.throws(() => validateWorkerSettings({ BOT_ON_DEMAND_IDLE_SECONDS: value }));
    }
    for (const value of [-1, 1.5, 65, Infinity, NaN, true, false, 'не число']) {
      assert.throws(() => validateWorkerSettings({ BOT_ON_DEMAND_MAX_ACTIVE: value }));
    }
  });

  it('не сохраняет неизвестные режимы, объекты и недопустимые флаги', () => {
    for (const input of [
      { WORKER_GROUPING: 'isolated' }, { WORKER_RUNTIME: 'native' },
      { BOT_POLLING_MODE: 'shared' }, { USE_WORKER_POOL: 'on' },
      { BOT_ON_DEMAND_IDLE_SECONDS: [] }, { WORKER_CPUS: 0 },
      { WORKER_MEMORY_LIMIT: '12mb' },
    ]) assert.throws(() => validateWorkerSettings(input));
  });

  it('оверлей админки имеет приоритет, индивидуальный режим бота сохраняется', () => {
    const keys = ['BOT_POLLING_MODE', 'BOT_ON_DEMAND_TOKEN_IDS', 'BOT_ON_DEMAND_IDLE_SECONDS'];
    const original = keys.map((key) => [key, process.env[key]] as const);
    try {
      process.env.BOT_POLLING_MODE = 'direct';
      delete process.env.BOT_ON_DEMAND_TOKEN_IDS;
      setRuntimeOverlay({ BOT_POLLING_MODE: 'process', BOT_ON_DEMAND_IDLE_SECONDS: '45', DATABASE_URL: 'секрет' });
      assert.equal(resolveRuntimeModeSettings([], 'polling').mode, 'process');
      const inherited = withPollingRuntimeEnv([]);
      assert.equal(inherited.find((item) => item.key === 'BOT_ON_DEMAND_IDLE_SECONDS')?.value, '45');
      assert.ok(!inherited.some((item) => item.key === 'DATABASE_URL'));
      const own = [{ key: 'BOT_POLLING_MODE', value: 'ondemand' }];
      assert.equal(resolveRuntimeModeSettings(own, 'polling').mode, 'ondemand');
      assert.equal(withPollingRuntimeEnv(own).find((item) => item.key === 'BOT_POLLING_MODE')?.value, 'ondemand');
      setRuntimeOverlay({});
      assert.equal(resolveRuntimeModeSettings([], 'polling').mode, 'direct');
      assert.equal(resolveRuntimeModeSettings([], 'polling', {}).source, 'default');
    } finally {
      setRuntimeOverlay({});
      for (const [key, value] of original) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
  });
});
