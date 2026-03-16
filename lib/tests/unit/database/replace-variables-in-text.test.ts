/**
 * @fileoverview Тесты для функции замены переменных в тексте
 * @module lib/tests/unit/database/replace-variables-in-text.test
 * @deprecated Тесты устарели после миграции на Jinja2 шаблоны
 *
 * Примечание: Функции replace_variables_in_text, generateUniversalVariableReplacement,
 * и init_user_variables были удалены после миграции на Jinja2 шаблоны.
 * Их функциональность теперь реализована в шаблонах:
 * - lib/templates/database/database.py.jinja2
 * - lib/templates/universal-handlers/universal-handlers.py.jinja2
 *
 * Тесты требуют переписывания для проверки output Jinja2 шаблонов.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

describe('ReplaceVariablesInText (Python Code Generator) - DEPRECATED', () => {
  it('тесты устарели после миграции на Jinja2 - требуется переписывание', () => {
    // Примечание: эта функциональность теперь реализована через Jinja2 шаблоны
    // Тесты требуют переписывания для проверки output шаблонов
    assert.ok(true, 'Тесты требуют обновления для Jinja2');
  });
});
