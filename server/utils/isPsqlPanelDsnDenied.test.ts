/**
 * @fileoverview Тесты флага PSQL_PANEL_DSN_DENIED
 * @module server/utils/isPsqlPanelDsnDenied.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isPsqlPanelDsnDenied } from './isPsqlPanelDsnDenied';

describe('isPsqlPanelDsnDenied', () => {
  it('по умолчанию выключен', () => {
    assert.strictEqual(isPsqlPanelDsnDenied({}), false);
  });

  it('включается значениями true/1/yes без учёта регистра и пробелов', () => {
    for (const value of ['true', 'TRUE', ' 1 ', 'yes', 'Yes']) {
      assert.strictEqual(isPsqlPanelDsnDenied({ PSQL_PANEL_DSN_DENIED: value }), true, value);
    }
  });

  it('любые другие значения не включают запрет', () => {
    for (const value of ['', 'false', '0', 'no', 'on', 'enabled']) {
      assert.strictEqual(isPsqlPanelDsnDenied({ PSQL_PANEL_DSN_DENIED: value }), false, value);
    }
  });
});
