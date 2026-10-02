/**
 * @fileoverview Тесты флага PSQL_BUILTIN_ENABLED
 * @module server/utils/isPsqlBuiltinEnabled.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isPsqlBuiltinEnabled } from './isPsqlBuiltinEnabled';

describe('isPsqlBuiltinEnabled', () => {
  it('по умолчанию выключен', () => {
    assert.strictEqual(isPsqlBuiltinEnabled({}), false);
  });

  it('включается значениями true/1/yes без учёта регистра и пробелов', () => {
    for (const value of ['true', 'TRUE', ' 1 ', 'yes']) {
      assert.strictEqual(isPsqlBuiltinEnabled({ PSQL_BUILTIN_ENABLED: value }), true, value);
    }
  });

  it('любые другие значения не включают builtin', () => {
    for (const value of ['', 'false', '0', 'no', 'on', 'enabled']) {
      assert.strictEqual(isPsqlBuiltinEnabled({ PSQL_BUILTIN_ENABLED: value }), false, value);
    }
  });
});
