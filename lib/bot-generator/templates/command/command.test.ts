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

        assert.ok(result.includes('check_user_variable_inline'));
        assert.ok(result.includes('conditional_met = True'));
        assert.ok(result.includes('Условие'));
      });

      it('должен генерировать inline клавиатуру', () => {
        const result = generateCommand(validParamsWithKeyboard);

        assert.ok(result.includes('InlineKeyboardBuilder'));
        assert.ok(result.includes('InlineKeyboardButton'));
        assert.ok(result.includes('callback_data'));
      });

      it('должен генерировать reply клавиатуру', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes('ReplyKeyboardBuilder'));
        assert.ok(result.includes('KeyboardButton'));
        assert.ok(result.includes('resize_keyboard=True'));
      });

      it('должен генерировать обработчики синонимов', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes('lambda message: message.text and message.text.lower() == "привет"'));
        assert.ok(result.includes('lambda message: message.text and message.text.lower() == "здравствуй"'));
        assert.ok(result.includes('lambda message: message.text and message.text.lower() == "hello"'));
      });

      it('должен генерировать разные команды для разных узлов', () => {
        const result1 = generateCommand({ ...validParamsBasic, nodeId: 'a', command: '/start' });
        const result2 = generateCommand({ ...validParamsBasic, nodeId: 'b', command: '/menu' });

        assert.ok(result1.includes('start_handler'));
        assert.ok(result2.includes('menu_handler'));
      });

      it('должен генерировать HTML форматирование', () => {
        const result = generateCommand(validParamsWithChecks);

        assert.ok(result.includes('parse_mode="HTML"'));
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

        assert.ok(result.includes('url="https://example.com"'));
      });

      it('должен генерировать fallback сообщение', () => {
        const result = generateCommand(validParamsWithConditionals);

        assert.ok(result.includes('fallbackMessage') || result.includes('Профиль не найден'));
      });
    });

    describe('Проверки безопасности', () => {
      it('должен включать только isPrivateOnly проверку', () => {
        const result = generateCommand({
          ...validParamsBasic,
          isPrivateOnly: true,
        });

        assert.ok(result.includes('is_private_chat'));
        assert.ok(!result.includes('is_admin'));
        assert.ok(!result.includes('check_auth'));
      });

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

        assert.ok(result.includes('ReplyKeyboardBuilder'));
        assert.ok(result.includes('Пополнить'));
        assert.ok(result.includes('Вывести'));
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

        assert.ok(result.includes('InlineKeyboardBuilder'));
        assert.ok(result.includes('callback_data="btn_stats"'));
        assert.ok(result.includes('callback_data="btn_settings"'));
      });

      it('должен генерировать inline клавиатуру с url', () => {
        const result = generateCommand(validParamsWithKeyboard);

        assert.ok(result.includes('url="https://example.com"'));
      });

      it('должен генерировать reply клавиатуру', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes('ReplyKeyboardBuilder'));
        assert.ok(result.includes('KeyboardButton'));
        assert.ok(result.includes('resize_keyboard=True'));
      });
    });

    describe('Синонимы', () => {
      it('должен генерировать обработчики для всех синонимов', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes('synonym_1_handler'));
        assert.ok(result.includes('synonym_2_handler'));
        assert.ok(result.includes('synonym_3_handler'));
      });

      it('должен генерировать проверку типа чата для синонимов', () => {
        const result = generateCommand(validParamsWithSynonyms);

        assert.ok(result.includes("message.chat.type in ['group', 'supergroup']"));
      });

      it('должен генерировать проверку администратора для синонимов', () => {
        const result = generateCommand({
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

      it('должен использовать значения по умолчанию для всех полей', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
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

      it('должен использовать пустой массив для synonyms по умолчанию', () => {
        const result = commandParamsSchema.safeParse({
          nodeId: 'test',
          command: '/help',
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
        generateCommand(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateCommand(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
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
          isPrivateOnly: 'true',
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
      it('должен иметь 20 полей', () => {
        const shape = commandParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 20);
      });

      it('должен использовать ZodEnum для keyboardType', () => {
        const shape = commandParamsSchema.shape;
        assert.strictEqual(shape.keyboardType.constructor.name, 'ZodEnum');
      });

      it('должен использовать ZodEnum для formatMode', () => {
        const shape = commandParamsSchema.shape;
        assert.strictEqual(shape.formatMode.constructor.name, 'ZodEnum');
      });

      it('должен использовать ZodBoolean для isPrivateOnly', () => {
        const shape = commandParamsSchema.shape;
        assert.strictEqual(shape.isPrivateOnly.constructor.name, 'ZodBoolean');
      });

      it('должен использовать ZodArray для synonyms', () => {
        const shape = commandParamsSchema.shape;
        assert.strictEqual(shape.synonyms.constructor.name, 'ZodArray');
      });
    });
  });
});
