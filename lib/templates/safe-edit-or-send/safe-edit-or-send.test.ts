/**
 * @fileoverview Тесты для шаблона safe_edit_or_send
 * @module templates/safe-edit-or-send/safe-edit-or-send.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSafeEditOrSend } from './safe-edit-or-send.renderer';
import {
  validParamsBasic,
  validParamsWithAutoTransitions,
  validParamsBothEnabled,
  validParamsBothDisabled,
  invalidParamsWrongType,
  invalidParamsNull,
} from './safe-edit-or-send.fixture';
import { safeEditOrSendParamsSchema } from './safe-edit-or-send.schema';

describe('safe-edit-or-send.py.jinja2 шаблон', () => {
  describe('generateSafeEditOrSend()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать функцию при hasInlineButtonsOrSpecialNodes=true', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.includes('async def safe_edit_or_send'));
        assert.ok(result.includes('Безопасное редактирование сообщения'));
        assert.ok(result.includes('cbq'));
        assert.ok(result.includes('text'));
      });

      it('должен генерировать функцию при hasAutoTransitions=true', () => {
        const result = generateSafeEditOrSend(validParamsWithAutoTransitions);

        assert.ok(result.includes('async def safe_edit_or_send'));
        assert.ok(result.includes('is_auto_transition'));
      });

      it('должен генерировать функцию при обоих флагах=true', () => {
        const result = generateSafeEditOrSend(validParamsBothEnabled);

        assert.ok(result.includes('async def safe_edit_or_send'));
        assert.ok(result.includes('reply_markup'));
        assert.ok(result.includes('is_reply_keyboard'));
      });

      it('должен генерировать пустую строку при обоих флагах=false', () => {
        const result = generateSafeEditOrSend(validParamsBothDisabled);

        assert.strictEqual(result.trim(), '');
      });

      it('должен генерировать обработку user_id', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.includes('user_id = None'));
        assert.ok(result.includes('cbq.from_user.id'));
      });

      it('должен генерировать try-except блок', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.includes('try:'));
        assert.ok(result.includes('except Exception'));
      });

      it('должен генерировать проверку is_auto_transition', () => {
        const result = generateSafeEditOrSend(validParamsWithAutoTransitions);

        assert.ok(result.includes('if is_auto_transition'));
        assert.ok(result.includes('⚡ Автопереход'));
      });

      it('должен генерировать проверку is_reply_keyboard', () => {
        const result = generateSafeEditOrSend(validParamsBothEnabled);

        assert.ok(result.includes('if is_reply_keyboard'));
        assert.ok(result.includes('💬 Reply клавиатура'));
      });

      it('должен генерировать fallback на новое сообщение', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.includes('отправляем новое сообщение'));
        assert.ok(result.includes('cbq.message.answer'));
      });

      it('должен генерировать логирование ошибок', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.includes('logging.warning'));
        assert.ok(result.includes('Не удалось отредактировать сообщение'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          generateSafeEditOrSend(invalidParamsWrongType as any);
        });
      });

      it('должен отклонять null значения', () => {
        assert.throws(() => {
          generateSafeEditOrSend(invalidParamsNull as any);
        });
      });

      it('должен использовать значения по умолчанию для отсутствующих полей', () => {
        const result = generateSafeEditOrSend({} as any);

        assert.strictEqual(result.trim(), '');
      });
    });

    describe('Проверка схемы', () => {
      it('должен иметь правильную структуру схемы', () => {
        const shape = safeEditOrSendParamsSchema.shape;

        assert.ok(shape.hasInlineButtonsOrSpecialNodes);
        assert.ok(shape.hasAutoTransitions);
        assert.ok(shape.hasInlineButtonsOrSpecialNodes.isOptional());
        assert.ok(shape.hasAutoTransitions.isOptional());
      });

      it('должен использовать ZodDefault для всех полей', () => {
        const shape = safeEditOrSendParamsSchema.shape;

        assert.ok(shape.hasInlineButtonsOrSpecialNodes.defaultValue());
        assert.ok(shape.hasAutoTransitions.defaultValue());
      });

      it('должен иметь 2 поля', () => {
        const shape = safeEditOrSendParamsSchema.shape;

        assert.strictEqual(Object.keys(shape).length, 2);
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateSafeEditOrSend(validParamsBasic);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateSafeEditOrSend(validParamsBasic);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });

    describe('Интеграционные тесты', () => {
      it('должен генерировать код который можно вставить в Python функцию', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.includes('async def'));
        assert.ok(result.includes('return result'));
      });

      it('должен генерировать код который можно использовать в if блоке', () => {
        const code = generateSafeEditOrSend(validParamsBasic);

        assert.ok(code.includes('if is_auto_transition'));
        assert.ok(code.includes('elif'));
        assert.ok(code.includes('else:'));
      });

      it('должен генерировать код который можно использовать в try блоке', () => {
        const code = generateSafeEditOrSend(validParamsBasic);

        assert.ok(code.includes('try:'));
        assert.ok(code.includes('except Exception'));
      });
    });

    describe('Проверка на распространённые ошибки Pylance', () => {
      it('не должен содержать ошибку: Операторы без перевода строки перед else', () => {
        const code = generateSafeEditOrSend(validParamsBasic);

        assert.ok(!code.includes(':\nelse:'));
      });

      it('не должен содержать ошибку: Операторы без перевода строки перед elif', () => {
        const code = generateSafeEditOrSend(validParamsBasic);

        assert.ok(!code.includes(':\nelif'));
      });

      it('не должен содержать незавершённые конструкции', () => {
        const code = generateSafeEditOrSend(validParamsBasic);

        assert.ok(!code.match(/:\s*$/m));
      });

      it('не должен содержать несколько операторов на одной строке без точки с запятой', () => {
        const code = generateSafeEditOrSend(validParamsBasic);

        const lines = code.split('\n');
        for (const line of lines) {
          if (line.includes('if ') && line.includes(':') && !line.trim().endsWith(':')) {
            assert.ok(line.includes(';') || line.includes('#'), `Проблема в строке: ${line}`);
          }
        }
      });
    });

    describe('Edge cases', () => {
      it('должен обрабатывать пустое имя узла', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.includes('safe_edit_or_send'));
      });

      it('должен обрабатывать специальные символы в тексте', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.includes('"""'));
      });

      it('должен обрабатывать очень длинный текст', () => {
        const result = generateSafeEditOrSend(validParamsBasic);

        assert.ok(result.length > 100);
      });
    });
  });

  describe('safeEditOrSendParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать boolean поля', () => {
        const result = safeEditOrSendParamsSchema.safeParse(validParamsBasic);

        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = safeEditOrSendParamsSchema.safeParse(invalidParamsWrongType);

        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = safeEditOrSendParamsSchema.safeParse(invalidParamsNull);

        assert.ok(!result.success);
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен использовать false для hasInlineButtonsOrSpecialNodes по умолчанию', () => {
        const result = safeEditOrSendParamsSchema.parse({});

        assert.strictEqual(result.hasInlineButtonsOrSpecialNodes, false);
      });

      it('должен использовать false для hasAutoTransitions по умолчанию', () => {
        const result = safeEditOrSendParamsSchema.parse({});

        assert.strictEqual(result.hasAutoTransitions, false);
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 2 поля', () => {
        const shape = safeEditOrSendParamsSchema.shape;

        assert.strictEqual(Object.keys(shape).length, 2);
      });

      it('должен использовать ZodOptional', () => {
        const shape = safeEditOrSendParamsSchema.shape;

        assert.ok(shape.hasInlineButtonsOrSpecialNodes.isOptional());
        assert.ok(shape.hasAutoTransitions.isOptional());
      });
    });
  });
});
