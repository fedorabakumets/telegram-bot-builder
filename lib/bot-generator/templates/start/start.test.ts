/**
 * @fileoverview Тесты для шаблона обработчика /start
 * @module templates/start/start.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateStart } from './start.renderer';
import {
  validParamsBasic,
  validParamsWithChecks,
  validParamsWithMultipleSelection,
  validParamsWithAutoTransition,
  validParamsWithSynonyms,
  validParamsWithInlineKeyboard,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './start.fixture';
import { startParamsSchema } from './start.schema';

describe('start.py.jinja2 шаблон', () => {
  describe('generateStart()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать базовый обработчик /start', () => {
        const result = generateStart(validParamsBasic);

        assert.ok(result.includes('start_handler'));
        assert.ok(result.includes('@dp.message(CommandStart())'));
        assert.ok(result.includes('logging.info'));
      });

      it('должен генерировать обработчик с проверкой приватности', () => {
        const result = generateStart(validParamsWithChecks);

        assert.ok(result.includes('is_private_chat'));
        assert.ok(result.includes('❌ Эта команда доступна только в приватных чатах'));
      });

      it('должен генерировать обработчик с проверкой администратора', () => {
        const result = generateStart(validParamsWithChecks);

        assert.ok(result.includes('is_admin'));
        assert.ok(result.includes('❌ У вас нет прав для выполнения этой команды'));
      });

      it('должен генерировать обработчик с проверкой авторизации', () => {
        const result = generateStart(validParamsWithChecks);

        assert.ok(result.includes('check_auth'));
        assert.ok(result.includes('❌ Необходимо войти в систему'));
      });

      it('должен генерировать инициализацию множественного выбора', () => {
        const result = generateStart(validParamsWithMultipleSelection);

        assert.ok(result.includes('multi_select'));
        assert.ok(result.includes('multi_select_node'));
        assert.ok(result.includes('Инициализировано состояние множественного выбора'));
      });

      it('должен генерировать inline клавиатуру', () => {
        const result = generateStart(validParamsWithInlineKeyboard);

        assert.ok(result.includes('InlineKeyboardBuilder'));
        assert.ok(result.includes('InlineKeyboardButton'));
        assert.ok(result.includes('callback_data'));
      });

      it('должен генерировать reply клавиатуру', () => {
        const result = generateStart(validParamsWithSynonyms);

        assert.ok(result.includes('ReplyKeyboardBuilder'));
        assert.ok(result.includes('KeyboardButton'));
        assert.ok(result.includes('resize_keyboard=True'));
      });

      it('должен генерировать обработчики синонимов', () => {
        const result = generateStart(validParamsWithSynonyms);

        assert.ok(result.includes('lambda message: message.text and message.text.lower() == "привет"'));
        assert.ok(result.includes('lambda message: message.text and message.text.lower() == "здравствуй"'));
        assert.ok(result.includes('lambda message: message.text and message.text.lower() == "hello"'));
        assert.ok(result.includes('lambda message: message.text and message.text.lower() == "hi"'));
      });

      it('должен генерировать автопереход', () => {
        const result = generateStart(validParamsWithAutoTransition);

        assert.ok(result.includes('⚡ АВТОПЕРЕХОД'));
        assert.ok(result.includes('main_menu'));
        assert.ok(result.includes('FakeCallbackQuery'));
      });

      it('должен генерировать логирование вызова команды', () => {
        const result = generateStart(validParamsBasic);

        assert.ok(result.includes('logging.info'));
        assert.ok(result.includes('Команда /start вызвана пользователем'));
      });

      it('должен генерировать URL кнопки', () => {
        const result = generateStart(validParamsWithInlineKeyboard);

        assert.ok(result.includes('url="https://example.com"'));
      });

      it('должен генерировать сохранение пользователя в БД', () => {
        const result = generateStart(validParamsWithChecks);

        assert.ok(result.includes('save_user_to_db'));
        assert.ok(result.includes('init_user_variables'));
        assert.ok(result.includes('update_user_data_in_db'));
      });

      it('должен генерировать HTML форматирование', () => {
        const result = generateStart(validParamsWithChecks);

        assert.ok(result.includes('parse_mode="HTML"'));
      });

      it('должен генерировать разные nodeId для разных узлов', () => {
        const result1 = generateStart({ ...validParamsBasic, nodeId: 'a' });
        const result2 = generateStart({ ...validParamsBasic, nodeId: 'b' });

        assert.ok(result1.includes('multi_select_node"] = "a"') || result1.includes('nodeId'));
        assert.ok(result2.includes('multi_select_node"] = "b"') || result2.includes('nodeId'));
      });
    });

    describe('Проверки безопасности', () => {
      it('должен включать только isPrivateOnly проверку', () => {
        const result = generateStart({
          ...validParamsBasic,
          isPrivateOnly: true,
        });

        assert.ok(result.includes('is_private_chat'));
        assert.ok(!result.includes('is_admin'));
        assert.ok(!result.includes('check_auth'));
      });

      it('должен включать только adminOnly проверку', () => {
        const result = generateStart({
          ...validParamsBasic,
          adminOnly: true,
        });

        assert.ok(!result.includes('is_private_chat'));
        assert.ok(result.includes('is_admin'));
        assert.ok(!result.includes('check_auth'));
      });

      it('должен включать только requiresAuth проверку', () => {
        const result = generateStart({
          ...validParamsBasic,
          requiresAuth: true,
        });

        assert.ok(!result.includes('is_private_chat'));
        assert.ok(!result.includes('is_admin'));
        assert.ok(result.includes('check_auth'));
      });
    });

    describe('Множественный выбор', () => {
      it('должен инициализировать multi_select массив', () => {
        const result = generateStart(validParamsWithMultipleSelection);

        assert.ok(result.includes('user_data[user_id]["multi_select"] = []'));
      });

      it('должен инициализировать multi_select_node', () => {
        const result = generateStart(validParamsWithMultipleSelection);

        assert.ok(result.includes('user_data[user_id]["multi_select_node"]'));
        assert.ok(result.includes('start_3'));
      });

      it('должен генерировать кнопки selection с callback_data', () => {
        const result = generateStart(validParamsWithMultipleSelection);

        assert.ok(result.includes('callback_data="select_btn_sport"'));
        assert.ok(result.includes('callback_data="select_btn_music"'));
        assert.ok(result.includes('callback_data="select_btn_travel"'));
      });
    });

    describe('Автопереходы', () => {
      it('должен генерировать FakeCallbackQuery для автоперехода', () => {
        const result = generateStart(validParamsWithAutoTransition);

        assert.ok(result.includes('class FakeCallbackQuery:'));
        assert.ok(result.includes('fake_callback = FakeCallbackQuery'));
      });

      it('должен генерировать вызов handle_callback для автоперехода', () => {
        const result = generateStart(validParamsWithAutoTransition);

        assert.ok(result.includes('handle_callback_main_menu'));
      });
    });

    describe('Синонимы', () => {
      it('должен генерировать обработчики для всех синонимов', () => {
        const result = generateStart(validParamsWithSynonyms);

        assert.ok(result.includes('start_synonym_1_handler'));
        assert.ok(result.includes('start_synonym_2_handler'));
        assert.ok(result.includes('start_synonym_3_handler'));
        assert.ok(result.includes('start_synonym_4_handler'));
      });

      it('должен генерировать проверку типа чата для синонимов', () => {
        const result = generateStart(validParamsWithSynonyms);

        assert.ok(result.includes("message.chat.type in ['group', 'supergroup']"));
      });

      it('должен генерировать проверку администратора для синонимов', () => {
        const result = generateStart({
          ...validParamsWithSynonyms,
          adminOnly: true,
        });

        assert.ok(result.includes('is_admin'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateStart(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateStart(invalidParamsMissingField);
        });
      });

      it('должен отклонять неправильный keyboardType', () => {
        const result = startParamsSchema.safeParse({
          nodeId: 'test',
          messageText: 'Привет!',
          keyboardType: 'invalid',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять неправильный formatMode', () => {
        const result = startParamsSchema.safeParse({
          nodeId: 'test',
          messageText: 'Привет!',
          formatMode: 'invalid',
        });

        assert.ok(!result.success);
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = startParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен использовать значения по умолчанию для всех полей', () => {
        const result = startParamsSchema.safeParse({
          nodeId: 'test',
          messageText: 'Привет!',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.isPrivateOnly, false);
          assert.strictEqual(result.data.adminOnly, false);
          assert.strictEqual(result.data.requiresAuth, false);
          assert.strictEqual(result.data.keyboardType, 'none');
          assert.strictEqual(result.data.formatMode, 'none');
        }
      });

      it('должен принимать все значения enum для keyboardType', () => {
        const types = ['inline', 'reply', 'none'];

        for (const type of types) {
          const result = startParamsSchema.safeParse({
            nodeId: 'test',
            messageText: 'Привет!',
            keyboardType: type,
          });
          assert.ok(result.success, `Тип ${type} должен быть валидным`);
        }
      });

      it('должен принимать все значения enum для formatMode', () => {
        const modes = ['html', 'markdown', 'none'];

        for (const mode of modes) {
          const result = startParamsSchema.safeParse({
            nodeId: 'test',
            messageText: 'Привет!',
            formatMode: mode,
          });
          assert.ok(result.success, `Режим ${mode} должен быть валидным`);
        }
      });

      it('должен использовать пустой массив для synonyms по умолчанию', () => {
        const result = startParamsSchema.safeParse({
          nodeId: 'test',
          messageText: 'Привет!',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.deepStrictEqual(result.data.synonyms, []);
        }
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateStart(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateStart(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('startParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = startParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = startParamsSchema.safeParse({
          nodeId: 'test',
          messageText: 'Привет!',
          isPrivateOnly: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный enum для keyboardType', () => {
        const result = startParamsSchema.safeParse({
          nodeId: 'test',
          messageText: 'Привет!',
          keyboardType: 'popup',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный enum для formatMode', () => {
        const result = startParamsSchema.safeParse({
          nodeId: 'test',
          messageText: 'Привет!',
          formatMode: 'latex',
        });
        assert.ok(!result.success);
      });

      it('должен принимать buttons с правильной структурой', () => {
        const result = startParamsSchema.safeParse({
          nodeId: 'test',
          messageText: 'Привет!',
          buttons: [
            {
              text: 'Кнопка',
              action: 'callback',
              target: 'target',
              id: 'btn_1',
            },
          ],
        });
        assert.ok(result.success);
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 20 полей', () => {
        const shape = startParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 20);
      });

      it('должен использовать ZodEnum для keyboardType', () => {
        const shape = startParamsSchema.shape;
        assert.strictEqual(shape.keyboardType.constructor.name, 'ZodEnum');
      });

      it('должен использовать ZodEnum для formatMode', () => {
        const shape = startParamsSchema.shape;
        assert.strictEqual(shape.formatMode.constructor.name, 'ZodEnum');
      });

      it('должен использовать ZodBoolean для isPrivateOnly', () => {
        const shape = startParamsSchema.shape;
        assert.strictEqual(shape.isPrivateOnly.constructor.name, 'ZodBoolean');
      });

      it('должен использовать ZodArray для synonyms', () => {
        const shape = startParamsSchema.shape;
        assert.strictEqual(shape.synonyms.constructor.name, 'ZodArray');
      });
    });
  });
});
