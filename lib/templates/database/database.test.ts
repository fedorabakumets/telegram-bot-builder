/**
 * @fileoverview Тесты для шаблона базы данных
 * @module templates/database/database.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateDatabase } from './database.renderer';
import { databaseParamsSchema } from './database.schema';

describe('database.py.jinja2 шаблон', () => {
  describe('generateDatabase()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать функции БД при userDatabaseEnabled=true', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('async def init_database()'));
        assert.ok(result.includes('async def save_user_to_db'));
        assert.ok(result.includes('async def get_user_from_db'));
        assert.ok(result.includes('async def update_user_data_in_db'));
      });

      it('должен генерировать пустую строку при userDatabaseEnabled=false', () => {
        const result = generateDatabase({ userDatabaseEnabled: false });

        assert.ok(result.trim() === '');
      });

      it('должен включать CREATE TABLE для bot_users', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('CREATE TABLE IF NOT EXISTS bot_users'));
        assert.ok(result.includes('user_id BIGINT PRIMARY KEY'));
      });

      it('должен включать CREATE TABLE для bot_messages', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('CREATE TABLE IF NOT EXISTS bot_messages'));
        assert.ok(result.includes('message_type VARCHAR(50)'));
      });

      it('должен включать docstring для init_database', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('"""Инициализация подключения к базе данных'));
      });

      it('должен включать обработку ошибок', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('try:'));
        assert.ok(result.includes('except Exception as e:'));
      });

      it('должен включать get_moscow_time', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('def get_moscow_time()'));
        assert.ok(result.includes('moscow_tz = timezone(timedelta(hours=3))'));
      });

      it('должен включать log_message', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('async def log_message'));
        assert.ok(result.includes('INSERT INTO bot_messages'));
      });

      it('должен включать get_user_ids_from_db', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('async def get_user_ids_from_db'));
        assert.ok(result.includes('SELECT user_id FROM user_ids'));
      });

      it('должен включать get_user_data_from_db', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('async def get_user_data_from_db'));
        assert.ok(result.includes('SELECT user_data FROM bot_users'));
      });

      it('должен включать update_user_variable_in_db', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('async def update_user_variable_in_db'));
        assert.ok(result.includes('user_data[variable_name] = variable_value'));
      });

      it('должен включать save_user_data_to_db', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('async def save_user_data_to_db'));
        assert.ok(result.includes('update_user_variable_in_db'));
      });

      it('должен включать save_user_to_db с avatar_url', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('avatar_url: str = None'));
        assert.ok(result.includes('avatar_url = COALESCE(EXCLUDED.avatar_url'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateDatabase({ userDatabaseEnabled: 'true' });
        });
      });

      it('должен использовать значения по умолчанию для отсутствующих полей', () => {
        const result = databaseParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
          assert.strictEqual(result.data.hasMessageLogging, false);
          assert.strictEqual(result.data.hasUserIdsTable, false);
          assert.strictEqual(result.data.hasTelegramSettingsTable, false);
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
      it('должен генерировать все функции при включенной БД', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        const functions = [
          'init_database',
          'save_user_to_db',
          'get_user_from_db',
          'update_user_data_in_db',
          'get_moscow_time',
          'log_message',
          'get_user_ids_from_db',
          'get_user_data_from_db',
          'update_user_variable_in_db',
          'save_user_data_to_db',
        ];

        functions.forEach(fn => {
          assert.ok(result.includes(`def ${fn}`), `Функция ${fn} должна присутствовать`);
        });
      });

      it('должен включать asyncpg.create_pool', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('asyncpg.create_pool'));
      });

      it('должен включать JSONB для user_data', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('user_data JSONB'));
      });

      it('должен включать ON CONFLICT для upsert', () => {
        const result = generateDatabase({ userDatabaseEnabled: true });

        assert.ok(result.includes('ON CONFLICT (user_id) DO UPDATE'));
      });

      it('должен возвращать пустую строку при false', () => {
        const result = generateDatabase({ userDatabaseEnabled: false });

        assert.ok(result.trim().length === 0);
      });

      it('должен включать новые поля схемы', () => {
        const result = generateDatabase({
          userDatabaseEnabled: true,
          hasMessageLogging: true,
          hasUserIdsTable: true,
          hasTelegramSettingsTable: true,
        });

        assert.ok(result.includes('async def init_database'));
        assert.ok(result.includes('async def log_message'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateDatabase({ userDatabaseEnabled: true });
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateDatabase({ userDatabaseEnabled: true });
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('databaseParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать boolean поле', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: true,
          hasMessageLogging: true,
          hasUserIdsTable: false,
          hasTelegramSettingsTable: true,
        });
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
      it('должен использовать false для всех полей по умолчанию', () => {
        const result = databaseParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
          assert.strictEqual(result.data.hasMessageLogging, false);
          assert.strictEqual(result.data.hasUserIdsTable, false);
          assert.strictEqual(result.data.hasTelegramSettingsTable, false);
        }
      });

      it('должен принимать true для всех полей', () => {
        const result = databaseParamsSchema.safeParse({
          userDatabaseEnabled: true,
          hasMessageLogging: true,
          hasUserIdsTable: true,
          hasTelegramSettingsTable: true,
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, true);
          assert.strictEqual(result.data.hasMessageLogging, true);
          assert.strictEqual(result.data.hasUserIdsTable, true);
          assert.strictEqual(result.data.hasTelegramSettingsTable, true);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 4 поля', () => {
        const shape = databaseParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 4);
        assert.ok(fields.includes('userDatabaseEnabled'));
        assert.ok(fields.includes('hasMessageLogging'));
        assert.ok(fields.includes('hasUserIdsTable'));
        assert.ok(fields.includes('hasTelegramSettingsTable'));
      });

      it('должен использовать ZodDefault для всех полей', () => {
        const shape = databaseParamsSchema.shape;
        assert.strictEqual(shape.userDatabaseEnabled.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasMessageLogging.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasUserIdsTable.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasTelegramSettingsTable.constructor.name, 'ZodDefault');
      });
    });
  });
});
