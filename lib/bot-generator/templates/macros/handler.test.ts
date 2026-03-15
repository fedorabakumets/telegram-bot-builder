/**
 * @fileoverview Тесты для макроса обработчика узлов
 * @module templates/macros/handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { renderHandlerMacro } from './handler.renderer';
import { handlerMacroParamsSchema } from './handler.schema';

describe('handler.py.jinja2 макрос', () => {
  describe('renderHandlerMacro()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик для start узла', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'start_1',
            type: 'start',
            data: { messageText: 'Hello!' },
          },
          enableComments: false,
        });

        assert.ok(result.includes('@dp.message(CommandStart())'));
        assert.ok(result.includes('async def start_handler'));
      });

      it('должен генерировать обработчик для command узла', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'cmd_1',
            type: 'command',
            data: { command: '/help', messageText: 'Help!' },
          },
          enableComments: false,
        });

        assert.ok(result.includes('@dp.message(Command("help"))'));
        assert.ok(result.includes('async def handle_help_command'));
      });

      it('должен генерировать обработчик для callback узла', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'cb_1',
            type: 'callback',
            data: { messageText: 'Callback!' },
          },
          enableComments: false,
        });

        assert.ok(result.includes('@dp.callback_query'));
        assert.ok(result.includes('async def handle_callback_cb_1'));
      });

      it('должен включать комментарии при enableComments=true', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'start_1',
            type: 'start',
            data: { messageText: 'Hello!' },
          },
          enableComments: true,
        });

        assert.ok(result.includes('@@NODE_START:start_1@@'));
        assert.ok(result.includes('@@NODE_END:start_1@@'));
      });

      it('должен не включать комментарии при enableComments=false', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'start_1',
            type: 'start',
            data: { messageText: 'Hello!' },
          },
          enableComments: false,
        });

        assert.ok(!result.includes('@@NODE_START:'));
        assert.ok(!result.includes('@@NODE_END:'));
      });

      it('должен включать keyboard при наличии кнопок', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'start_1',
            type: 'start',
            data: {
              messageText: 'Hello!',
              buttons: [[{ text: 'Btn1', callback_data: 'btn1' }]],
              keyboardType: 'inline',
            },
          },
          enableComments: false,
        });

        assert.ok(result.includes('InlineKeyboardMarkup'));
        assert.ok(result.includes('keyboard'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять неправильный тип узла', () => {
        assert.throws(() => {
          // @ts-expect-error
          renderHandlerMacro({
            node: {
              id: '1',
              type: 'invalid',
            },
            enableComments: false,
          });
        });
      });

      it('должен отклонять отсутствие id', () => {
        assert.throws(() => {
          // @ts-expect-error
          renderHandlerMacro({
            node: {
              type: 'start',
            },
            enableComments: false,
          });
        });
      });

      it('должен принимать undefined для enableComments', () => {
        const result = handlerMacroParamsSchema.safeParse({
          node: { id: '1', type: 'start' },
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.enableComments, undefined);
        }
      });
    });

    describe('Граничные случаи', () => {
      it('должен обрабатывать узел без data', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'start_1',
            type: 'start',
          },
          enableComments: false,
        });

        assert.ok(result.includes('async def start_handler'));
      });

      it('должен обрабатывать empty buttons', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'start_1',
            type: 'start',
            data: {
              messageText: 'Hello!',
              buttons: [],
            },
          },
          enableComments: false,
        });

        assert.ok(result.includes('await message.answer(text)'));
      });

      it('должен обрабатывать reply клавиатуру', () => {
        const result = renderHandlerMacro({
          node: {
            id: 'start_1',
            type: 'start',
            data: {
              messageText: 'Hello!',
              buttons: [[{ text: 'Btn1' }]],
              keyboardType: 'reply',
            },
          },
          enableComments: false,
        });

        assert.ok(result.includes('ReplyKeyboardBuilder'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        renderHandlerMacro({
          node: { id: '1', type: 'start' },
          enableComments: false,
        });
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms`);
      });

      it('должен генерировать код 100 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 100; i++) {
          renderHandlerMacro({
            node: { id: '1', type: 'start' },
            enableComments: false,
          });
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `100 генераций заняли ${duration}ms`);
      });
    });
  });

  describe('handlerMacroParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать валидные параметры', () => {
        const result = handlerMacroParamsSchema.safeParse({
          node: { id: '1', type: 'start' },
          enableComments: false,
        });
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = handlerMacroParamsSchema.safeParse({
          node: { id: '1', type: 'start' },
          enableComments: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный type', () => {
        const result = handlerMacroParamsSchema.safeParse({
          node: { id: '1', type: 'invalid' },
          enableComments: false,
        });
        assert.ok(!result.success);
      });

      it('должен принимать все типы узлов', () => {
        const types = ['start', 'command', 'callback'] as const;
        types.forEach(type => {
          const result = handlerMacroParamsSchema.safeParse({
            node: { id: '1', type },
            enableComments: false,
          });
          assert.ok(result.success, `Тип ${type} должен быть валиден`);
        });
      });
    });
  });
});
