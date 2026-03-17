/**
 * @fileoverview Тесты для шаблона рассылки Bot API
 * @module templates/broadcast-bot/broadcast-bot.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateBroadcastBot, collectBroadcastNodes } from './broadcast-bot.renderer';
import {
  validParamsBotUsers,
  validParamsUserIds,
  validParamsBoth,
  validParamsEmpty,
  validParamsWithMedia,
  validParamsWithAutoTransition,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './broadcast-bot.fixture';
import { broadcastBotParamsSchema } from './broadcast-bot.schema';

describe('broadcast-bot.py.jinja2', () => {
  describe('generateBroadcastBot()', () => {
    it('генерирует async def handle_broadcast_<nodeId>', () => {
      const r = generateBroadcastBot(validParamsBotUsers);
      assert.ok(r.includes('async def handle_broadcast_broadcast_1'));
    });

    it('содержит комментарий Bot API / aiogram', () => {
      const r = generateBroadcastBot(validParamsBotUsers);
      assert.ok(r.includes('aiogram'));
    });

    it('содержит маркеры @@NODE_START и @@NODE_END', () => {
      const r = generateBroadcastBot(validParamsBotUsers);
      assert.ok(r.includes('@@NODE_START:broadcast_1@@'));
      assert.ok(r.includes('@@NODE_END:broadcast_1@@'));
    });

    describe('Получатели', () => {
      it('bot_users: SELECT из bot_users', () => {
        const r = generateBroadcastBot(validParamsBotUsers);
        assert.ok(r.includes('SELECT DISTINCT user_id FROM bot_users'));
        assert.ok(!r.includes('FROM user_ids'));
      });

      it('user_ids: SELECT из user_ids', () => {
        const r = generateBroadcastBot(validParamsUserIds);
        assert.ok(r.includes('SELECT DISTINCT user_id FROM user_ids'));
        assert.ok(!r.includes('FROM bot_users'));
      });

      it('both: SELECT из обеих таблиц', () => {
        const r = generateBroadcastBot(validParamsBoth);
        assert.ok(r.includes('SELECT DISTINCT user_id FROM user_ids'));
        assert.ok(r.includes('SELECT DISTINCT user_id FROM bot_users'));
      });
    });

    describe('Отправка', () => {
      it('содержит replace_variables_in_text', () => {
        assert.ok(generateBroadcastBot(validParamsBotUsers).includes('replace_variables_in_text'));
      });

      it('содержит bot.send_message', () => {
        assert.ok(generateBroadcastBot(validParamsBotUsers).includes('bot.send_message'));
      });

      it('содержит success_count и error_count', () => {
        const r = generateBroadcastBot(validParamsBotUsers);
        assert.ok(r.includes('success_count'));
        assert.ok(r.includes('error_count'));
      });

      it('содержит asyncio.sleep', () => {
        assert.ok(generateBroadcastBot(validParamsBotUsers).includes('asyncio.sleep'));
      });

      it('содержит обработку ошибок', () => {
        const r = generateBroadcastBot(validParamsBotUsers);
        assert.ok(r.includes('except Exception as send_error'));
        assert.ok(r.includes('logging.error'));
      });

      it('содержит successMessage в отчёте', () => {
        const r = generateBroadcastBot(validParamsBotUsers);
        assert.ok(r.includes('Рассылка выполнена успешно'));
        assert.ok(r.includes('Bot API'));
      });
    });

    describe('Пустой broadcastNodes', () => {
      it('выводит предупреждение и broadcast_nodes = []', () => {
        const r = generateBroadcastBot(validParamsEmpty);
        assert.ok(r.includes('Нет сообщений для рассылки'));
        assert.ok(r.includes('broadcast_nodes = []'));
      });
    });

    describe('Медиа', () => {
      it('содержит bot.send_photo', () => {
        assert.ok(generateBroadcastBot(validParamsWithMedia).includes('bot.send_photo'));
      });

      it('содержит fallback bot.send_message при media_sent=False', () => {
        const r = generateBroadcastBot(validParamsWithMedia);
        assert.ok(r.includes('if not media_sent'));
        assert.ok(r.includes('bot.send_message'));
      });

      it('содержит fallback медиа в блоке except', () => {
        assert.ok(generateBroadcastBot(validParamsWithMedia).includes('except Exception as media_error'));
      });
    });

    describe('Автопереход', () => {
      it('содержит FakeCallbackQuery и handle_callback_', () => {
        const r = generateBroadcastBot(validParamsWithAutoTransition);
        assert.ok(r.includes('auto_target'));
        assert.ok(r.includes('handle_callback_'));
      });

      it('содержит all_nodes_dict для отправки следующего узла', () => {
        const r = generateBroadcastBot(validParamsWithAutoTransition);
        assert.ok(r.includes('all_nodes_dict'));
      });

      it('логирует статус поиска handler', () => {
        const r = generateBroadcastBot(validParamsWithAutoTransition);
        assert.ok(r.includes('handler_name'));
      });
    });

    describe('broadcastNodes в шаблоне', () => {
      it('встраивает id узла', () => {
        assert.ok(generateBroadcastBot(validParamsBotUsers).includes('"id": "msg_1"'));
      });

      it('встраивает broadcast_nodes = [', () => {
        assert.ok(generateBroadcastBot(validParamsBotUsers).includes('broadcast_nodes = ['));
      });
    });

    describe('Невалидные данные', () => {
      it('отклоняет nodeId не строку', () => {
        assert.throws(() => generateBroadcastBot(invalidParamsWrongType as any));
      });

      it('отклоняет отсутствие nodeId', () => {
        assert.throws(() => generateBroadcastBot(invalidParamsMissingField as any));
      });

      it('отклоняет неправильный idSourceType', () => {
        const r = broadcastBotParamsSchema.safeParse({ nodeId: 'test', idSourceType: 'all' });
        assert.ok(!r.success);
      });
    });

    describe('Граничные случаи', () => {
      it('разные nodeId → разные имена функций', () => {
        const r1 = generateBroadcastBot({ ...validParamsBotUsers, nodeId: 'node_a' });
        const r2 = generateBroadcastBot({ ...validParamsBotUsers, nodeId: 'node_b' });
        assert.ok(r1.includes('handle_broadcast_node_a'));
        assert.ok(r2.includes('handle_broadcast_node_b'));
        assert.ok(!r1.includes('handle_broadcast_node_b'));
      });
    });

    describe('Производительность', () => {
      it('генерирует код быстрее 10ms', () => {
        const start = Date.now();
        generateBroadcastBot(validParamsBotUsers);
        assert.ok(Date.now() - start < 10);
      });

      it('генерирует 1000 раз быстрее 200ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) generateBroadcastBot(validParamsBotUsers);
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
      const nodes = [{ id: 'b1', type: 'broadcast', position: { x: 0, y: 0 }, data: {} }] as any[];
      assert.strictEqual(collectBroadcastNodes(nodes, 'b1').length, 0);
    });
  });

  describe('broadcastBotParamsSchema', () => {
    it('принимает минимальный набор полей', () => {
      assert.ok(broadcastBotParamsSchema.safeParse({ nodeId: 'test' }).success);
    });

    it('дефолт idSourceType = bot_users', () => {
      const r = broadcastBotParamsSchema.safeParse({ nodeId: 'test' });
      assert.ok(r.success && r.data.idSourceType === 'bot_users');
    });

    it('принимает все значения idSourceType', () => {
      for (const v of ['user_ids', 'bot_users', 'both']) {
        assert.ok(broadcastBotParamsSchema.safeParse({ nodeId: 'test', idSourceType: v }).success);
      }
    });

    it('принимает broadcastNodes как массив', () => {
      assert.ok(broadcastBotParamsSchema.safeParse({ nodeId: 'test', broadcastNodes: [{ id: 'n1', text: 'Hi' }] }).success);
    });

    it('использует ZodDefault для idSourceType', () => {
      assert.strictEqual(broadcastBotParamsSchema.shape.idSourceType.constructor.name, 'ZodDefault');
    });
  });
});
