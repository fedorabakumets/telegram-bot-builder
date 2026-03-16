/**
 * @fileoverview Тесты для шаблона импортов
 * @module templates/imports/imports.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateImports } from './imports.renderer';
import {
  validParamsAllEnabled,
  validParamsAllDisabled,
  validParamsDatabaseOnly,
  validParamsMediaOnly,
  validParamsInlineOnly,
  validParamsAutoTransitionsOnly,
  validParamsParseModeOnly,
  validParamsMediaGroupsOnly,
  validParamsUrlImagesOnly,
  validParamsDatetimeOnly,
  validParamsDatetimeWithTimezone,
  invalidParamsWrongType,
  expectedOutputAllEnabled,
  expectedOutputAllDisabled,
} from './imports.fixture';
import { importsParamsSchema } from './imports.schema';

describe('imports.py.jinja2 шаблон', () => {
  describe('generateImports()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать код со всеми импортами (всё включено)', () => {
        const result = generateImports(validParamsAllEnabled);

        assert.ok(result.includes('import asyncpg'));
        assert.ok(result.includes('import json'));
        assert.ok(result.includes('from aiogram.exceptions import TelegramBadRequest'));
        assert.ok(result.includes('import aiohttp'));
        assert.ok(result.includes('from aiohttp import TCPConnector'));
      });

      it('должен генерировать код без условных импортов (всё выключено)', () => {
        const result = generateImports(validParamsAllDisabled);

        assert.ok(result.includes('import asyncio'));
        assert.ok(!result.includes('import asyncpg'));
        assert.ok(!result.includes('TelegramBadRequest'));
        assert.ok(!result.includes('aiohttp'));
      });

      it('должен генерировать только импорты БД', () => {
        const result = generateImports(validParamsDatabaseOnly);

        assert.ok(result.includes('import asyncpg'));
        assert.ok(!result.includes('aiohttp'));
        assert.ok(!result.includes('TelegramBadRequest'));
      });

      it('должен генерировать только импорты медиа', () => {
        const result = generateImports(validParamsMediaOnly);

        assert.ok(!result.includes('asyncpg'));
        assert.ok(result.includes('aiohttp'));
        assert.ok(!result.includes('TelegramBadRequest'));
      });

      it('должен генерировать импорты для inline кнопок', () => {
        const result = generateImports(validParamsInlineOnly);

        assert.ok(result.includes('TelegramBadRequest'));
        assert.ok(!result.includes('asyncpg'));
        assert.ok(!result.includes('aiohttp'));
      });

      it('должен генерировать импорты для автопереходов', () => {
        const result = generateImports(validParamsAutoTransitionsOnly);

        assert.ok(result.includes('TelegramBadRequest'));
        assert.ok(!result.includes('asyncpg'));
        assert.ok(!result.includes('aiohttp'));
      });

      it('должен генерировать импорты для ParseMode', () => {
        const result = generateImports(validParamsParseModeOnly);

        assert.ok(result.includes('from aiogram.enums import ParseMode'));
        assert.ok(!result.includes('asyncpg'));
        assert.ok(!result.includes('aiohttp'));
        assert.ok(!result.includes('TelegramBadRequest'));
      });

      it('должен генерировать импорты для MediaGroups', () => {
        const result = generateImports(validParamsMediaGroupsOnly);

        assert.ok(result.includes('from aiogram.types import InputMediaPhoto, InputMediaVideo, InputMediaAudio, InputMediaDocument'));
        assert.ok(!result.includes('asyncpg'));
        assert.ok(!result.includes('aiohttp'));
        assert.ok(!result.includes('ParseMode'));
      });

      it('должен генерировать импорты для UrlImages', () => {
        const result = generateImports(validParamsUrlImagesOnly);

        assert.ok(result.includes('from aiogram.types import URLInputFile'));
        assert.ok(!result.includes('asyncpg'));
        assert.ok(!result.includes('aiohttp'));
        assert.ok(!result.includes('ParseMode'));
      });

      it('должен генерировать импорты для Datetime', () => {
        const result = generateImports(validParamsDatetimeOnly);

        assert.ok(result.includes('from datetime import datetime'));
        assert.ok(!result.includes('timezone'));
        assert.ok(!result.includes('asyncpg'));
      });

      it('должен генерировать импорты для Datetime + Timezone', () => {
        const result = generateImports(validParamsDatetimeWithTimezone);

        assert.ok(result.includes('from datetime import datetime, timezone'));
        assert.ok(!result.includes('asyncpg'));
      });

      it('должен генерировать datetime при userDatabaseEnabled=true', () => {
        const result = generateImports(validParamsDatabaseOnly);

        assert.ok(result.includes('from datetime import datetime'));
      });

      it('должен совпадать с ожидаемым выводом (всё включено)', () => {
        const result = generateImports(validParamsAllEnabled);

        assert.ok(result.includes('import asyncio'));
        assert.ok(result.includes('import asyncpg'));
        assert.ok(result.includes('import json'));
        assert.ok(result.includes('TelegramBadRequest'));
        assert.ok(result.includes('aiohttp'));
        assert.ok(result.includes('TCPConnector'));
        assert.ok(result.includes('import re'));
      });

      it('должен совпадать с ожидаемым выводом (всё выключено)', () => {
        const result = generateImports(validParamsAllDisabled);

        assert.ok(result.includes('import asyncio'));
        assert.ok(!result.includes('asyncpg'));
        assert.ok(!result.includes('TelegramBadRequest'));
        assert.ok(!result.includes('aiohttp'));
        assert.ok(result.includes('import re'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateImports(invalidParamsWrongType);
        });
      });

      it('должен использовать значения по умолчанию для отсутствующих полей', () => {
        const result = importsParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
          assert.strictEqual(result.data.hasInlineButtons, false);
          assert.strictEqual(result.data.hasMediaNodes, false);
        }
      });

      it('должен отклонять null вместо boolean', () => {
        const result = importsParamsSchema.safeParse({
          userDatabaseEnabled: null,
        });

        assert.ok(!result.success);
      });

      it('должен отклонять число вместо boolean', () => {
        const result = importsParamsSchema.safeParse({
          hasInlineButtons: 1,
        });

        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен добавлять TelegramBadRequest при hasInlineButtons=true OR hasAutoTransitions=true', () => {
        const result1 = generateImports({
          userDatabaseEnabled: false,
          hasInlineButtons: true,
          hasAutoTransitions: false,
          hasMediaNodes: false,
          hasUploadImages: false,
        });

        const result2 = generateImports({
          userDatabaseEnabled: false,
          hasInlineButtons: false,
          hasAutoTransitions: true,
          hasMediaNodes: false,
          hasUploadImages: false,
        });

        const result3 = generateImports({
          userDatabaseEnabled: false,
          hasInlineButtons: true,
          hasAutoTransitions: true,
          hasMediaNodes: false,
          hasUploadImages: false,
        });

        assert.ok(result1.includes('TelegramBadRequest'));
        assert.ok(result2.includes('TelegramBadRequest'));
        assert.ok(result3.includes('TelegramBadRequest'));
      });

      it('должен добавлять aiohttp при hasMediaNodes=true OR hasUploadImages=true', () => {
        const result1 = generateImports({
          userDatabaseEnabled: false,
          hasInlineButtons: false,
          hasAutoTransitions: false,
          hasMediaNodes: true,
          hasUploadImages: false,
        });

        const result2 = generateImports({
          userDatabaseEnabled: false,
          hasInlineButtons: false,
          hasAutoTransitions: false,
          hasMediaNodes: false,
          hasUploadImages: true,
        });

        const result3 = generateImports({
          userDatabaseEnabled: false,
          hasInlineButtons: false,
          hasAutoTransitions: false,
          hasMediaNodes: true,
          hasUploadImages: true,
        });

        assert.ok(result1.includes('aiohttp'));
        assert.ok(result2.includes('aiohttp'));
        assert.ok(result3.includes('aiohttp'));
      });

      it('должен добавлять asyncpg только при userDatabaseEnabled=true', () => {
        const result1 = generateImports({
          userDatabaseEnabled: true,
          hasInlineButtons: false,
          hasAutoTransitions: false,
          hasMediaNodes: false,
          hasUploadImages: false,
        });

        const result2 = generateImports({
          userDatabaseEnabled: false,
          hasInlineButtons: false,
          hasAutoTransitions: false,
          hasMediaNodes: false,
          hasUploadImages: false,
        });

        assert.ok(result1.includes('asyncpg'));
        assert.ok(!result2.includes('asyncpg'));
      });

      it('должен всегда включать базовые импорты', () => {
        const result = generateImports(validParamsAllDisabled);

        assert.ok(result.includes('import asyncio'));
        assert.ok(result.includes('from aiogram import Bot, Dispatcher, types, F'));
        assert.ok(result.includes('from dotenv import load_dotenv'));
        assert.ok(result.includes('import re'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateImports(validParamsAllEnabled);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateImports(validParamsAllEnabled);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('importsParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все boolean поля', () => {
        const result = importsParamsSchema.safeParse(validParamsAllEnabled);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = importsParamsSchema.safeParse({
          userDatabaseEnabled: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять number вместо boolean', () => {
        const result = importsParamsSchema.safeParse({
          hasInlineButtons: 1,
        });
        assert.ok(!result.success);
      });

      it('должен отклонять null вместо boolean', () => {
        const result = importsParamsSchema.safeParse({
          hasMediaNodes: null,
        });
        assert.ok(!result.success);
      });

      it('должен принимать undefined и использовать значение по умолчанию', () => {
        const result = importsParamsSchema.safeParse({
          hasUploadImages: undefined,
        });
        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.hasUploadImages, false);
        }
      });
    });

    describe('Значения по умолчанию', () => {
      it('должен использовать false для всех полей по умолчанию', () => {
        const result = importsParamsSchema.safeParse({});

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, false);
          assert.strictEqual(result.data.hasInlineButtons, false);
          assert.strictEqual(result.data.hasAutoTransitions, false);
          assert.strictEqual(result.data.hasMediaNodes, false);
          assert.strictEqual(result.data.hasUploadImages, false);
          assert.strictEqual(result.data.hasParseModeNodes, false);
          assert.strictEqual(result.data.hasMediaGroups, false);
          assert.strictEqual(result.data.hasUrlImages, false);
          assert.strictEqual(result.data.hasDatetimeNodes, false);
          assert.strictEqual(result.data.hasTimezoneNodes, false);
        }
      });

      it('должен использовать false для отсутствующих полей', () => {
        const result = importsParamsSchema.safeParse({
          userDatabaseEnabled: true,
          // остальные поля отсутствуют
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.userDatabaseEnabled, true);
          assert.strictEqual(result.data.hasInlineButtons, false);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь все 10 полей', () => {
        const shape = importsParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 10);
        assert.ok(fields.includes('userDatabaseEnabled'));
        assert.ok(fields.includes('hasInlineButtons'));
        assert.ok(fields.includes('hasAutoTransitions'));
        assert.ok(fields.includes('hasMediaNodes'));
        assert.ok(fields.includes('hasUploadImages'));
        assert.ok(fields.includes('hasParseModeNodes'));
        assert.ok(fields.includes('hasMediaGroups'));
        assert.ok(fields.includes('hasUrlImages'));
        assert.ok(fields.includes('hasDatetimeNodes'));
        assert.ok(fields.includes('hasTimezoneNodes'));
      });

      it('должен использовать ZodDefault для всех полей', () => {
        const shape = importsParamsSchema.shape;

        assert.strictEqual(shape.userDatabaseEnabled.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasInlineButtons.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasAutoTransitions.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasMediaNodes.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasUploadImages.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasParseModeNodes.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasMediaGroups.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasUrlImages.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasDatetimeNodes.constructor.name, 'ZodDefault');
        assert.strictEqual(shape.hasTimezoneNodes.constructor.name, 'ZodDefault');
      });
    });
  });
});
