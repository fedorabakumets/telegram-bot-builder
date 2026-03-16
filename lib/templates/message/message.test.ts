/**
 * @fileoverview Тесты для шаблона сообщения
 * @module templates/message/message.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMessage } from './message.renderer';
import {
  validParamsBasic,
  validParamsWithAutoTransition,
  validParamsWithMedia,
  validParamsWithSecurity,
  validParamsReply,
  invalidParamsWrongType,
  invalidParamsMissingNodeId,
} from './message.fixture';
import { messageParamsSchema } from './message.schema';

describe('message.py.jinja2 шаблон', () => {
  describe('generateMessage()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик callback для базового сообщения', () => {
        const result = generateMessage(validParamsBasic);

        assert.ok(result.includes('@dp.callback_query'));
        assert.ok(result.includes('handle_callback_msg_123'));
        assert.ok(result.includes('callback_query: types.CallbackQuery'));
      });

      it('должен генерировать callback.answer()', () => {
        const result = generateMessage(validParamsBasic);

        assert.ok(result.includes('await callback_query.answer()'));
      });

      it('должен генерировать логирование', () => {
        const result = generateMessage(validParamsBasic);

        assert.ok(result.includes('logging.info'));
        assert.ok(result.includes('🔵 Переход к узлу'));
      });

      it('должен генерировать инициализацию переменных', () => {
        const result = generateMessage(validParamsBasic);

        assert.ok(result.includes('user_id = callback_query.from_user.id'));
        assert.ok(result.includes('all_user_vars = await init_all_user_vars(user_id)'));
      });

      it('должен генерировать inline клавиатуру', () => {
        const result = generateMessage(validParamsBasic);

        assert.ok(result.includes('InlineKeyboardBuilder'));
        assert.ok(result.includes('InlineKeyboardButton'));
      });

      it('должен генерировать reply клавиатуру', () => {
        const result = generateMessage(validParamsReply);

        assert.ok(result.includes('ReplyKeyboardBuilder'));
        assert.ok(result.includes('KeyboardButton'));
        assert.ok(result.includes('resize_keyboard=True'));
      });
    });

    describe('Проверки безопасности', () => {
      it('должен генерировать isPrivateOnly проверку', () => {
        const result = generateMessage(validParamsWithSecurity);

        assert.ok(result.includes('is_private_chat'));
        assert.ok(result.includes('❌ Эта команда доступна только в приватных чатах'));
      });

      it('должен генерировать adminOnly проверку', () => {
        const result = generateMessage(validParamsWithSecurity);

        assert.ok(result.includes('is_admin'));
        assert.ok(result.includes('❌ У вас нет прав'));
      });

      it('должен генерировать requiresAuth проверку', () => {
        const result = generateMessage(validParamsWithSecurity);

        assert.ok(result.includes('check_auth'));
        assert.ok(result.includes('❌ Необходимо войти в систему'));
      });
    });

    describe('Автопереход', () => {
      it('должен генерировать FakeCallbackQuery для автоперехода', () => {
        const result = generateMessage(validParamsWithAutoTransition);

        assert.ok(result.includes('class FakeCallbackQuery:'));
        assert.ok(result.includes('fake_callback = FakeCallbackQuery'));
      });

      it('должен генерировать вызов следующего обработчика', () => {
        const result = generateMessage(validParamsWithAutoTransition);

        assert.ok(result.includes('await handle_callback_next_step(fake_callback)'));
      });

      it('должен генерировать логирование автоперехода', () => {
        const result = generateMessage(validParamsWithAutoTransition);

        assert.ok(result.includes('⚡ Автопереход'));
        assert.ok(result.includes('✅ Автопереход выполнен'));
      });

      it('должен возвращать после автоперехода', () => {
        const result = generateMessage(validParamsWithAutoTransition);

        assert.ok(result.includes('return'));
      });
    });

    describe('Медиа', () => {
      it('должен генерировать сохранение imageUrl', () => {
        const result = generateMessage(validParamsWithMedia);

        assert.ok(result.includes('image_url_photo_node'));
        assert.ok(result.includes('https://example.com/image.jpg'));
      });

      it('должен генерировать update_user_data_in_db для медиа', () => {
        const result = generateMessage({
          ...validParamsWithMedia,
          userDatabaseEnabled: true,
        });

        assert.ok(result.includes('await update_user_data_in_db'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateMessage(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры без nodeId', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateMessage(invalidParamsMissingNodeId);
        });
      });

      it('должен отклонять string вместо boolean', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
          isPrivateOnly: 'true',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять неправильный keyboardType', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
          keyboardType: 'popup',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять неправильный formatMode', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
          formatMode: 'markdown_v2',
        });

        assert.ok(!result.success);
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = messageParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен использовать значения по умолчанию для всех полей', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.keyboardType, 'none');
          assert.strictEqual(result.data.formatMode, 'none');
          assert.strictEqual(result.data.isPrivateOnly, false);
        }
      });

      it('должен принимать все значения enum для keyboardType', () => {
        const types = ['inline', 'reply', 'none'];

        for (const type of types) {
          const result = messageParamsSchema.safeParse({
            nodeId: 'msg_123',
            keyboardType: type,
          });
          assert.ok(result.success, `Тип ${type} должен быть валидным`);
        }
      });

      it('должен принимать все значения enum для formatMode', () => {
        const modes = ['html', 'markdown', 'none'];

        for (const mode of modes) {
          const result = messageParamsSchema.safeParse({
            nodeId: 'msg_123',
            formatMode: mode,
          });
          assert.ok(result.success, `Режим ${mode} должен быть валидным`);
        }
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateMessage(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateMessage(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 200, `1000 генераций заняли ${duration}ms (ожидалось < 200ms)`);
      });
    });
  });

  describe('messageParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = messageParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
          isPrivateOnly: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять number вместо string для nodeId', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 123,
        });
        assert.ok(!result.success);
      });

      it('должен принимать null для опциональных полей', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
          autoTransitionTo: null,
        });
        assert.ok(!result.success); // autoTransitionTo не принимает null
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен использовать false для isPrivateOnly по умолчанию', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.isPrivateOnly, false);
        }
      });

      it('должен использовать false для adminOnly по умолчанию', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.adminOnly, false);
        }
      });

      it('должен использовать false для enableAutoTransition по умолчанию', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.enableAutoTransition, false);
        }
      });

      it('должен использовать none для keyboardType по умолчанию', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.keyboardType, 'none');
        }
      });

      it('должен использовать none для formatMode по умолчанию', () => {
        const result = messageParamsSchema.safeParse({
          nodeId: 'msg_123',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.formatMode, 'none');
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 35 полей', () => {
        const shape = messageParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 35);
      });

      it('должен использовать ZodOptional для isPrivateOnly', () => {
        const shape = messageParamsSchema.shape;
        assert.ok(shape.isPrivateOnly.isOptional());
      });

      it('должен использовать ZodOptional для adminOnly', () => {
        const shape = messageParamsSchema.shape;
        assert.ok(shape.adminOnly.isOptional());
      });

      it('должен использовать ZodOptional для enableAutoTransition', () => {
        const shape = messageParamsSchema.shape;
        assert.ok(shape.enableAutoTransition.isOptional());
      });
    });
  });
});
