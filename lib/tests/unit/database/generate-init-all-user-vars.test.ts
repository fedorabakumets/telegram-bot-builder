/**
 * @fileoverview Тесты для функции генерации init_all_user_vars
 * @module lib/tests/unit/database/generate-init-all-user-vars.test
 * @deprecated Тесты устарели после миграции на Jinja2 шаблоны
 *
 * Примечание: Функция generateInitAllUserVars была удалена после миграции на Jinja2 шаблоны.
 * Её функциональность теперь реализована в шаблоне:
 * - lib/templates/database/database.py.jinja2 (функция init_all_user_vars)
 *
 * Тесты требуют переписывания для проверки output Jinja2 шаблонов.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

describe('generateInitAllUserVars - DEPRECATED', () => {
  it('тесты устарели после миграции на Jinja2 - требуется переписывание', () => {
    assert.ok(true, 'Тесты требуют обновления для Jinja2');
  });
});
