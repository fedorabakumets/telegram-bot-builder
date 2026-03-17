/**
 * @fileoverview Тесты для шаблона рассылки
 * @module templates/broadcast/broadcast.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateBroadcast, collectBroadcastNodes } from './broadcast.renderer';
import {
  validParamsBotBroadcast,
  validParamsClientBroadcast,
  validParamsBothSources,
  validParamsEmpty,
  validParamsWithMedia,
  validParamsWithAutoTransition,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './broadcast.fixture';
import { broadcastParamsSchema } from './broadcast.schema';

describe('broadcast.py.jinja2 шаблон', () => {
  describe('generateBroadcast()', () => {
    describe('Bot API', () => {
      it('генерирует async def handle_broadcast_<nodeId>', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('async def handle_broadcast_broadcast_1'));
      });

      it('содержит получение получателей из bot_users', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('SELECT DISTINCT user_id FROM bot_users'));
      });

      it('содержит получение получателей из user_ids', () => {
        const result = generateBroadcast({ ...validParamsBotBroadcast, idSourceType: 'user_ids' });
        assert.ok(result.includes('SELECT DISTINCT user_id FROM user_ids'));
      });

      it('содержит оба источника при idSourceType=both', () => {
        const result = generateBroadcast(validParamsBothSources);
        assert.ok(result.includes('SELECT DISTINCT user_id FROM user_ids'));
        assert.ok(result.includes('SELECT DISTINCT user_id FROM bot_users'));
      });

      it('содержит замену переменных для каждого получателя', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('replace_variables_in_text'));
      });

      it('содержит отправку через bot.send_message', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('bot.send_message'));
      });

      it('содержит счётчики success_count и error_count', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('success_count'));
        assert.ok(result.includes('error_count'));
      });

      it('содержит asyncio.sleep для соблюдения лимитов', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('asyncio.sleep'));
      });

      it('содержит обработку ошибок отправки', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('except Exception as send_error'));
        assert.ok(result.includes('logging.error'));
      });

      it('содержит итоговый отчёт с successMessage', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('Рассылка выполнена успешно'));
        assert.ok(result.includes('Bot API'));
      });

      it('при пустом broadcastNodes выводит предупреждение', () => {
        const result = generateBroadcast(validParamsEmpty);
        assert.ok(result.includes('Нет сообщений для рассылки'));
        assert.ok(result.includes('broadcast_nodes = []'));
      });
    });

    describe('Bot API — медиа', () => {
      it('содержит отправку фото через bot.send_photo', () => {
        const result = generateBroadcast(validParamsWithMedia);
        assert.ok(result.includes('bot.send_photo'));
      });

      it('содержит fallback на bot.send_message если медиа не отправлено', () => {
        const result = generateBroadcast(validParamsWithMedia);
        assert.ok(result.includes('if not media_sent'));
        assert.ok(result.includes('bot.send_message'));
      });
    });

    describe('Bot API — автопереход', () => {
      it('содержит логику автоперехода через FakeCallbackQuery', () => {
        const result = generateBroadcast(validParamsWithAutoTransition);
        assert.ok(result.includes('auto_target'));
        assert.ok(result.includes('handle_callback_'));
      });
    });

    describe('Client API', () => {
      it('генерирует handle_broadcast_<nodeId> для client', () => {
        const result = generateBroadcast(validParamsClientBroadcast);
        assert.ok(result.includes('async def handle_broadcast_broadcast_2'));
      });

      it('содержит проверку сессии Client API', () => {
        const result = generateBroadcast(validParamsClientBroadcast);
        assert.ok(result.includes('user_telegram_settings'));
        assert.ok(result.includes('session_string'));
      });

      it('содержит инициализацию Telethon', () => {
        const result = generateBroadcast(validParamsClientBroadcast);
        assert.ok(result.includes('TelegramClient'));
        assert.ok(result.includes('StringSession'));
      });

      it('содержит отправку через app.send_message', () => {
        const result = generateBroadcast(validParamsClientBroadcast);
        assert.ok(result.includes('app.send_message'));
      });

      it('содержит счётчик заблокированных пользователей', () => {
        const result = generateBroadcast(validParamsClientBroadcast);
        assert.ok(result.includes('blocked_count'));
        assert.ok(result.includes('PEER_ID_INVALID'));
      });

      it('содержит connect/disconnect для Telethon', () => {
        const result = generateBroadcast(validParamsClientBroadcast);
        assert.ok(result.includes('await app.connect()'));
        assert.ok(result.includes('await app.disconnect()'));
      });

      it('содержит логику автоперехода по индексу', () => {
        const result = generateBroadcast(validParamsClientBroadcast);
        assert.ok(result.includes('current_node_index'));
        assert.ok(result.includes('autoTransitionTo'));
      });

      it('содержит отчёт с упоминанием Client API', () => {
        const result = generateBroadcast(validParamsClientBroadcast);
        assert.ok(result.includes('Client API'));
      });
    });

    describe('Невалидные данные', () => {
      it('отклоняет параметры с неправильным типом nodeId', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateBroadcast(invalidParamsWrongType);
        });
      });

      it('отклоняет параметры без nodeId', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateBroadcast(invalidParamsMissingField);
        });
      });

      it('отклоняет неправильный broadcastApiType', () => {
        const result = broadcastParamsSchema.safeParse({ nodeId: 'test', broadcastApiType: 'telegram' });
        assert.ok(!result.success);
      });

      it('отклоняет неправильный idSourceType', () => {
        const result = broadcastParamsSchema.safeParse({ nodeId: 'test', idSourceType: 'all' });
        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('генерирует разные имена функций для разных nodeId', () => {
        const r1 = generateBroadcast({ ...validParamsBotBroadcast, nodeId: 'node_a' });
        const r2 = generateBroadcast({ ...validParamsBotBroadcast, nodeId: 'node_b' });
        assert.ok(r1.includes('handle_broadcast_node_a'));
        assert.ok(r2.includes('handle_broadcast_node_b'));
        assert.ok(!r1.includes('handle_broadcast_node_b'));
      });

      it('содержит маркеры @@NODE_START и @@NODE_END', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('@@NODE_START:broadcast_1@@'));
        assert.ok(result.includes('@@NODE_END:broadcast_1@@'));
      });

      it('broadcastNodes встраиваются в список broadcast_nodes', () => {
        const result = generateBroadcast(validParamsBotBroadcast);
        assert.ok(result.includes('broadcast_nodes = ['));
        assert.ok(result.includes('"id": "msg_1"'));
      });
    });

    describe('Производительность', () => {
      it('генерирует код быстрее 10ms', () => {
        const start = Date.now();
        generateBroadcast(validParamsBotBroadcast);
        assert.ok(Date.now() - start < 10);
      });

      it('генерирует код 1000 раз быстрее 200ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) generateBroadcast(validParamsBotBroadcast);
        assert.ok(Date.now() - start < 200);
      });
    });
  });

  describe('collectBroadcastNodes()', () => {
    it('собирает message-узлы с enableBroadcast=true', () => {
      const nodes = [
        { id: 'b1', type: 'broadcast', position: { x: 0, y: 0 }, data: {} },
        { id: 'm1', type: 'message', position: { x: 0, y: 0 }, data: { enableBroadcast: true, messageText: 'Hello' } },
        { id: 'm2', type: 'message', position: { x: 0, y: 0 }, data: { enableBroadcast: false, messageText: 'Skip' } },
      ] as any[];
      const result = collectBroadcastNodes(nodes, 'b1');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 'm1');
    });

    it('разворачивает цепочку autoTransitionTo', () => {
      const nodes = [
        { id: 'b1', type: 'broadcast', position: { x: 0, y: 0 }, data: {} },
        { id: 'm1', type: 'message', position: { x: 0, y: 0 }, data: { enableBroadcast: true, messageText: 'First', autoTransitionTo: 'm2' } },
        { id: 'm2', type: 'message', position: { x: 0, y: 0 }, data: { enableBroadcast: false, messageText: 'Second' } },
      ] as any[];
      const result = collectBroadcastNodes(nodes, 'b1');
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(n => n.id === 'm2'));
    });

    it('фильтрует по broadcastTargetNode', () => {
      const nodes = [
        { id: 'b1', type: 'broadcast', position: { x: 0, y: 0 }, data: {} },
        { id: 'm1', type: 'message', position: { x: 0, y: 0 }, data: { enableBroadcast: true, messageText: 'For b1', broadcastTargetNode: 'b1' } },
        { id: 'm2', type: 'message', position: { x: 0, y: 0 }, data: { enableBroadcast: true, messageText: 'For b2', broadcastTargetNode: 'b2' } },
      ] as any[];
      const result = collectBroadcastNodes(nodes, 'b1');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 'm1');
    });

    it('возвращает пустой массив если нет подходящих узлов', () => {
      const nodes = [
        { id: 'b1', type: 'broadcast', position: { x: 0, y: 0 }, data: {} },
      ] as any[];
      assert.strictEqual(collectBroadcastNodes(nodes, 'b1').length, 0);
    });
  });

  describe('broadcastParamsSchema', () => {
    it('принимает минимальный набор полей', () => {
      const result = broadcastParamsSchema.safeParse({ nodeId: 'test' });
      assert.ok(result.success);
    });

    it('использует bot как дефолт для broadcastApiType', () => {
      const result = broadcastParamsSchema.safeParse({ nodeId: 'test' });
      assert.ok(result.success && result.data.broadcastApiType === 'bot');
    });

    it('использует bot_users как дефолт для idSourceType', () => {
      const result = broadcastParamsSchema.safeParse({ nodeId: 'test' });
      assert.ok(result.success && result.data.idSourceType === 'bot_users');
    });

    it('принимает все значения enum для idSourceType', () => {
      for (const v of ['user_ids', 'bot_users', 'both']) {
        const r = broadcastParamsSchema.safeParse({ nodeId: 'test', idSourceType: v });
        assert.ok(r.success, `idSourceType=${v} должен быть валидным`);
      }
    });

    it('отклоняет string вместо boolean для enableBroadcast', () => {
      const result = broadcastParamsSchema.safeParse({ nodeId: 'test', enableBroadcast: 'true' });
      assert.ok(!result.success);
    });

    it('принимает broadcastNodes как массив объектов', () => {
      const result = broadcastParamsSchema.safeParse({
        nodeId: 'test',
        broadcastNodes: [{ id: 'n1', text: 'Hello' }],
      });
      assert.ok(result.success);
    });

    it('использует ZodDefault для broadcastApiType', () => {
      assert.strictEqual(broadcastParamsSchema.shape.broadcastApiType.constructor.name, 'ZodDefault');
    });

    it('использует ZodDefault для idSourceType', () => {
      assert.strictEqual(broadcastParamsSchema.shape.idSourceType.constructor.name, 'ZodDefault');
    });
  });
});
