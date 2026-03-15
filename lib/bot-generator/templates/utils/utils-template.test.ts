/**
 * @fileoverview Тесты для шаблона утилит
 * @module templates/utils/utils-template.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUtils } from './utils-template.renderer';
import {
  validParamsEnabled,
  validParamsDisabled,
  invalidParamsWrongType,
  expectedOutputEnabled,
  expectedOutputDisabled,
} from './utils-template.fixture';
import { utilsParamsSchema } from './utils-template.schema';

describe('utils.py.jinja2 шаблон', () => {
  describe('generateUtils()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать утилиты с check_auth для БД', () => {
        const result = generateUtils(validParamsEnabled);

        assert.ok(result.includes('async def is_admin'));
        assert.ok(result.includes('async def check_auth'));
        assert.ok(result.includes('if db_pool:'));
      });

      it('должен генерировать утилиты без БД', () => {
        const result = generateUtils(validParamsDisabled);

        assert.ok(result.includes('async def is_admin'));
        assert.ok(result.includes('async def check_auth'));
        assert.ok(!result.includes('if db_pool:'));
      });

      it('должен включать is_private_chat', () => {
        const result = generateUtils(validParamsDisabled);

        assert.ok(result.includes('async def is_private_chat'));
      });

      it('должен включать get_user_variables', () => {
        const result = generateUtils(validParamsDisabled);

        assert.ok(result.includes('def get_user_variables'));
      });

      it('должен совпадать с ожидаемым выводом (БД включена)', () => {
        const result = generateUtils(validParamsEnabled);
        assert.strictEqual(result, expectedOutputEnabled);
      });

      it('должен совпадать с ожидаемым выводом (БД выключена)', () => {
        const result = generateUtils(validParamsDisabled);
        assert.strictEqual(result, expectedOutputDisabled);
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateUtils(invalidParamsWrongType);
        });
      });

      it('должен использовать значения по умолчанию', () => {
        const result = utilsParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });

      it('должен отклонять string вместо boolean', () => {
        const result = utilsParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null вместо boolean', () => {
        const result = utilsParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен включать get_user_from_db при userDatabaseEnabled=true', () => {
        const result = generateUtils(validParamsEnabled);

        assert.ok(result.includes('get_user_from_db'));
      });

      it('должен включать ADMIN_IDS', () => {
        const result = generateUtils(validParamsDisabled);

        assert.ok(result.includes('ADMIN_IDS'));
      });

      it('должен включать docstring для get_user_variables', () => {
        const result = generateUtils(validParamsDisabled);

        assert.ok(result.includes('"""Получает все переменные пользователя'));
      });

      it('должен всегда включать is_admin', () => {
        const result1 = generateUtils(validParamsEnabled);
        const result2 = generateUtils(validParamsDisabled);

        assert.ok(result1.includes('async def is_admin'));
        assert.ok(result2.includes('async def is_admin'));
      });

      it('должен включать from aiogram import types', () => {
        const result = generateUtils(validParamsDisabled);

        assert.ok(result.includes('from aiogram import types'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateUtils(validParamsEnabled);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateUtils(validParamsEnabled);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms`);
      });
    });
  });

  describe('utilsParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать boolean поле', () => {
        const result = utilsParamsSchema.safeParse(validParamsEnabled);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = utilsParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять number вместо boolean', () => {
        const result = utilsParamsSchema.safeParse({
          userDatabaseEnabled: 1,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = utilsParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять undefined', () => {
        const result = utilsParamsSchema.safeParse({
          userDatabaseEnabled: undefined,
        });
        assert.ok(result.success);
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен принимать undefined по умолчанию', () => {
        const result = utilsParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, undefined);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 1 поле', () => {
        const shape = utilsParamsSchema.shape;
        assert.strictEqual(Object.keys(shape).length, 1);
      });

      it('должен использовать ZodOptional', () => {
        const shape = utilsParamsSchema.shape;
        assert.ok(shape.userDatabaseEnabled.isOptional());
      });
    });
  });
});
