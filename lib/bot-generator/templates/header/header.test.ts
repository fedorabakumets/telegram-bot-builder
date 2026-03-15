/**
 * @fileoverview Тесты для шаблона заголовка
 * @module templates/header/header.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateHeader } from './header.renderer';
import {
  validParamsAllEnabled,
  validParamsAllDisabled,
  invalidParamsWrongType,
  expectedOutputStandard,
} from './header.fixture';
import { headerParamsSchema } from './header.schema';

describe('header.py.jinja2 шаблон', () => {
  describe('generateHeader()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать UTF-8 заголовок', () => {
        const result = generateHeader(validParamsAllEnabled);

        assert.ok(result.includes('# -*- coding: utf-8 -*-'));
      });

      it('должен включать import os и import sys', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('import os'));
        assert.ok(result.includes('import sys'));
      });

      it('должен включать проверку Windows', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('sys.platform.startswith("win")'));
      });

      it('должен включать PYTHONIOENCODING', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('PYTHONIOENCODING'));
      });

      it('должен включать reconfigure для stdout', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('sys.stdout.reconfigure(encoding="utf-8")'));
      });

      it('должен включать fallback для старых версий', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('codecs.getwriter("utf-8")'));
      });

      it('должен совпадать с ожидаемым выводом', () => {
        const result = generateHeader(validParamsAllEnabled);
        assert.strictEqual(result, expectedOutputStandard);
      });

      it('должен игнорировать параметры (всегда одинаковый вывод)', () => {
        const result1 = generateHeader(validParamsAllEnabled);
        const result2 = generateHeader(validParamsAllDisabled);

        assert.strictEqual(result1, result2);
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error
          generateHeader(invalidParamsWrongType);
        });
      });

      it('должен использовать значения по умолчанию', () => {
        const result = headerParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
          assert.strictEqual(result.data.hasInlineButtons, false);
          assert.strictEqual(result.data.hasMediaNodes, false);
        }
      });

      it('должен отклонять string вместо boolean', () => {
        const result = headerParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = headerParamsSchema.safeParse({
          hasInlineButtons: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен всегда включать codecs', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('import codecs'));
      });

      it('должен всегда включать try-except', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('try:'));
        assert.ok(result.includes('except (AttributeError, UnicodeError):'));
      });

      it('должен включать stderr', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('sys.stderr.reconfigure'));
      });

      it('должен включать os.environ', () => {
        const result = generateHeader(validParamsAllDisabled);

        assert.ok(result.includes('os.environ["PYTHONIOENCODING"]'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateHeader(validParamsAllEnabled);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateHeader(validParamsAllEnabled);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms`);
      });
    });
  });

  describe('headerParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все boolean поля', () => {
        const result = headerParamsSchema.safeParse(validParamsAllEnabled);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = headerParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять number вместо boolean', () => {
        const result = headerParamsSchema.safeParse({
          hasInlineButtons: 1,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null', () => {
        const result = headerParamsSchema.safeParse({
          hasMediaNodes: null,
        });
        assert.ok(!result.success);
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен принимать undefined для всех полей', () => {
        const result = headerParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, undefined);
          assert.strictEqual(result.data.hasInlineButtons, undefined);
          assert.strictEqual(result.data.hasMediaNodes, undefined);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 3 поля', () => {
        const shape = headerParamsSchema.shape;
        assert.strictEqual(Object.keys(shape).length, 3);
      });

      it('должен использовать ZodOptional для всех полей', () => {
        const shape = headerParamsSchema.shape;
        assert.ok(shape.userDatabaseEnabled.isOptional());
        assert.ok(shape.hasInlineButtons.isOptional());
        assert.ok(shape.hasMediaNodes.isOptional());
      });
    });
  });
});
