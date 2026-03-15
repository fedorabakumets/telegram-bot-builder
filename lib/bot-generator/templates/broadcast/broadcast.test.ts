/**
 * @fileoverview Тесты для шаблона рассылки
 * @module templates/broadcast/broadcast.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateBroadcast } from './broadcast.renderer';
import {
  validParamsBotBroadcast,
  validParamsClientBroadcast,
  validParamsBothSources,
  validParamsDisabled,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './broadcast.fixture';
import { broadcastParamsSchema } from './broadcast.schema';

describe('broadcast.py.jinja2 шаблон', () => {
  describe('generateBroadcast()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик рассылки через бота', () => {
        const result = generateBroadcast(validParamsBotBroadcast);

        assert.ok(result.includes('handle_broadcast_broadcast_1'));
        assert.ok(result.includes('bot.send_message'));
        assert.ok(result.includes('target_users'));
      });

      it('должен генерировать обработчик рассылки через клиента', () => {
        const result = generateBroadcast(validParamsClientBroadcast);

        assert.ok(result.includes('handle_broadcast_broadcast_2'));
        assert.ok(result.includes('клиента') || result.includes('client'));
      });

      it('должен генерировать обработчик с обоими источниками ID', () => {
        const result = generateBroadcast(validParamsBothSources);

        assert.ok(result.includes('is_bot = FALSE'));
        assert.ok(result.includes('is_bot = TRUE'));
      });

      it('должен генерировать обработчик с отключенной рассылкой', () => {
        const result = generateBroadcast(validParamsDisabled);

        assert.ok(result.includes('Рассылка отключена'));
        assert.ok(!result.includes('bot.send_message'));
      });

      it('должен включать замену переменных', () => {
        const result = generateBroadcast(validParamsBotBroadcast);

        assert.ok(result.includes('replace_variables_in_text'));
        assert.ok(result.includes('init_all_user_vars'));
      });

      it('должен включать подсчет успешных и ошибочных отправок', () => {
        const result = generateBroadcast(validParamsBotBroadcast);

        assert.ok(result.includes('success_count'));
        assert.ok(result.includes('error_count'));
      });

      it('должен включать задержку для избежания лимитов', () => {
        const result = generateBroadcast(validParamsBotBroadcast);

        assert.ok(result.includes('asyncio.sleep'));
      });

      it('должен включать обработку ошибок', () => {
        const result = generateBroadcast(validParamsBotBroadcast);

        assert.ok(result.includes('try'));
        assert.ok(result.includes('except Exception'));
        assert.ok(result.includes('logging.error'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateBroadcast(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateBroadcast(invalidParamsMissingField);
        });
      });

      it('должен отклонять неправильный broadcastApiType', () => {
        const result = broadcastParamsSchema.safeParse({
          nodeId: 'test',
          broadcastApiType: 'invalid',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять неправильный idSourceType', () => {
        const result = broadcastParamsSchema.safeParse({
          nodeId: 'test',
          idSourceType: 'invalid',
        });

        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен использовать значения по умолчанию для confirmationText', () => {
        const result = broadcastParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.confirmationText, '✅ Рассылка запущена');
        }
      });

      it('должен использовать значения по умолчанию для idSourceType', () => {
        const result = broadcastParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.idSourceType, 'user_ids');
        }
      });

      it('должен использовать пустую строку для messageText по умолчанию', () => {
        const result = broadcastParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.messageText, '');
        }
      });

      it('должен включать подтверждение только при enableConfirmation=true', () => {
        const result1 = generateBroadcast({
          ...validParamsBotBroadcast,
          enableConfirmation: true,
        });

        const result2 = generateBroadcast({
          ...validParamsBotBroadcast,
          enableConfirmation: false,
        });

        assert.ok(result1.includes('broadcast_') && result1.includes('_confirmed'));
        assert.ok(!result2.includes('_confirmed'));
      });

      it('должен генерировать разные команды для разных nodeId', () => {
        const result1 = generateBroadcast({ ...validParamsBotBroadcast, nodeId: 'node_a' });
        const result2 = generateBroadcast({ ...validParamsBotBroadcast, nodeId: 'node_b' });

        assert.ok(result1.includes('broadcast_node_a'));
        assert.ok(result2.includes('broadcast_node_b'));
        assert.ok(!result1.includes('broadcast_node_b'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateBroadcast(validParamsBotBroadcast);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateBroadcast(validParamsBotBroadcast);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('broadcastParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = broadcastParamsSchema.safeParse(validParamsBotBroadcast);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = broadcastParamsSchema.safeParse({
          nodeId: 'test',
          enableBroadcast: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный enum для broadcastApiType', () => {
        const result = broadcastParamsSchema.safeParse({
          nodeId: 'test',
          broadcastApiType: 'telegram',
        });
        assert.ok(!result.success);
      });

      it('должен принимать все значения enum для idSourceType', () => {
        const result1 = broadcastParamsSchema.safeParse({ nodeId: 'test', idSourceType: 'user_ids' });
        const result2 = broadcastParamsSchema.safeParse({ nodeId: 'test', idSourceType: 'bot_users' });
        const result3 = broadcastParamsSchema.safeParse({ nodeId: 'test', idSourceType: 'both' });

        assert.ok(result1.success && result2.success && result3.success);
      });

      it('должен использовать значения по умолчанию для всех опциональных полей', () => {
        const result = broadcastParamsSchema.safeParse({ nodeId: 'test' });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.broadcastApiType, 'bot');
          assert.strictEqual(result.data.enableBroadcast, true);
          assert.strictEqual(result.data.enableConfirmation, true);
          assert.strictEqual(result.data.idSourceType, 'user_ids');
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 10 полей', () => {
        const shape = broadcastParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 10);
      });

      it('должен использовать ZodDefault для broadcastApiType', () => {
        const shape = broadcastParamsSchema.shape;
        assert.strictEqual(shape.broadcastApiType.constructor.name, 'ZodDefault');
      });

      it('должен использовать ZodDefault для idSourceType', () => {
        const shape = broadcastParamsSchema.shape;
        assert.strictEqual(shape.idSourceType.constructor.name, 'ZodDefault');
      });

      it('должен использовать ZodDefault для enableBroadcast', () => {
        const shape = broadcastParamsSchema.shape;
        assert.strictEqual(shape.enableBroadcast.constructor.name, 'ZodDefault');
      });
    });
  });
});
