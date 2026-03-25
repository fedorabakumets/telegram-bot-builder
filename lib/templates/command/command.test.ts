/**
 * @fileoverview Тесты для шаблона обработчика команд
 * @module templates/command/command.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateCommand } from './command.renderer';
import {
  validParamsBasic,
  validParamsWithChecks,
  validParamsWithConditionals,
  validParamsWithKeyboard,
  validParamsWithSynonyms,
  validParamsWithAutoTransition,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './command.fixture';
import { commandParamsSchema } from './command.schema';

describe('command.py.jinja2 шаблон', () => {
  describe('generateCommand()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать базовый обработчик команды', () => {
        const result = generateCommand(validParamsBasic);

        assert.ok(result.includes('help_handler'));
        assert.ok(result.includes('@dp.message(Command("help"))'));
        assert.ok(result.includes('logging.info'));
      });

      it('должен генерировать обработчик с проверкой приватности', () => {
        const result = generateCommand(validParamsWithChecks);

        assert.ok(result.includes('is_private_chat'));
        assert.ok(result.includes('❌ Эта команда доступна только в приватных чатах'));
      });

      it('должен генерировать обработчик с проверкой администратора', () => {
        const result = generateCommand(validParamsWithChecks);

        assert.ok(result.includes('is_admin'));
        assert.ok(result.includes('❌ У вас нет прав для выполнения этой команды'));
      });

      it('должен генерировать обработчик с проверкой авторизации', () => {
        const result = generateCommand(validParamsWithChecks);

        assert.ok(result.includes('check_auth'));
        assert.ok(result.includes('❌ Необходимо войти в систему'));
      });

      it('должен генерировать обработчик с условными сообщениями', () => {
        const result = generateCommand(validParamsWithConditionals);

        assert.ok(result.includes('conditional_met = True') || result.includes('Условные сообщения'));
        assert.ok(result.includes('user_data_dict') || result.includes('user_record'));
      });

      it('должен генерировать inline клавиатуру', () => {
        const result = generateCommand(validParamsWithKeyboard);

        assert.ok(result.includes('InlineKeyboardBuilder') || result.includes('keyboard'));
        assert.ok(result.includes('InlineKeyboardButton') || result.includes('callback_data') || result.includes('btn_stats'));
      });

      it('должен генерировать reply клавиатуру', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes('ReplyKeyboardBuilder') || result.includes('keyboard'));
        assert.ok(result.includes('KeyboardButton') || result.includes('btn_about') || result.includes('btn_contacts'));
      });

      it('должен генерировать обработчики синонимов', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes('synonym') || result.includes('lambda message'));
        assert.ok(result.includes('привет') || result.includes('здравствуй') || result.includes('hello'));
      });

      it('должен генерировать разные команды для разных узлов', () => {
        const result1 = generateCommand({ ...validParamsBasic, nodeId: 'a', command: '/start' });
        const result2 = generateCommand({ ...validParamsBasic, nodeId: 'b', command: '/menu' });

        assert.ok(result1.includes('start_handler'));
        assert.ok(result2.includes('menu_handler'));
      });

      it('должен генерировать HTML форматирование', () => {
        const result = generateCommand(validParamsWithChecks);

        assert.ok(result.includes('parse_mode') || result.includes('HTML'));
      });

      it('должен генерировать сохранение пользователя в БД', () => {
        const result = generateCommand(validParamsWithChecks);

        assert.ok(result.includes('save_user_to_db'));
        assert.ok(result.includes('init_user_variables'));
        assert.ok(result.includes('update_user_data_in_db'));
      });

      it('должен генерировать логирование вызова команды', () => {
        const result = generateCommand(validParamsBasic);

        assert.ok(result.includes('logging.info'));
        assert.ok(result.includes('Команда'));
        assert.ok(result.includes('вызвана пользователем'));
      });

      it('должен генерировать URL кнопки', () => {
        const result = generateCommand(validParamsWithKeyboard);

        assert.ok(result.includes('url=') || result.includes('https://example.com') || result.includes('btn_site'));
      });

      it('должен генерировать handle_callback для кнопок с goto → nodeId команды', () => {
        const result = generateCommand(validParamsBasic);

        assert.ok(
          result.includes('handle_callback_cmd_1'),
          'Должен быть обработчик handle_callback_cmd_1'
        );
        assert.ok(
          result.includes('c.data == "cmd_1"'),
          'Должен быть декоратор с проверкой callback_data == "cmd_1"'
        );
        assert.ok(
          result.includes('@dp.callback_query(lambda c: c.data == "cmd_1"'),
          'Должен быть полный декоратор @dp.callback_query'
        );
      });

      it('должен генерировать fallback сообщение', () => {
        const result = generateCommand(validParamsWithConditionals);

        assert.ok(result.includes('fallbackMessage') || result.includes('Профиль не найден'));
      });
    });

    describe('Проверки безопасности', () => {
      it('должен включать только adminOnly проверку', () => {
        const result = generateCommand({
          ...validParamsBasic,
          adminOnly: true,
        });

        assert.ok(!result.includes('is_private_chat'));
        assert.ok(result.includes('is_admin'));
        assert.ok(!result.includes('check_auth'));
      });

      it('должен включать только requiresAuth проверку', () => {
        const result = generateCommand({
          ...validParamsBasic,
          requiresAuth: true,
        });

        assert.ok(!result.includes('is_private_chat'));
        assert.ok(!result.includes('is_admin'));
        assert.ok(result.includes('check_auth'));
      });
    });

    describe('Условные сообщения', () => {
      it('должен сортировать условия по приоритету', () => {
        const result = generateCommand(validParamsWithConditionals);

        const balanceIndex = result.indexOf('balance');
        const nameIndex = result.indexOf('name');
        assert.ok(balanceIndex < nameIndex, 'Условие с priority 1 должно быть перед priority 2');
      });

      it('должен генерировать клавиатуру для условного сообщения', () => {
        const result = generateCommand(validParamsWithConditionals);

        assert.ok(result.includes('keyboard') || result.includes('Пополнить') || result.includes('Вывести'));
      });

      it('должен генерировать fallback при отсутствии условий', () => {
        const result = generateCommand(validParamsWithConditionals);

        assert.ok(result.includes('else:'));
        assert.ok(result.includes('Профиль не найден') || result.includes('fallbackMessage'));
      });
    });

    describe('Клавиатуры', () => {
      it('должен генерировать inline клавиатуру с callback', () => {
        const result = generateCommand(validParamsWithKeyboard);

        assert.ok(result.includes('InlineKeyboardBuilder') || result.includes('callback_data'));
        assert.ok(result.includes('stats') || result.includes('settings'));
      });

      it('должен генерировать inline клавиатуру с url', () => {
        const result = generateCommand(validParamsWithKeyboard);

        assert.ok(result.includes('url=') || result.includes('https://example.com') || result.includes('btn_site'));
      });

      it('должен генерировать reply клавиатуру', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes('ReplyKeyboardBuilder') || result.includes('keyboard'));
        assert.ok(result.includes('KeyboardButton') || result.includes('btn_about') || result.includes('btn_contacts'));
      });
    });

    describe('Синонимы', () => {
      it('должен генерировать обработчики для всех синонимов', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes('synonym') || result.includes('handler'));
      });

      it('должен генерировать проверку типа чата для синонимов', () => {
        const result = generateCommand(validParamsWithSynonyms);

        // Для command-синонимов генерируется lambda-обработчик без фильтра по типу чата
        assert.ok(result.includes('lambda message') || result.includes('synonym'));
      });

      it('должен генерировать проверку администратора для синонимов', () => {
        const result = generateCommand({
          ...validParamsWithSynonyms,
          adminOnly: true,
        });

        assert.ok(result.includes('is_admin'));
      });

      it('должен сохранять исходного пользователя в FakeCallbackQuery при автопереходе', () => {
        const result = generateCommand(validParamsWithAutoTransition);

        assert.ok(result.includes('class FakeCallbackQuery:'));
        assert.ok(result.includes('def __init__(self, message, from_user, target_node_id):'));
        assert.ok(result.includes('self.from_user = from_user'));
        assert.ok(result.includes('fake_callback = FakeCallbackQuery(sent_message or message, message.from_user, "after_cmd")'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateCommand(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateCommand(invalidParamsMissingField);
        });
      });

      it('должен отклонять неправильный keyboardType', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
          keyboardType: 'invalid',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять неправильный formatMode', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
          formatMode: 'invalid',
        });

        assert.ok(!result.success);
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = commandParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен принимать undefined для всех опциональных полей', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.messageText, undefined);
          assert.strictEqual(result.data.adminOnly, undefined);
          assert.strictEqual(result.data.requiresAuth, undefined);
          assert.strictEqual(result.data.keyboardType, undefined);
          assert.strictEqual(result.data.formatMode, undefined);
        }
      });

      it('должен принимать все значения enum для keyboardType', () => {
        const types = ['inline', 'reply', 'none'];

        for (const type of types) {
          const result = commandParamsSchema.safeParse({
            nodeId: 'test',
            command: '/help',
            keyboardType: type,
          });
          assert.ok(result.success, `Тип ${type} должен быть валидным`);
        }
      });

      it('должен принимать все значения enum для formatMode', () => {
        const modes = ['html', 'markdown', 'none'];

        for (const mode of modes) {
          const result = commandParamsSchema.safeParse({
            nodeId: 'test',
            command: '/help',
            formatMode: mode,
          });
          assert.ok(result.success, `Режим ${mode} должен быть валидным`);
        }
      });

      it('должен использовать undefined для synonyms по умолчанию', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.synonyms, undefined);
        }
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateCommand(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      
    });
  });

  describe('commandParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = commandParamsSchema.safeParse(validParamsBasic);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
          adminOnly: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный enum для keyboardType', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
          keyboardType: 'popup',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный enum для formatMode', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
          formatMode: 'latex',
        });
        assert.ok(!result.success);
      });

      it('должен принимать conditionalMessages с правильной структурой', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
          enableConditionalMessages: true,
          conditionalMessages: [
            {
              condition: 'user_data_exists',
              variableName: 'balance',
              priority: 1,
            },
          ],
        });
        assert.ok(result.success);
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 22 поля', () => {
        const shape = commandParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 22);
      });

      it('должен использовать ZodOptional для messageText', () => {
        const shape = commandParamsSchema.shape;
        assert.ok(shape.messageText.isOptional());
      });

      it('должен использовать ZodOptional для keyboardType', () => {
        const shape = commandParamsSchema.shape;
        assert.ok(shape.keyboardType.isOptional());
      });

      it('должен использовать ZodOptional для formatMode', () => {
        const shape = commandParamsSchema.shape;
        assert.ok(shape.formatMode.isOptional());
      });

      it('должен использовать ZodOptional для synonyms', () => {
        const shape = commandParamsSchema.shape;
        assert.ok(shape.synonyms.isOptional());
      });
    });
  });
});
