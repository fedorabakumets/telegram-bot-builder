/**
 * @fileoverview Тесты для шаблона функции get_user_variables
 * @module templates/user-variables-func/user-variables-func.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateGetUserVariablesFunction } from './user-variables-func.renderer';
import {
  validParamsNoIndent,
  validParamsIndent4,
  validParamsIndent8,
  validParamsEmptyIndent,
  expectedOutputNoIndent,
  expectedOutputIndent4,
} from './user-variables-func.fixture';
import { userVariablesFuncParamsSchema } from './user-variables-func.schema';

describe('user-variables-func.py.jinja2 шаблон', () => {
  describe('generateGetUserVariablesFunction()', () => {
    describe('Базовая генерация', () => {
      it('должен генерировать функцию без параметров', () => {
        const result = generateGetUserVariablesFunction();
        assert.ok(result.includes('def get_user_variables(user_id):'));
      });

      it('должен генерировать return с user_data.get', () => {
        const result = generateGetUserVariablesFunction();
        assert.ok(result.includes('return user_data.get(user_id, {})'));
      });

      it('должен содержать docstring', () => {
        const result = generateGetUserVariablesFunction();
        assert.ok(result.includes('"""'));
      });

      it('должен содержать Args и Returns в docstring', () => {
        const result = generateGetUserVariablesFunction();
        assert.ok(result.includes('Args:'));
        assert.ok(result.includes('Returns:'));
      });
    });

    describe('Отступы', () => {
      it('должен генерировать без отступа по умолчанию', () => {
        const result = generateGetUserVariablesFunction(validParamsNoIndent);
        assert.ok(result.includes(expectedOutputNoIndent));
      });

      it('должен генерировать с отступом 4 пробела', () => {
        const result = generateGetUserVariablesFunction(validParamsIndent4);
        assert.ok(result.includes(expectedOutputIndent4));
      });

      it('должен генерировать с отступом 8 пробелов', () => {
        const result = generateGetUserVariablesFunction(validParamsIndent8);
        assert.ok(result.includes('        def get_user_variables(user_id):'));
      });

      it('пустой indentLevel эквивалентен отсутствию параметра', () => {
        const withEmpty = generateGetUserVariablesFunction(validParamsEmptyIndent);
        const withoutParam = generateGetUserVariablesFunction();
        assert.strictEqual(withEmpty.trim(), withoutParam.trim());
      });

      it('тело функции должно иметь дополнительный отступ относительно def', () => {
        const result = generateGetUserVariablesFunction(validParamsIndent4);
        const lines = result.split('\n').filter(l => l.trim().length > 0);
        const defLine = lines.find(l => l.includes('def get_user_variables'));
        const returnLine = lines.find(l => l.includes('return user_data'));

        assert.ok(defLine && returnLine);
        assert.ok(
          returnLine.length > defLine.length,
          'Тело функции должно быть глубже чем def'
        );
      });
    });

    describe('Корректность Python-кода', () => {
      it('не должен содержать синтаксических артефактов Jinja2', () => {
        const result = generateGetUserVariablesFunction();
        assert.ok(!result.includes('{{'));
        assert.ok(!result.includes('}}'));
        assert.ok(!result.includes('{%'));
        assert.ok(!result.includes('%}'));
      });

      it('должен содержать только одно определение функции', () => {
        const result = generateGetUserVariablesFunction();
        const defCount = (result.match(/def get_user_variables/g) || []).length;
        assert.strictEqual(defCount, 1);
      });

      it('должен содержать только один return', () => {
        const result = generateGetUserVariablesFunction();
        const returnCount = (result.match(/\breturn\b/g) || []).length;
        assert.strictEqual(returnCount, 1);
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateGetUserVariablesFunction();
        const duration = Date.now() - start;
        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать 1000 раз быстрее 500ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateGetUserVariablesFunction();
        }
        const duration = Date.now() - start;
        assert.ok(duration < 500, `1000 генераций заняли ${duration}ms (ожидалось < 500ms)`);
      });
    });
  });

  describe('userVariablesFuncParamsSchema', () => {
    it('должен принимать пустой объект', () => {
      const result = userVariablesFuncParamsSchema.safeParse({});
      assert.ok(result.success);
    });

    it('должен использовать пустую строку как default для indentLevel', () => {
      const result = userVariablesFuncParamsSchema.safeParse({});
      assert.ok(result.success);
      if (result.success) {
        assert.strictEqual(result.data.indentLevel, '');
      }
    });

    it('должен принимать строку для indentLevel', () => {
      const result = userVariablesFuncParamsSchema.safeParse({ indentLevel: '    ' });
      assert.ok(result.success);
    });

    it('должен отклонять число вместо строки для indentLevel', () => {
      const result = userVariablesFuncParamsSchema.safeParse({ indentLevel: 4 });
      assert.ok(!result.success);
    });
  });
});
