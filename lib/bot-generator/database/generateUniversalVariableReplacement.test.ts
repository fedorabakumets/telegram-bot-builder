/**
 * @fileoverview Тесты для generateUniversalVariableReplacement
 * @module generateUniversalVariableReplacement.test
 *
 * Покрывает проблему дублирования блока инициализации переменных
 * в каждом хендлере (проблема #2 и #3 из плана оптимизации).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUniversalVariableReplacement } from './generateUniversalVariableReplacement';

function generate(indent = '    ', node?: any): string {
  const lines: string[] = [];
  generateUniversalVariableReplacement(lines, { indentLevel: indent, node });
  return lines.join('\n');
}

function generateLegacy(indent = '    '): string {
  const lines: string[] = [];
  generateUniversalVariableReplacement(lines, indent);
  return lines.join('\n');
}

// ─── Базовая генерация ────────────────────────────────────────────────────────

describe('generateUniversalVariableReplacement()', () => {
  describe('инициализация all_user_vars', () => {
    it('вызывает init_all_user_vars', () => {
      const r = generate();
      assert.ok(r.includes('all_user_vars = await init_all_user_vars(user_id)'));
    });

    it('содержит комментарий инициализации', () => {
      const r = generate();
      assert.ok(r.includes('Инициализация all_user_vars'));
    });
  });

  describe('замена переменных в тексте', () => {
    it('вызывает replace_variables_in_text', () => {
      const r = generate();
      assert.ok(r.includes('text = replace_variables_in_text(text, all_user_vars, variable_filters)'));
    });

    it('инициализирует text пустой строкой если не определена', () => {
      const r = generate();
      assert.ok(r.includes("if 'text' not in locals():"));
      assert.ok(r.includes('text = ""'));
    });

    it('получает variable_filters из user_data', () => {
      const r = generate();
      assert.ok(r.includes('variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})'));
    });
  });

  describe('фильтры переменных из узла (проблема #2)', () => {
    it('сохраняет variableFilters если узел передан', () => {
      const node = { data: { variableFilters: { name: 'upper' }, messageText: '' } };
      const r = generate('    ', node);
      assert.ok(r.includes('_variable_filters'));
      assert.ok(r.includes('"name"'));
    });

    it('не генерирует _variable_filters если узел не передан', () => {
      const r = generate();
      assert.ok(!r.includes('_variable_filters" ='));
    });
  });

  describe('обратная совместимость (старый формат вызова)', () => {
    it('принимает строку как второй аргумент', () => {
      assert.doesNotThrow(() => generateLegacy('    '));
    });

    it('генерирует тот же код при строковом и объектном вызове', () => {
      const fromString = generateLegacy('    ');
      const fromObject = generate('    ');
      assert.strictEqual(fromString, fromObject);
    });
  });

  describe('отступы', () => {
    it('применяет переданный отступ', () => {
      const r = generate('        ');
      assert.ok(r.includes('        all_user_vars'));
    });

    it('без отступа — код без пробелов в начале', () => {
      const r = generate('');
      assert.ok(r.includes('all_user_vars = await init_all_user_vars(user_id)'));
      assert.ok(!r.startsWith('    '));
    });
  });

  describe('корректность Python-кода', () => {
    it('не содержит артефактов Jinja2', () => {
      const r = generate();
      assert.ok(!r.includes('{{'));
      assert.ok(!r.includes('{%'));
    });

    it('init_all_user_vars вызывается ровно один раз', () => {
      const r = generate();
      const count = (r.match(/init_all_user_vars/g) || []).length;
      assert.strictEqual(count, 1, `init_all_user_vars вызван ${count} раз(а), ожидалось 1`);
    });

    it('replace_variables_in_text вызывается ровно один раз', () => {
      const r = generate();
      const count = (r.match(/replace_variables_in_text/g) || []).length;
      assert.strictEqual(count, 1, `replace_variables_in_text вызван ${count} раз(а), ожидалось 1`);
    });
  });

  describe('производительность', () => {
    it('быстрее 10ms', () => {
      const start = Date.now();
      generate();
      assert.ok(Date.now() - start < 10);
    });
  });
});
