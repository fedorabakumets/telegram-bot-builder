/**
 * @fileoverview Тесты для шаблона универсальных обработчиков
 * @module templates/universal-handlers/universal-handlers.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUniversalHandlers } from './universal-handlers.renderer';
import {
  validParamsEnabled,
  validParamsDisabled,
  invalidParamsWrongType,
  expectedOutput,
} from './universal-handlers.fixture';
import { universalHandlersParamsSchema } from './universal-handlers.schema';

describe('universal-handlers.py.jinja2 шаблон', () => {
  describe('generateUniversalHandlers()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать fallback_text_handler', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('async def fallback_text_handler'));
      });

      it('должен генерировать handle_unhandled_photo', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('async def handle_unhandled_photo'));
      });

      it('должен включать @dp.message(F.text)', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('@dp.message(F.text)'));
      });

      it('должен включать @dp.message(F.photo)', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('@dp.message(F.photo)'));
      });

      it('должен включать docstring для fallback_text_handler', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('Fallback обработчик для всех текстовых сообщений'));
      });

      it('должен совпадать с ожидаемым выводом', () => {
        const result = generateUniversalHandlers(validParamsEnabled);
        assert.strictEqual(result, expectedOutput);
      });

      it('должен игнорировать параметры (всегда одинаковый вывод)', () => {
        const result1 = generateUniversalHandlers(validParamsEnabled);
        const result2 = generateUniversalHandlers(validParamsDisabled);

        assert.strictEqual(result1, result2);
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateUniversalHandlers(invalidParamsWrongType);
        });
      });

      it('должен использовать значения по умолчанию', () => {
        const result = universalHandlersParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });

      it('должен отклонять string вместо boolean', () => {
        const result = universalHandlersParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = universalHandlersParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен включать logging.info для текста', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('logging.info'));
        assert.ok(result.includes('📩 Получено необработанное текстовое сообщение'));
      });

      it('должен включать logging.info для фото', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('📸 Получено фото'));
      });

      it('должен включать message.from_user.id', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('message.from_user.id'));
      });

      it('должен включать message.text', () => {
        const result = generateUniversalHandlers(validParamsEnabled);

        assert.ok(result.includes('message.text'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateUniversalHandlers(validParamsEnabled);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateUniversalHandlers(validParamsEnabled);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms`);
      });
    });
  });

  describe('universalHandlersParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать boolean поле', () => {
        const result = universalHandlersParamsSchema.safeParse(validParamsEnabled);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = universalHandlersParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять number вместо boolean', () => {
        const result = universalHandlersParamsSchema.safeParse({
          userDatabaseEnabled: 1,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = universalHandlersParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен использовать false по умолчанию', () => {
        const result = universalHandlersParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 1 поле', () => {
        const shape = universalHandlersParamsSchema.shape;
        assert.strictEqual(Object.keys(shape).length, 1);
      });

      it('должен использовать ZodBoolean', () => {
        const shape = universalHandlersParamsSchema.shape;
        assert.strictEqual(shape.userDatabaseEnabled.constructor.name, 'ZodBoolean');
      });
    });
  });
});
