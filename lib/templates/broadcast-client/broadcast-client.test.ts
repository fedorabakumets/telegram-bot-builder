/**
 * @fileoverview Тесты для шаблона рассылки Client API (Telethon)
 * @module templates/broadcast-client/broadcast-client.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateBroadcastClient, collectBroadcastNodes } from './broadcast-client.renderer';
import {
  validParamsBotUsers,
  validParamsUserIds,
  validParamsBoth,
  validParamsEmpty,
  validParamsWithMedia,
  validParamsWithAutoTransition,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './broadcast-client.fixture';
import { broadcastClientParamsSchema } from './broadcast-client.schema';

describe('broadcast-client.py.jinja2', () => {
  describe('generateBroadcastClient()', () => {
    it('генерирует async def handle_broadcast_<nodeId>', () => {
      const r = generateBroadcastClient(validParamsBotUsers);
      assert.ok(r.includes('async def handle_broadcast_broadcast_1'));
    });

    it('содержит комментарий Client API / Telethon', () => {
      const r = generateBroadcastClient(validParamsBotUsers);
      assert.ok(r.includes('Telethon'));
    });

    it('содержит маркеры @@NODE_START и @@NODE_END', () => {
      const r = generateBroadcastClient(validParamsBotUsers);
      assert.ok(r.includes('@@NODE_START:broadcast_1@@'));
      assert.ok(r.includes('@@NODE_END:broadcast_1@@'));
    });

    describe('Сессия', () => {
      it('проверяет db_pool и user_telegram_settings', () => {
        const r = generateBroadcastClient(validParamsBotUsers);
        assert.ok(r.includes('db_pool'));
        assert.ok(r.includes('user_telegram_settings'));
        assert.ok(r.includes('session_string'));
      });

      it('логирует user_id сессии', () => {
        const r = generateBroadcastClient(validParamsBotUsers);
        assert.ok(r.includes("client_session['user_id']"));
      });

      it('возвращает ошибку если сессия не найдена', () => {
        const r = generateBroadcastClient(validParamsBotUsers);
        assert.ok(r.includes('Client API не авторизован'));
      });
    });

    describe('Получатели', () => {
      it('bot_users: SELECT из bot_users', () => {
        const r = generateBroadcastClient(validParamsBotUsers);
        assert.ok(r.includes('SELECT DISTINCT user_id FROM bot_users'));
        assert.ok(!r.includes('FROM user_ids'));
      });

      it('user_ids: SELECT из user_ids', () => {
        const r = generateBroadcastClient(validParamsUserIds);
        assert.ok(r.includes('SELECT DISTINCT user_id FROM user_ids'));
        assert.ok(!r.includes('FROM bot_users'));
      });

      it('both: SELECT из обеих таблиц', () => {
        const r = generateBroadcastClient(validParamsBoth);
        assert.ok(r.includes('SELECT DISTINCT user_id FROM user_ids'));
        assert.ok(r.includes('SELECT DISTINCT user_id FROM bot_users'));
      });

      it('логирует userbot user_id', () => {
        const r = generateBroadcastClient(validParamsBotUsers);
        assert.ok(r.includes('Client API (Userbot)'));
      });
    });

    describe('Инициализация Telethon', () => {
      it('содержит TelegramClient и StringSession', () => {
        const r = generateBroadcastClient(validParamsBotUsers);
        assert.ok(r.includes('TelegramClient'));
        assert.ok(r.includes('StringSession'));
      });

      it('содержит get_full_media_path', () => {
        assert.ok(generateBroadcastClient(validParamsBotUsers).includes('get_full_media_path'));
      });

      it('логирует инициализацию Telethon', () => {
        assert.ok(generateBroadcastClient(validParamsBotUsers).includes('Инициализация Telethon'));
      });
    });

    describe('Отправка', () => {
      it('содержит app.send_message', () => {
        assert.ok(generateBroadcastClient(validParamsBotUsers).includes('app.send_message'));
      });

      it('содержит success_count, error_count, blocked_count', () => {
        const r = generateBroadcastClient(validParamsBotUsers);
        assert.ok(r.includes('success_count'));
        assert.ok(r.includes('error_count'));
        assert.ok(r.includes('blocked_count'));
      });

      it('содержит await app.connect() и await app.disconnect()', () => {
        const r = generateBroadcastClient(validParamsBotUsers);
        assert.ok(r.includes('await app.connect()'));
        assert.ok(r.includes('await app.disconnect()'));
      });

      it('обрабатывает PEER_ID_INVALID', () => {
        assert.ok(generateBroadcastClient(validParamsBotUsers).includes('PEER_ID_INVALID'));
      });

      it('содержит отчёт с Client API', () => {
        assert.ok(generateBroadcastClient(validParamsBotUsers).includes('Client API'));
      });

      it('содержит successMessage в отчёте', () => {
        assert.ok(generateBroadcastClient(validParamsBotUsers).includes('Рассылка выполнена успешно'));
      });
    });

    describe('Пустой broadcastNodes', () => {
      it('выводит предупреждение и broadcast_nodes = []', () => {
        const r = generateBroadcastClient(validParamsEmpty);
        assert.ok(r.includes('Нет сообщений для рассылки'));
        assert.ok(r.includes('broadcast_nodes = []'));
      });
    });

    describe('Медиа', () => {
      it('содержит app.send_file', () => {
        assert.ok(generateBroadcastClient(validParamsWithMedia).includes('app.send_file'));
      });

      it('fallback app.send_message если медиа не отправлено', () => {
        const r = generateBroadcastClient(validParamsWithMedia);
        assert.ok(r.includes('if not media_sent'));
        assert.ok(r.includes('app.send_message'));
      });
    });

    describe('Автопереход', () => {
      it('содержит current_node_index и autoTransitionTo', () => {
        const r = generateBroadcastClient(validParamsWithAutoTransition);
        assert.ok(r.includes('current_node_index'));
        assert.ok(r.includes('autoTransitionTo'));
      });

      it('ищет следующий узел по индексу в broadcast_nodes', () => {
        const r = generateBroadcastClient(validParamsWithAutoTransition);
        assert.ok(r.includes('next_index'));
        assert.ok(r.includes('enumerate(broadcast_nodes)'));
      });
    });

    describe('broadcastNodes в шаблоне', () => {
      it('встраивает id узла', () => {
        assert.ok(generateBroadcastClient(validParamsBotUsers).includes('"id": "msg_1"'));
      });

      it('встраивает broadcast_nodes = [', () => {
        assert.ok(generateBroadcastClient(validParamsBotUsers).includes('broadcast_nodes = ['));
      });
    });

    describe('Невалидные данные', () => {
      it('отклоняет nodeId не строку', () => {
        assert.throws(() => generateBroadcastClient(invalidParamsWrongType as any));
      });

      it('отклоняет отсутствие nodeId', () => {
        assert.throws(() => generateBroadcastClient(invalidParamsMissingField as any));
      });

      it('отклоняет неправильный idSourceType', () => {
        const r = broadcastClientParamsSchema.safeParse({ nodeId: 'test', idSourceType: 'all' });
        assert.ok(!r.success);
      });
    });

    describe('Граничные случаи', () => {
      it('разные nodeId → разные имена функций', () => {
        const r1 = generateBroadcastClient({ ...validParamsBotUsers, nodeId: 'node_a' });
        const r2 = generateBroadcastClient({ ...validParamsBotUsers, nodeId: 'node_b' });
        assert.ok(r1.includes('handle_broadcast_node_a'));
        assert.ok(r2.includes('handle_broadcast_node_b'));
        assert.ok(!r1.includes('handle_broadcast_node_b'));
      });
    });

    describe('Производительность', () => {
      it('генерирует код быстрее 10ms', () => {
        const start = Date.now();
        generateBroadcastClient(validParamsBotUsers);
        assert.ok(Date.now() - start < 10);
      });

      it('генерирует 1000 раз быстрее 200ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) generateBroadcastClient(validParamsBotUsers);
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

  describe('broadcastClientParamsSchema', () => {
    it('принимает минимальный набор полей', () => {
      assert.ok(broadcastClientParamsSchema.safeParse({ nodeId: 'test' }).success);
    });

    it('дефолт idSourceType = bot_users', () => {
      const r = broadcastClientParamsSchema.safeParse({ nodeId: 'test' });
      assert.ok(r.success && r.data.idSourceType === 'bot_users');
    });

    it('принимает все значения idSourceType', () => {
      for (const v of ['user_ids', 'bot_users', 'both']) {
        assert.ok(broadcastClientParamsSchema.safeParse({ nodeId: 'test', idSourceType: v }).success);
      }
    });

    it('принимает broadcastNodes как массив', () => {
      assert.ok(broadcastClientParamsSchema.safeParse({ nodeId: 'test', broadcastNodes: [{ id: 'n1', text: 'Hi' }] }).success);
    });

    it('использует ZodDefault для idSourceType', () => {
      assert.strictEqual(broadcastClientParamsSchema.shape.idSourceType.constructor.name, 'ZodDefault');
    });
  });
});
