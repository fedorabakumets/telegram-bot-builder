/**
 * @fileoverview Тесты для шаблона голосового сообщения
 * @module templates/voice/voice.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateVoice } from './voice.renderer';
import {
  validParamsFull,
  validParamsUrlOnly,
  validParamsWithDuration,
  validParamsSilent,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './voice.fixture';
import { voiceParamsSchema } from './voice.schema';

describe('voice.py.jinja2 шаблон', () => {
  describe('generateVoice()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать обработчик голосового сообщения с подписью и длительностью', () => {
        const result = generateVoice(validParamsFull);

        assert.ok(result.includes('handle_voice_voice_1'));
        assert.ok(result.includes('voice_url'));
        assert.ok(result.includes('answer_voice'));
        assert.ok(result.includes('caption=caption'));
        assert.ok(result.includes('duration=duration'));
      });

      it('должен генерировать обработчик только с URL', () => {
        const result = generateVoice(validParamsUrlOnly);

        assert.ok(result.includes('handle_voice_voice_2'));
        assert.ok(result.includes('aiohttp.ClientSession'));
      });

      it('должен генерировать обработчик с длительностью', () => {
        const result = generateVoice(validParamsWithDuration);

        assert.ok(result.includes('duration = 60'));
        assert.ok(result.includes('disable_notification=True'));
      });

      it('должен генерировать обработчик с disable_notification', () => {
        const result = generateVoice(validParamsSilent);

        assert.ok(result.includes('disable_notification=True'));
      });

      it('должен включать замену переменных в подписи', () => {
        const result = generateVoice(validParamsFull);

        assert.ok(result.includes('replace_variables_in_text'));
        assert.ok(result.includes('init_all_user_vars'));
      });

      it('должен включать обработку ошибок', () => {
        const result = generateVoice(validParamsFull);

        assert.ok(result.includes('try'));
        assert.ok(result.includes('except Exception'));
        assert.ok(result.includes('logging.error'));
      });

      it('должен проверять наличие voice_url', () => {
        const result = generateVoice(validParamsFull);

        assert.ok(result.includes('if not voice_url'));
        assert.ok(result.includes('Голосовое сообщение не настроено'));
      });

      it('должен скачивать голосовое сообщение через aiohttp', () => {
        const result = generateVoice(validParamsFull);

        assert.ok(result.includes('session.get(voice_url)'));
        assert.ok(result.includes('voice_data = await resp.read()'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateVoice(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateVoice(invalidParamsMissingField);
        });
      });

      it('должен отклонять string вместо boolean', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
          disableNotification: 'true',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять string вместо number для mediaDuration', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
          mediaDuration: '30',
        });

        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен использовать пустую строку для voiceUrl по умолчанию', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.voiceUrl, '');
        }
      });

      it('должен использовать пустую строку для mediaCaption по умолчанию', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.mediaCaption, '');
        }
      });

      it('должен использовать false для disableNotification по умолчанию', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.disableNotification, false);
        }
      });

      it('должен использовать undefined для mediaDuration по умолчанию', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.mediaDuration, undefined);
        }
      });

      it('должен генерировать разные команды для разных nodeId', () => {
        const result1 = generateVoice({ ...validParamsFull, nodeId: 'node_a' });
        const result2 = generateVoice({ ...validParamsFull, nodeId: 'node_b' });

        assert.ok(result1.includes('voice_node_a'));
        assert.ok(result2.includes('voice_node_b'));
        assert.ok(!result1.includes('voice_node_b'));
      });

      it('должен включать duration только при наличии mediaDuration', () => {
        const result1 = generateVoice({ ...validParamsFull, mediaDuration: 45 });
        const result2 = generateVoice({ ...validParamsFull, mediaDuration: 0 });

        assert.ok(result1.includes('duration = 45'));
        assert.ok(!result2.includes('duration ='));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateVoice(validParamsFull);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateVoice(validParamsFull);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('voiceParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = voiceParamsSchema.safeParse(validParamsFull);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
          disableNotification: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять string вместо number для mediaDuration', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
          mediaDuration: '30',
        });
        assert.ok(!result.success);
      });

      it('должен принимать undefined для mediaDuration', () => {
        const result = voiceParamsSchema.safeParse({
          nodeId: 'test',
          mediaDuration: undefined,
        });
        assert.ok(result.success);
      });

      it('должен использовать значения по умолчанию для всех полей', () => {
        const result = voiceParamsSchema.safeParse({ nodeId: 'test' });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.voiceUrl, '');
          assert.strictEqual(result.data.mediaCaption, '');
          assert.strictEqual(result.data.disableNotification, false);
          assert.strictEqual(result.data.mediaDuration, undefined);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 5 полей', () => {
        const shape = voiceParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 5);
      });

      it('должен использовать ZodString для voiceUrl', () => {
        const shape = voiceParamsSchema.shape;
        assert.strictEqual(shape.voiceUrl.constructor.name, 'ZodString');
      });

      it('должен использовать ZodOptional для mediaDuration', () => {
        const shape = voiceParamsSchema.shape;
        assert.strictEqual(shape.mediaDuration.constructor.name, 'ZodOptional');
      });

      it('должен использовать ZodBoolean для disableNotification', () => {
        const shape = voiceParamsSchema.shape;
        assert.strictEqual(shape.disableNotification.constructor.name, 'ZodBoolean');
      });
    });
  });
});
