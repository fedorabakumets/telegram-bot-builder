/**
 * @fileoverview Тесты для шаблона базы данных
 * @module templates/database/database.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateDatabase } from './database.renderer';
import {
  validParamsEnabled,
  validParamsDisabled,
  invalidParamsWrongType,
  expectedOutputEnabled,
} from './database.fixture';
import { databaseParamsSchema } from './database.schema';

describe('database.py.jinja2 шаблон', () => {
  describe('generateDatabase()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать функции БД при userDatabaseEnabled=true', () => {
        const result = generateDatabase(validParamsEnabled);

        assert.ok(result.includes('async def init_database()'));
        assert.ok(result.includes('async def save_user_to_db'));
        assert.ok(result.includes('async def get_user_from_db'));
        assert.ok(result.includes('async def update_user_data_in_db'));
      });

      it('должен генерировать пустую строку при userDatabaseEnabled=false', () => {
        const result = generateDatabase(validParamsDisabled);

        assert.strictEqual(result, '');
      });

      it('должен включать CREATE TABLE для bot_users', () => {
        const result = generateDatabase(validParamsEnabled);

        assert.ok(result.includes('CREATE TABLE IF NOT EXISTS bot_users'));
        assert.ok(result.includes('user_id BIGINT PRIMARY KEY'));
      });

      it('должен включать docstring для init_database', () => {
        const result = generateDatabase(validParamsEnabled);

        assert.ok(result.includes('"""Инициализация подключения к базе данных'));
      });

      it('должен включать обработку ошибок', () => {
        const result = generateDatabase(validParamsEnabled);

        assert.ok(result.includes('try:'));
        assert.ok(result.includes('except Exception as e:'));
      });

      it('должен совпадать с ожидаемым выводом (БД включена)', () => {
        const result = generateDatabase(validParamsEnabled);
        assert.strictEqual(result, expectedOutputEnabled);
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateDatabase(invalidParamsWrongType);
        });
      });

      it('должен использовать значения по умолчанию для отсутствующих полей', () => {
        const result = databaseParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
        }
      });

      it('должен отклонять string вместо boolean', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять null вместо boolean', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });

        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен генерировать все 4 функции при включенной БД', () => {
        const result = generateDatabase(validParamsEnabled);

        const functions = [
          'init_database',
          'save_user_to_db',
          'get_user_from_db',
          'update_user_data_in_db',
        ];

        functions.forEach(fn => {
          assert.ok(result.includes(`def ${fn}`), `Функция ${fn} должна присутствовать`);
        });
      });

      it('должен включать asyncpg.create_pool', () => {
        const result = generateDatabase(validParamsEnabled);

        assert.ok(result.includes('asyncpg.create_pool'));
      });

      it('должен включать JSONB для user_data', () => {
        const result = generateDatabase(validParamsEnabled);

        assert.ok(result.includes('user_data JSONB'));
      });

      it('должен включать ON CONFLICT для upsert', () => {
        const result = generateDatabase(validParamsEnabled);

        assert.ok(result.includes('ON CONFLICT (user_id) DO UPDATE'));
      });

      it('должен возвращать пустую строку при false', () => {
        const result = generateDatabase({ userDatabaseEnabled: false });

        assert.strictEqual(result.length, 0);
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateDatabase(validParamsEnabled);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateDatabase(validParamsEnabled);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('databaseParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать boolean поле', () => {
        const result = databaseParamsSchema.safeParse(validParamsEnabled);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять number вместо boolean', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: 1,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null вместо boolean', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });
        assert.ok(!result.success);
      });

      it('должен принимать undefined', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: undefined,
        });
        assert.ok(result.success);
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен принимать undefined для userDatabaseEnabled', () => {
        const result = databaseParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, undefined);
        }
      });

      it('должен принимать true для userDatabaseEnabled', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: true,
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, true);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 1 поле', () => {
        const shape = databaseParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 1);
        assert.ok(fields.includes('userDatabaseEnabled'));
      });

      it('должен использовать ZodOptional для userDatabaseEnabled', () => {
        const shape = databaseParamsSchema.shape;
        assert.ok(shape.userDatabaseEnabled.isOptional());
      });
    });
  });
});
