/**
 * @fileoverview Тесты для шаблона запуска бота
 * @module templates/main/main.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMain } from './main.renderer';
import {
  validParamsEnabled,
  validParamsDisabled,
  invalidParamsWrongType,
  expectedOutputEnabled,
  expectedOutputDisabled,
} from './main.fixture';
import { mainParamsSchema } from './main.schema';

describe('main.py.jinja2 шаблон', () => {
  describe('generateMain()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать main() с init_database()', () => {
        const result = generateMain(validParamsEnabled);

        assert.ok(result.includes('async def main()'));
        assert.ok(result.includes('await init_database()'));
      });

      it('должен генерировать main() без init_database()', () => {
        const result = generateMain(validParamsDisabled);

        assert.ok(result.includes('async def main()'));
        assert.ok(!result.includes('await init_database()'));
      });

      it('должен включать set_bot_commands()', () => {
        const result = generateMain(validParamsDisabled);

        assert.ok(result.includes('async def set_bot_commands()'));
      });

      it('должен включать middleware при БД', () => {
        const result = generateMain(validParamsEnabled);

        assert.ok(result.includes('dp.message.middleware(message_logging_middleware)'));
      });

      it('должен включать обработку сигналов', () => {
        const result = generateMain(validParamsDisabled);

        assert.ok(result.includes('signal.signal(signal.SIGTERM'));
        assert.ok(result.includes('signal.signal(signal.SIGINT'));
      });

      it('должен совпадать с ожидаемым выводом (БД включена)', () => {
        const result = generateMain(validParamsEnabled);
        assert.strictEqual(result, expectedOutputEnabled);
      });

      it('должен совпадать с ожидаемым выводом (БД выключена)', () => {
        const result = generateMain(validParamsDisabled);
        assert.strictEqual(result, expectedOutputDisabled);
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateMain(invalidParamsWrongType);
        });
      });

      it('должен использовать значения по умолчанию', () => {
        const result = mainParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });

      it('должен отклонять string вместо boolean', () => {
        const result = mainParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = mainParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен включать finally блок', () => {
        const result = generateMain(validParamsDisabled);

        assert.ok(result.includes('finally:'));
      });

      it('должен включать bot.session.close()', () => {
        const result = generateMain(validParamsDisabled);

        assert.ok(result.includes('await bot.session.close()'));
      });

      it('должен включать db_pool.close() при БД', () => {
        const result = generateMain(validParamsEnabled);

        assert.ok(result.includes('await db_pool.close()'));
      });

      it('должен включать asyncio.run(main())', () => {
        const result = generateMain(validParamsDisabled);

        assert.ok(result.includes('asyncio.run(main())'));
      });

      it('должен включать if __name__ == "__main__"', () => {
        const result = generateMain(validParamsDisabled);

        assert.ok(result.includes('if __name__ == "__main__":'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateMain(validParamsEnabled);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateMain(validParamsEnabled);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms`);
      });
    });
  });

  describe('mainParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать boolean поле', () => {
        const result = mainParamsSchema.safeParse(validParamsEnabled);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = mainParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять number вместо boolean', () => {
        const result = mainParamsSchema.safeParse({
          userDatabaseEnabled: 1,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = mainParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен использовать false по умолчанию', () => {
        const result = mainParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 1 поле', () => {
        const shape = mainParamsSchema.shape;
        assert.strictEqual(Object.keys(shape).length, 1);
      });

      it('должен использовать ZodBoolean', () => {
        const shape = mainParamsSchema.shape;
        assert.strictEqual(shape.userDatabaseEnabled.constructor.name, 'ZodBoolean');
      });
    });
  });
});
