/**
 * @fileoverview Тесты для шаблона стикера
 * @module templates/sticker/sticker.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSticker } from './sticker.renderer';
import {
  validParamsFileId,
  validParamsUrl,
  validParamsSetName,
  validParamsSilent,
  invalidParamsWrongType,
  invalidParamsMissingField,
} from './sticker.fixture';
import { stickerParamsSchema } from './sticker.schema';

describe('sticker.py.jinja2 шаблон', () => {
  describe('generateSticker()', () => {
    describe('Валидные данные', () => {
      it('должен генерировать шаг стикера по file_id', () => {
        const result = generateSticker(validParamsFileId);

        assert.ok(result.includes('handle_callback_sticker_1'));
        assert.ok(result.includes('@dp.callback_query'));
        assert.ok(result.includes('bot.send_sticker'));
        assert.ok(result.includes('CAACAgQAAxkBAAIC'));
        assert.ok(!result.includes('Command('));
        assert.ok(!result.includes('caption'));
      });

      it('должен генерировать шаг стикера по URL', () => {
        const result = generateSticker(validParamsUrl);

        assert.ok(result.includes('handle_callback_sticker_2'));
        assert.ok(result.includes('sticker_url'));
        assert.ok(result.includes('aiohttp.ClientSession'));
        assert.ok(result.includes('bot.send_sticker'));
      });

      it('должен генерировать шаг стикера из набора', () => {
        const result = generateSticker(validParamsSetName);

        assert.ok(result.includes('handle_callback_sticker_3'));
        assert.ok(result.includes('MyStickerPack'));
        assert.ok(result.includes('bot.send_sticker'));
      });

      it('должен генерировать обработчик с disable_notification', () => {
        const result = generateSticker(validParamsSilent);

        assert.ok(result.includes('disable_notification=True'));
      });

      it('не подставляет подпись: у send_sticker её нет', () => {
        const result = generateSticker(validParamsFileId);

        assert.ok(!result.includes('caption'));
        assert.ok(!result.includes('replace_variables_in_text'));
      });

      it('должен включать обработку ошибок', () => {
        const result = generateSticker(validParamsFileId);

        assert.ok(result.includes('try'));
        assert.ok(result.includes('except Exception'));
        assert.ok(result.includes('logging.error'));
      });

      it('игнорирует mediaCaption и не передаёт caption', () => {
        const result = generateSticker(validParamsFileId);

        assert.ok(result.includes('bot.send_sticker'));
        assert.ok(!result.includes('caption'));
      });

      it('вызывает следующий блок при автопереходе', () => {
        const result = generateSticker({
          ...validParamsFileId,
          autoTransitionTo: 'next-node',
        });

        assert.ok(result.includes('handle_callback_next_node'));
      });

      it('считает file_id в stickerUrl идентификатором файла', () => {
        const result = generateSticker({
          nodeId: 'sticker_file',
          stickerUrl: 'CAACAgQAAxkBAAIE',
          stickerFileId: '',
        });

        assert.ok(result.includes('CAACAgQAAxkBAAIE'));
        assert.ok(!result.includes('aiohttp.ClientSession'));
        assert.ok(!result.includes('Command('));
      });

      it('должен генерировать сообщение об ошибке при отсутствии стикера', () => {
        const result = generateSticker({
          nodeId: 'sticker_5',
          stickerUrl: '',
          stickerFileId: '',
          stickerSetName: '',
          mediaCaption: '',
          disableNotification: false,
        });

        assert.ok(result.includes('Стикер не настроен'));
      });
    });

    describe('Невалидные данные', () => {
      it('должен отклонять параметры с неправильным типом', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неправильный тип
          generateSticker(invalidParamsWrongType);
        });
      });

      it('должен отклонять параметры с отсутствующим полем', () => {
        assert.throws(() => {
          // @ts-expect-error — намеренно передаём неполные параметры
          generateSticker(invalidParamsMissingField);
        });
      });

      it('должен отклонять string вместо boolean', () => {
        const result = stickerParamsSchema.safeParse({
          nodeId: 'test',
          disableNotification: 'true',
        });

        assert.ok(!result.success);
      });

      it('должен отклонять число вместо string', () => {
        const result = stickerParamsSchema.safeParse({
          nodeId: 123,
        });

        assert.ok(!result.success);
      });
    });

    describe('Граничные случаи', () => {
      it('должен принимать undefined для stickerUrl', () => {
        const result = stickerParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.stickerUrl, undefined);
        }
      });

      it('должен принимать undefined для mediaCaption', () => {
        const result = stickerParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.mediaCaption, undefined);
        }
      });

      it('должен принимать undefined для disableNotification', () => {
        const result = stickerParamsSchema.safeParse({
          nodeId: 'test',
        });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.disableNotification, undefined);
        }
      });

      it('должен генерировать разные callback для разных nodeId', () => {
        const result1 = generateSticker({ ...validParamsFileId, nodeId: 'node_a' });
        const result2 = generateSticker({ ...validParamsFileId, nodeId: 'node_b' });

        assert.ok(result1.includes('handle_callback_node_a'));
        assert.ok(result2.includes('handle_callback_node_b'));
        assert.ok(!result1.includes('handle_callback_node_b'));
        assert.ok(!result1.includes('Command('));
      });

      it('должен включать disable_notification только при disableNotification=true', () => {
        const result1 = generateSticker({ ...validParamsFileId, disableNotification: true });
        const result2 = generateSticker({ ...validParamsFileId, disableNotification: undefined });

        assert.ok(result1.includes('disable_notification=True'));
        assert.ok(!result2.includes('disable_notification=True'));
      });

      it('не включает caption ни с mediaCaption, ни без него', () => {
        const result1 = generateSticker({ ...validParamsFileId, mediaCaption: 'Test' });
        const result2 = generateSticker({ ...validParamsFileId, mediaCaption: undefined });

        assert.ok(!result1.includes('caption'));
        assert.ok(!result2.includes('caption'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateSticker(validParamsFileId);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateSticker(validParamsFileId);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('stickerParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать все поля корректных типов', () => {
        const result = stickerParamsSchema.safeParse(validParamsFileId);
        assert.ok(result.success);
      });

      it('должен отклонять string вместо boolean', () => {
        const result = stickerParamsSchema.safeParse({
          nodeId: 'test',
          disableNotification: 'true',
        });
        assert.ok(!result.success);
      });

      it('должен отклонять число вместо string для nodeId', () => {
        const result = stickerParamsSchema.safeParse({
          nodeId: 123,
        });
        assert.ok(!result.success);
      });

      it('должен принимать пустые строки для опциональных полей', () => {
        const result = stickerParamsSchema.safeParse({
          nodeId: 'test',
          stickerUrl: '',
          stickerFileId: '',
          stickerSetName: '',
          mediaCaption: '',
        });
        assert.ok(result.success);
      });

      it('должен принимать undefined для всех опциональных полей', () => {
        const result = stickerParamsSchema.safeParse({ nodeId: 'test' });

        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.stickerUrl, undefined);
          assert.strictEqual(result.data.stickerFileId, undefined);
          assert.strictEqual(result.data.stickerSetName, undefined);
          assert.strictEqual(result.data.mediaCaption, undefined);
          assert.strictEqual(result.data.disableNotification, undefined);
        }
      });
    });

    describe('Структура схемы', () => {
      it('должен иметь 8 полей', () => {
        const shape = stickerParamsSchema.shape;
        const fields = Object.keys(shape);

        assert.strictEqual(fields.length, 8);
      });

      it('должен использовать ZodOptional для stickerUrl', () => {
        const shape = stickerParamsSchema.shape;
        assert.ok(shape.stickerUrl.isOptional());
      });

      it('должен использовать ZodOptional для disableNotification', () => {
        const shape = stickerParamsSchema.shape;
        assert.ok(shape.disableNotification.isOptional());
      });

      it('должен использовать .optional() для всех опциональных полей', () => {
        const shape = stickerParamsSchema.shape;

        assert.ok(shape.stickerUrl.isOptional());
        assert.ok(shape.stickerFileId.isOptional());
        assert.ok(shape.stickerSetName.isOptional());
        assert.ok(shape.mediaCaption.isOptional());
        assert.ok(shape.disableNotification.isOptional());
        assert.ok(shape.autoTransitionTo.isOptional());
        assert.ok(shape.isLocalStickerUrl.isOptional());
      });
    });
  });
});
