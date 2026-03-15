/**
 * @fileoverview Тесты для шаблона middleware
 * @module templates/middleware/middleware.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMiddleware } from './middleware.renderer';
import {
  validParamsEnabled,
  validParamsDisabled,
  invalidParamsWrongType,
  expectedOutput,
} from './middleware.fixture';
import { middlewareParamsSchema } from './middleware.schema';

describe('middleware.py.jinja2 шаблон', () => {
  describe('generateMiddleware()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать message_logging_middleware', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('async def message_logging_middleware'));
      });

      it('должен включать docstring', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('"""Middleware для автоматического сохранения'));
      });

      it('должен включать обработку user_id', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('user_id = str(event.from_user.id)'));
      });

      it('должен включать save_message_to_api', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('await save_message_to_api'));
      });

      it('должен включать обработку ошибок', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('try:'));
        assert.ok(result.includes('except Exception as e:'));
      });

      it('должен совпадать с ожидаемым выводом', () => {
        const result = generateMiddleware(validParamsEnabled);
        assert.strictEqual(result, expectedOutput);
      });

      it('должен игнорировать параметры (всегда одинаковый вывод)', () => {
        const result1 = generateMiddleware(validParamsEnabled);
        const result2 = generateMiddleware(validParamsDisabled);

        assert.strictEqual(result1, result2);
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateMiddleware(invalidParamsWrongType);
        });
      });

      it('должен использовать значения по умолчанию', () => {
        const result = middlewareParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });

      it('должен отклонять string вместо boolean', () => {
        const result = middlewareParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = middlewareParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен включать logging.error', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('logging.error'));
      });

      it('должен включать return await handler', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('return await handler(event, data)'));
      });

      it('должен включать message.caption', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('event.text or event.caption'));
      });

      it('должен включать [медиа] заглушку', () => {
        const result = generateMiddleware(validParamsEnabled);

        assert.ok(result.includes('"[медиа]"'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateMiddleware(validParamsEnabled);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateMiddleware(validParamsEnabled);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms`);
      });
    });
  });

  describe('middlewareParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать boolean поле', () => {
        const result = middlewareParamsSchema.safeParse(validParamsEnabled);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = middlewareParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять number вместо boolean', () => {
        const result = middlewareParamsSchema.safeParse({
          userDatabaseEnabled: 1,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = middlewareParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен принимать undefined по умолчанию', () => {
        const result = middlewareParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, undefined);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 1 поле', () => {
        const shape = middlewareParamsSchema.shape;
        assert.strictEqual(Object.keys(shape).length, 1);
      });

      it('должен использовать ZodOptional', () => {
        const shape = middlewareParamsSchema.shape;
        assert.ok(shape.userDatabaseEnabled.isOptional());
      });
    });
  });
});
