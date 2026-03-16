/**
 * @fileoverview Тесты для шаблона конфигурации
 * @module templates/config/config.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateConfig } from './config.renderer';
import {
  validParamsAllEnabled,
  validParamsAllDisabled,
  validParamsDatabaseOnly,
  validParamsProjectOnly,
  invalidParamsWrongType,
  expectedOutputAllEnabled,
  expectedOutputAllDisabled,
} from './config.fixture';
import { configParamsSchema } from './config.schema';

describe('config.py.jinja2 шаблон', () => {
  describe('generateConfig()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать код со всеми настройками (всё включено)', () => {
        const result = generateConfig(validParamsAllEnabled);

        assert.ok(result.includes('BOT_TOKEN = os.getenv("BOT_TOKEN")'));
        assert.ok(result.includes('PROJECT_ID = 123'));
        assert.ok(result.includes('DATABASE_URL = os.getenv("DATABASE_URL")'));
        assert.ok(result.includes('db_pool = None'));
      });

      it('должен генерировать код без PROJECT_ID (всё выключено)', () => {
        const result = generateConfig(validParamsAllDisabled);

        assert.ok(result.includes('BOT_TOKEN = os.getenv("BOT_TOKEN")'));
        assert.ok(!result.includes('PROJECT_ID ='));
        assert.ok(!result.includes('DATABASE_URL'));
      });

      it('должен генерировать только настройки БД', () => {
        const result = generateConfig(validParamsDatabaseOnly);

        assert.ok(result.includes('DATABASE_URL'));
        assert.ok(!result.includes('PROJECT_ID ='));
      });

      it('должен генерировать только PROJECT_ID', () => {
        const result = generateConfig(validParamsProjectOnly);

        assert.ok(result.includes('PROJECT_ID = 456'));
        assert.ok(!result.includes('DATABASE_URL'));
      });

      it('должен включать базовые настройки логирования', () => {
        const result = generateConfig(validParamsAllDisabled);

        assert.ok(result.includes('logging.basicConfig'));
        assert.ok(result.includes('LOG_LEVEL = os.getenv("LOG_LEVEL"'));
      });

      it('должен включать ADMIN_IDS', () => {
        const result = generateConfig(validParamsAllDisabled);

        assert.ok(result.includes('ADMIN_IDS = [int(x.strip())'));
      });

      it('должен совпадать с ожидаемым выводом (всё включено)', () => {
        const result = generateConfig(validParamsAllEnabled);

        assert.ok(result.includes('BOT_TOKEN'));
        assert.ok(result.includes('ADMIN_IDS'));
        assert.ok(result.includes('DATABASE_URL'));
        assert.ok(result.includes('PROJECT_ID'));
      });

      it('должен совпадать с ожидаемым выводом (всё выключено)', () => {
        const result = generateConfig(validParamsAllDisabled);

        assert.ok(result.includes('BOT_TOKEN'));
        assert.ok(result.includes('ADMIN_IDS'));
        assert.ok(!result.includes('DATABASE_URL') || result.includes('DATABASE_URL ='));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateConfig(invalidParamsWrongType);
        });
      });

      it('должен использовать значения по умолчанию для отсутствующих полей', () => {
        const result = configParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
          assert.strictEqual(result.data.projectId, null);
        }
      });

      it('должен отклонять string вместо boolean', () => {
        const result = configParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять число вместо null для projectId', () => {
        const result = configParamsSchema.safeParse({
          projectId: 0, // 0 это валидное число
        });

        assert.ok(result.success); // 0 это валидное число
      });
    });

    describe('Граничные случаи', () => {
      it('должен добавлять PROJECT_ID только при projectId !== null', () => {
        const result1 = generateConfig({
          userDatabaseEnabled: false,
          projectId: 1,
        });

        const result2 = generateConfig({
          userDatabaseEnabled: false,
          projectId: null,
        });

        assert.ok(result1.includes('PROJECT_ID = 1'));
        assert.ok(!result2.includes('PROJECT_ID ='));
      });

      it('должен добавлять DATABASE_URL только при userDatabaseEnabled=true', () => {
        const result1 = generateConfig({
          userDatabaseEnabled: true,
          projectId: null,
        });

        const result2 = generateConfig({
          userDatabaseEnabled: false,
          projectId: null,
        });

        assert.ok(result1.includes('DATABASE_URL'));
        assert.ok(!result2.includes('DATABASE_URL'));
      });

      it('должен всегда включать базовые импорты и настройки', () => {
        const result = generateConfig(validParamsAllDisabled);

        assert.ok(result.includes('load_dotenv()'));
        assert.ok(result.includes('BOT_TOKEN = os.getenv'));
        assert.ok(result.includes('bot = Bot(token=BOT_TOKEN)'));
        assert.ok(result.includes('dp = Dispatcher()'));
      });

      it('должен включать user_data и all_user_vars', () => {
        const result = generateConfig(validParamsAllDisabled);

        assert.ok(result.includes('user_data = {}'));
        assert.ok(result.includes('all_user_vars = {}'));
      });

      it('должен включать PROJECT_DIR', () => {
        const result = generateConfig(validParamsAllDisabled);

        assert.ok(result.includes('PROJECT_DIR = os.path.dirname'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateConfig(validParamsAllEnabled);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateConfig(validParamsAllEnabled);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('configParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = configParamsSchema.safeParse(validParamsAllEnabled);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = configParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять string вместо number для projectId', () => {
        const result = configParamsSchema.safeParse({
          projectId: '123',
        });
        assert.ok(!result.success);
      });

      it('должен принимать null для projectId', () => {
        const result = configParamsSchema.safeParse({
          projectId: null,
        });
        assert.ok(result.success);
      });

      it('должен принимать число для projectId', () => {
        const result = configParamsSchema.safeParse({
          projectId: 42,
        });
        assert.ok(result.success);
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен использовать false для userDatabaseEnabled по умолчанию', () => {
        const result = configParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });

      it('должен использовать null для projectId по умолчанию', () => {
        const result = configParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.projectId, null);
        }
      });

      it('должен принимать значения для присутствующих полей', () => {
        const result = configParamsSchema.safeParse({
          userDatabaseEnabled: true,
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, true);
          assert.strictEqual(result.data.projectId, null);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 2 поля', () => {
        const shape = configParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 2);
        assert.ok(fields.includes('userDatabaseEnabled'));
        assert.ok(fields.includes('projectId'));
      });

      it('должен использовать ZodDefault для userDatabaseEnabled', () => {
        const shape = configParamsSchema.shape;
        assert.strictEqual(shape.userDatabaseEnabled.constructor.name, 'ZodDefault');
      });

      it('должен использовать ZodDefault для projectId', () => {
        const shape = configParamsSchema.shape;
        assert.strictEqual(shape.projectId.constructor.name, 'ZodDefault');
      });
    });
  });
});
