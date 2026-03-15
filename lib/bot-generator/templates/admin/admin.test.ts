/**
 * @fileoverview Тесты для шаблона административных действий
 * @module templates/admin/admin.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateAdmin } from './admin.renderer';
import {
  validParamsPinMessage,
  validParamsBanUser,
  validParamsMuteUser,
  validParamsPromoteUser,
  validParamsDeleteMessage,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './admin.fixture';
import { adminParamsSchema } from './admin.schema';

describe('admin.py.jinja2 шаблон', () => {
  describe('generateAdmin()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик закрепления сообщения', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes('handle_admin_pin_message_admin_1'));
        assert.ok(result.includes('pin_chat_message'));
        assert.ok(result.includes('disable_notification=True'));
      });

      it('должен генерировать обработчик бана пользователя', () => {
        const result = generateAdmin(validParamsBanUser);

        assert.ok(result.includes('handle_admin_ban_user_admin_2'));
        assert.ok(result.includes('ban_chat_member'));
        assert.ok(result.includes('until_date'));
      });

      it('должен генерировать обработчик мута пользователя', () => {
        const result = generateAdmin(validParamsMuteUser);

        assert.ok(result.includes('handle_admin_mute_user_admin_3'));
        assert.ok(result.includes('restrict_chat_member'));
        assert.ok(result.includes('can_send_messages=False'));
      });

      it('должен генерировать обработчик продвижения пользователя', () => {
        const result = generateAdmin(validParamsPromoteUser);

        assert.ok(result.includes('handle_admin_promote_user_admin_4'));
        assert.ok(result.includes('promote_chat_member'));
        assert.ok(result.includes('can_manage_chat=True'));
      });

      it('должен генерировать обработчик удаления сообщения', () => {
        const result = generateAdmin(validParamsDeleteMessage);

        assert.ok(result.includes('handle_admin_delete_message_admin_5'));
        assert.ok(result.includes('delete_message'));
      });

      it('должен включать проверку прав администратора', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes('get_chat_member'));
        assert.ok(result.includes('creator'));
        assert.ok(result.includes('administrator'));
      });

      it('должен включать обработку ошибок', () => {
        const result = generateAdmin(validParamsBanUser);

        assert.ok(result.includes('try'));
        assert.ok(result.includes('except Exception'));
        assert.ok(result.includes('logging.error'));
      });

      it('должен генерировать разные команды для разных действий', () => {
        const result1 = generateAdmin({ ...validParamsPinMessage, nodeId: 'a' });
        const result2 = generateAdmin({ ...validParamsBanUser, nodeId: 'b' });

        assert.ok(result1.includes('admin_pin_message_a'));
        assert.ok(result2.includes('admin_ban_user_b'));
      });

      it('должен генерировать callback обработчик для pin_message', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes('@dp.callback_query'));
        assert.ok(result.includes('admin_callback_admin_1'));
        assert.ok(result.includes('lambda c: c.data.startswith("admin_pin_message_admin_1_")'));
      });

      it('должен генерировать callback обработчик для delete_message', () => {
        const result = generateAdmin(validParamsDeleteMessage);

        assert.ok(result.includes('@dp.callback_query'));
        assert.ok(result.includes('admin_callback_admin_5'));
        assert.ok(result.includes('lambda c: c.data.startswith("admin_delete_message_admin_5_")'));
      });

      it('должен генерировать callback обработчик для ban_user', () => {
        const result = generateAdmin(validParamsBanUser);

        assert.ok(result.includes('@dp.callback_query'));
        assert.ok(result.includes('admin_callback_admin_2'));
        assert.ok(result.includes('lambda c: c.data.startswith("admin_ban_user_admin_2_")'));
      });

      it('должен генерировать callback обработчик с проверкой типа чата', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes("chat.type not in ['group', 'supergroup']"));
        assert.ok(result.includes('Команда работает только в группах'));
      });

      it('должен генерировать callback обработчик с проверкой прав администратора', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes('get_chat_member'));
        assert.ok(result.includes('creator'));
        assert.ok(result.includes('administrator'));
        assert.ok(result.includes('Требуются права администратора'));
      });

      it('должен генерировать обработчики синонимов', () => {
        const result = generateAdmin({
          ...validParamsPinMessage,
          synonyms: ['закрепить', 'прикрепить', 'pin'],
        });

        assert.ok(result.includes('@dp.message'));
        assert.ok(result.includes('message.text.lower() == "закрепить"'));
        assert.ok(result.includes('message.text.lower() == "прикрепить"'));
        assert.ok(result.includes('message.text.lower() == "pin"'));
        assert.ok(result.includes('admin_synonym_admin_1_1'));
        assert.ok(result.includes('admin_synonym_admin_1_2'));
        assert.ok(result.includes('admin_synonym_admin_1_3'));
      });

      it('должен генерировать обработчики синонимов с проверкой типа чата', () => {
        const result = generateAdmin({
          ...validParamsPinMessage,
          synonyms: ['закрепить'],
        });

        assert.ok(result.includes("message.chat.type in ['group', 'supergroup']"));
      });

      it('должен генерировать обработчики синонимов с проверкой прав администратора', () => {
        const result = generateAdmin({
          ...validParamsPinMessage,
          synonyms: ['закрепить'],
        });

        assert.ok(result.includes('get_chat_member'));
        assert.ok(result.includes('Требуются права администратора'));
      });

      it('должен генерировать обработчики синонимов для ban_user', () => {
        const result = generateAdmin({
          ...validParamsBanUser,
          synonyms: ['забанить', 'блок'],
        });

        assert.ok(result.includes('message.text.lower() == "забанить"'));
        assert.ok(result.includes('message.text.lower() == "блок"'));
        assert.ok(result.includes('ban_chat_member'));
      });

      it('должен генерировать обработчики синонимов для kick_user', () => {
        const result = generateAdmin({
          ...validParamsBanUser,
          adminActionType: 'kick_user',
          synonyms: ['кик', 'выгнать'],
        });

        assert.ok(result.includes('message.text.lower() == "кик"'));
        assert.ok(result.includes('message.text.lower() == "выгнать"'));
        assert.ok(result.includes('ban_chat_member'));
        assert.ok(result.includes('unban_chat_member'));
      });

      it('должен генерировать команду с проверкой типа чата', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes('@dp.message(Command('));
        assert.ok(result.includes("message.chat.type not in ['group', 'supergroup']"));
        assert.ok(result.includes('Команда работает только в группах'));
      });

      it('должен генерировать команду с поддержкой reply на сообщения', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes('message.reply_to_message'));
        assert.ok(result.includes('message.reply_to_message.message_id'));
      });

      it('должен генерировать команду с поддержкой указания ID текстом', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes('message.text.split()'));
        assert.ok(result.includes('text_parts[1].isdigit()'));
        assert.ok(result.includes('int(text_parts[1])'));
      });

      it('должен генерировать логирование действий', () => {
        const result = generateAdmin(validParamsPinMessage);

        assert.ok(result.includes('logging.info'));
        assert.ok(result.includes('logging.error'));
        assert.ok(result.includes('Сообщение закреплено пользователем'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateAdmin(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateAdmin(invalidParamsMissingField);
        });
      });

      it('должен отклонять неправильный adminActionType', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'invalid_action',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'ban_user',
          canManageChat: 'true',
        });

        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен принимать undefined для messageIdSource', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'pin_message',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.messageIdSource, undefined);
        }
      });

      it('должен принимать undefined для userIdSource', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'ban_user',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userIdSource, undefined);
        }
      });

      it('должен принимать undefined для всех прав', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'promote_user',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.canManageChat, undefined);
          assert.strictEqual(result.data.canDeleteMessages, undefined);
          assert.strictEqual(result.data.canPinMessages, undefined);
        }
      });

      it('должен принимать undefined для untilDate', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'ban_user',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.untilDate, undefined);
        }
      });

      it('должен генерировать проверку target_user_id == 0 для действий с пользователями', () => {
        const result = generateAdmin(validParamsBanUser);

        assert.ok(result.includes('if target_user_id == 0'));
        assert.ok(result.includes('Не указан целевой пользователь'));
      });

      it('должен генерировать разные источники target_message_id', () => {
        const result1 = generateAdmin({ ...validParamsPinMessage, messageIdSource: 'manual' });
        const result2 = generateAdmin({ ...validParamsPinMessage, messageIdSource: 'variable' });
        const result3 = generateAdmin({ ...validParamsPinMessage, messageIdSource: 'last_message' });

        assert.ok(result1.includes('target_message_id ='));
        assert.ok(result2.includes('user_data.get'));
        assert.ok(result3.includes('message.message_id'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateAdmin(validParamsBanUser);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateAdmin(validParamsBanUser);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('adminParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = adminParamsSchema.safeParse(validParamsBanUser);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'ban_user',
          canManageChat: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный enum для adminActionType', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'super_admin',
        });
        assert.ok(!result.success);
      });

      it('должен принимать все значения enum для adminActionType', () => {
        const actions = [
          'pin_message', 'unpin_message', 'delete_message',
          'ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user',
          'promote_user', 'demote_user',
        ];

        for (const action of actions) {
          const result = adminParamsSchema.safeParse({
            nodeId: 'test',
            adminActionType: action,
          });
          assert.ok(result.success, `Действие ${action} должно быть валидным`);
        }
      });

      it('должен принимать undefined для всех опциональных полей', () => {
        const result = adminParamsSchema.safeParse({
          nodeId: 'test',
          adminActionType: 'ban_user',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.messageIdSource, undefined);
          assert.strictEqual(result.data.userIdSource, undefined);
          assert.strictEqual(result.data.canManageChat, undefined);
          assert.strictEqual(result.data.isAnonymous, undefined);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 21 поле', () => {
        const shape = adminParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 21);
      });

      it('должен использовать ZodOptional для adminActionType', () => {
        const shape = adminParamsSchema.shape;
        assert.ok(shape.adminActionType.isOptional());
      });

      it('должен использовать ZodOptional для untilDate', () => {
        const shape = adminParamsSchema.shape;
        assert.ok(shape.untilDate.isOptional());
      });

      it('должен использовать ZodOptional для canManageChat', () => {
        const shape = adminParamsSchema.shape;
        assert.ok(shape.canManageChat.isOptional());
      });
    });
  });
});
