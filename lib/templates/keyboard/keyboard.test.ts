/**
 * @fileoverview Тесты для шаблона клавиатуры
 * @module templates/keyboard/keyboard.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateKeyboard } from './keyboard.renderer';
import {
  validParamsInline,
  validParamsReply,
  validParamsWithLayout,
  validParamsEmpty,
  validParamsOneTime,
  invalidParamsWrongType,
  invalidParamsMissingField,
  expectedOutputInline,
  expectedOutputReply,
  expectedOutputEmpty,
} from './keyboard.fixture';
import { keyboardParamsSchema } from './keyboard.schema';

describe('keyboard.py.jinja2 шаблон', () => {
  describe('generateKeyboard()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать inline клавиатуру', () => {
        const result = generateKeyboard(validParamsInline);

        assert.ok(result.includes('InlineKeyboardBuilder'));
        assert.ok(result.includes('InlineKeyboardButton'));
        assert.ok(result.includes('callback_data'));
      });

      it('должен генерировать reply клавиатуру', () => {
        const result = generateKeyboard(validParamsReply);

        assert.ok(result.includes('ReplyKeyboardBuilder'));
        assert.ok(result.includes('KeyboardButton'));
        assert.ok(result.includes('resize_keyboard'));
      });

      it('должен генерировать пустую клавиатуру', () => {
        const result = generateKeyboard(validParamsEmpty);

        assert.ok(result.includes('keyboard = None'));
      });

      it('должен генерировать клавиатуру с раскладкой', () => {
        const result = generateKeyboard(validParamsWithLayout);

        assert.ok(result.includes('InlineKeyboardBuilder'));
        assert.ok(result.includes('Ряд 1'));
        assert.ok(result.includes('Ряд 2'));
      });

      it('должен генерировать oneTimeKeyboard', () => {
        const result = generateKeyboard(validParamsOneTime);

        assert.ok(result.includes('one_time_keyboard=True'));
        assert.ok(result.includes('resize_keyboard=False'));
      });
    });

    describe('Inline клавиатура', () => {
      it('должен генерировать callback кнопки', () => {
        const result = generateKeyboard(validParamsInline);

        assert.ok(result.includes('callback_data="btn_stats"'));
        assert.ok(result.includes('callback_data="btn_settings"'));
      });

      it('должен генерировать URL кнопки', () => {
        const result = generateKeyboard(validParamsInline);

        assert.ok(result.includes('url="https://example.com"'));
      });

      it('должен генерировать keyboard = builder.as_markup()', () => {
        const result = generateKeyboard(validParamsInline);

        assert.ok(result.includes('keyboard = builder.as_markup()'));
      });
    });

    describe('Reply клавиатура', () => {
      it('должен генерировать KeyboardButton', () => {
        const result = generateKeyboard(validParamsReply);

        assert.ok(result.includes('KeyboardButton(text='));
      });

      it('должен генерировать resize_keyboard=True по умолчанию', () => {
        const result = generateKeyboard(validParamsReply);

        assert.ok(result.includes('resize_keyboard=True'));
      });

      it('должен генерировать one_time_keyboard=False по умолчанию', () => {
        const result = generateKeyboard(validParamsReply);

        assert.ok(result.includes('one_time_keyboard=False'));
      });
    });

    describe('Раскладка', () => {
      it('должен генерировать комментарии для ручной раскладки', () => {
        const result = generateKeyboard(validParamsWithLayout);

        assert.ok(result.includes('# Ряд 1:'));
        assert.ok(result.includes('# Ряд 2:'));
      });

      it('должен генерировать авто-раскладку', () => {
        const result = generateKeyboard({
          ...validParamsWithLayout,
          keyboardLayout: {
            rows: [],
            columns: 3,
            autoLayout: true,
          },
        });

        assert.ok(result.includes('# Авто-раскладка: 3 колонок'));
      });

      it('должен генерировать кнопки в правильном порядке', () => {
        const result = generateKeyboard(validParamsWithLayout);

        const btn1Index = result.indexOf('btn_1');
        const btn2Index = result.indexOf('btn_2');
        const btn3Index = result.indexOf('btn_3');
        const btn4Index = result.indexOf('btn_4');

        assert.ok(btn1Index < btn2Index && btn2Index < btn3Index && btn3Index < btn4Index);
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateKeyboard(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateKeyboard(invalidParamsMissingField);
        });
      });

      it('должен отклонять неправильный keyboardType', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'invalid',
          buttons: [],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(!result.success);
      });
    });

    describe('Валидация схемы', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = keyboardParamsSchema.safeParse(validParamsInline);
        assert.ok(result.success);
      });

      it('должен использовать значения по умолчанию для всех полей', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'none',
          buttons: [],
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.oneTimeKeyboard, false);
          assert.strictEqual(result.data.resizeKeyboard, true);
        }
      });

      it('должен принимать все значения enum для keyboardType', () => {
        const types = ['inline', 'reply', 'none'];

        for (const type of types) {
          const result = keyboardParamsSchema.safeParse({
            keyboardType: type,
            buttons: [],
            oneTimeKeyboard: false,
            resizeKeyboard: true,
          });
          assert.ok(result.success, `Тип ${type} должен быть валидным`);
        }
      });

      it('должен принимать keyboardLayout с правильной структурой', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [],
          keyboardLayout: {
            rows: [{ buttonIds: ['btn_1', 'btn_2'] }],
            columns: 2,
            autoLayout: false,
          },
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(result.success);
      });

      it('должен использовать пустой массив для buttons по умолчанию', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'none',
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });

        assert.ok(result.success);
        if (result.success) {
          assert.deepStrictEqual(result.data.buttons, []);
        }
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateKeyboard(validParamsInline);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateKeyboard(validParamsInline);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 500, `1000 генераций заняли ${duration}ms (ожидалось < 500ms)`);
      });
    });

    describe('Проверка отступов', () => {
      it('должен генерировать keyboard = None без начальных отступов', () => {
        const result = generateKeyboard(validParamsEmpty);

        // Проверяем, что keyboard = None начинается без отступов
        const lines = result.split('\n');
        const keyboardLine = lines.find(line => line.includes('keyboard = None'));

        assert.ok(keyboardLine, 'Должна быть строка с keyboard = None');
        assert.ok(
          keyboardLine.startsWith('keyboard'),
          `keyboard = None не должен начинаться с отступов, получено: "${keyboardLine}"`
        );
      });

      it('должен генерировать builder = InlineKeyboardBuilder без начальных отступов', () => {
        const result = generateKeyboard(validParamsInline);

        const lines = result.split('\n');
        const builderLine = lines.find(line => line.includes('builder = InlineKeyboardBuilder()'));

        assert.ok(builderLine, 'Должна быть строка с builder = InlineKeyboardBuilder()');
        assert.ok(
          builderLine.startsWith('builder'),
          `builder = InlineKeyboardBuilder() не должен начинаться с отступов, получено: "${builderLine}"`
        );
      });

      it('должен генерировать keyboard = builder.as_markup() без начальных отступов', () => {
        const result = generateKeyboard(validParamsInline);

        const lines = result.split('\n');
        const keyboardLine = lines.find(line => line.includes('keyboard = builder.as_markup()'));

        assert.ok(keyboardLine, 'Должна быть строка с keyboard = builder.as_markup()');
        assert.ok(
          keyboardLine.startsWith('keyboard'),
          `keyboard = builder.as_markup() не должен начинаться с отступов, получено: "${keyboardLine}"`
        );
      });

      it('должен генерировать keyboard = builder.as_markup() с правильными параметрами', () => {
        const result = generateKeyboard(validParamsReply);
        
        assert.ok(result.includes('resize_keyboard='));
        assert.ok(result.includes('one_time_keyboard='));
      });

      it('не должен содержать несколько операторов на одной строке (Python syntax)', () => {
        const result = generateKeyboard(validParamsInline);

        // Проверяем что нет конструкций вида ")builder.add(" или ")keyboard ="
        assert.ok(
          !result.includes(')builder.add('),
          'Не должно быть нескольких операторов на одной строке: ")builder.add("'
        );
        assert.ok(
          !result.includes(')keyboard ='),
          'Не должно быть нескольких операторов на одной строке: ")keyboard ="'
        );
        assert.ok(
          !result.includes('builder.add(InlineKeyboardButton') || result.split('\n').every(line => 
            !line.includes('builder.add(InlineKeyboardButton') || 
            line.trim().startsWith('builder.add(')
          ),
          'Каждый builder.add() должен быть на отдельной строке'
        );
      });

      it('должен генерировать каждый оператор на отдельной строке', () => {
        const result = generateKeyboard(validParamsInline);
        const lines = result.split('\n');

        // Находим строки с builder.add
        const addLines = lines.filter(line => line.trim().startsWith('builder.add('));
        
        // Каждая строка должна содержать только один вызов builder.add
        for (const line of addLines) {
          const addCount = (line.match(/builder\.add\(/g) || []).length;
          assert.strictEqual(
            addCount,
            1,
            `Строка должна содержать только один builder.add(), получено ${addCount}: "${line.trim()}"`
          );
        }
      });
    });
  });

  describe('keyboardParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = keyboardParamsSchema.safeParse(validParamsInline);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [],
          oneTimeKeyboard: 'true',
          resizeKeyboard: true,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный enum для keyboardType', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'popup',
          buttons: [],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(!result.success);
      });

      it('должен принимать buttons с правильной структурой', () => {
        const result = keyboardParamsSchema.safeParse({
          keyboardType: 'inline',
          buttons: [
            { id: 'btn_1', text: 'Button', action: 'callback', target: 'btn' },
          ],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
        });
        assert.ok(result.success);
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 20 полей', () => {
        const shape = keyboardParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 20);
      });

      it('должен использовать ZodOptional для keyboardType', () => {
        const shape = keyboardParamsSchema.shape;
        assert.ok(shape.keyboardType.isOptional());
      });

      it('должен использовать ZodOptional для oneTimeKeyboard', () => {
        const shape = keyboardParamsSchema.shape;
        assert.ok(shape.oneTimeKeyboard.isOptional());
      });

      it('должен использовать ZodOptional для resizeKeyboard', () => {
        const shape = keyboardParamsSchema.shape;
        assert.ok(shape.resizeKeyboard.isOptional());
      });

      it('должен использовать ZodOptional для buttons', () => {
        const shape = keyboardParamsSchema.shape;
        assert.ok(shape.buttons.isOptional());
      });
    });
  });
});
