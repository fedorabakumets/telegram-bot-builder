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

      it('должен включать set_bot_commands() при наличии команд', () => {
        const result = generateMain({
          userDatabaseEnabled: false,
          menuCommands: [{ command: 'start', description: 'Запустить бота' }],
        });

        assert.ok(result.includes('async def set_bot_commands()'));
      });

      it('не должен включать set_bot_commands() без команд', () => {
        const result = generateMain({ userDatabaseEnabled: false, menuCommands: [] });

        assert.ok(!result.includes('async def set_bot_commands()'));
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

      it('должен генерировать main с обработкой ошибок', () => {
        const result = generateMain(validParamsEnabled);

        assert.ok(result.includes('logging.error'));
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

      // ─── Проверка дублирования (проблема #4) ───────────────────────────────

      it('set_bot_commands определяется ровно один раз', () => {
        const result = generateMain(validParamsDisabled);
        const count = (result.match(/async def set_bot_commands\(\)/g) || []).length;
        assert.strictEqual(count, 1, `set_bot_commands определена ${count} раз(а), ожидалось 1`);
      });

      it('if __name__ == "__main__" встречается ровно один раз', () => {
        const result = generateMain(validParamsDisabled);
        const count = (result.match(/if __name__ == "__main__":/g) || []).length;
        assert.strictEqual(count, 1, `if __name__ == "__main__" встречается ${count} раз(а), ожидалось 1`);
      });

      it('asyncio.run(main()) вызывается ровно один раз', () => {
        const result = generateMain(validParamsDisabled);
        const count = (result.match(/asyncio\.run\(main\(\)\)/g) || []).length;
        assert.strictEqual(count, 1, `asyncio.run(main()) вызван ${count} раз(а), ожидалось 1`);
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
      it('должен принимать false по умолчанию', () => {
        const result = mainParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 6 полей', () => {
        const shape = mainParamsSchema.shape;
        assert.strictEqual(Object.keys(shape).length, 6);
      });

      it('должен использовать ZodOptional', () => {
        const shape = mainParamsSchema.shape;
        assert.ok(shape.userDatabaseEnabled.isOptional());
        assert.ok(shape.hasInlineButtons.isOptional());
        assert.ok(shape.menuCommands.isOptional());
      });

      it('должен регистрировать managedBotUpdatedTrigger middleware через dp.message.middleware', () => {
        const result = generateMain({
          userDatabaseEnabled: false,
          managedBotUpdatedTriggerMiddlewares: ['managed_bot_updated_trigger_mbu_1_middleware'],
        });
        assert.ok(result.includes('dp.message.middleware(managed_bot_updated_trigger_mbu_1_middleware)'));
      });

      it('не должен регистрировать managedBotUpdatedTrigger middleware при пустом массиве', () => {
        const result = generateMain({
          userDatabaseEnabled: false,
          managedBotUpdatedTriggerMiddlewares: [],
        });
        assert.ok(!result.includes('managed_bot_updated_trigger'));
      });
    });
  });
});
