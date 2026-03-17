/**
 * @fileoverview Тесты для шаблона отправки прикреплённых медиафайлов
 * @module templates/attached-media/attached-media.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateAttachedMedia } from './attached-media.renderer';
import { attachedMediaParamsSchema } from './attached-media.schema';
import {
  validParamsSinglePhoto,
  validParamsSingleVideo,
  validParamsSingleDocument,
  validParamsSingleAudio,
  validParamsMultiplePhotos,
  validParamsMixedMedia,
  validParamsWithInlineKeyboard,
  validParamsMarkdown,
  validParamsEmpty,
  invalidParamsMissingNodeId,
  invalidParamsWrongType,
} from './attached-media.fixture';

describe('attached-media.py.jinja2 шаблон', () => {
  describe('generateAttachedMedia()', () => {
    describe('Одиночные файлы', () => {
      it('должен генерировать отправку одного фото', () => {
        const result = generateAttachedMedia(validParamsSinglePhoto);

        assert.ok(result.includes('send_photo'));
        assert.ok(result.includes('/uploads/photo.jpg'));
        assert.ok(result.includes('FSInputFile'));
      });

      it('должен генерировать отправку одного видео', () => {
        const result = generateAttachedMedia(validParamsSingleVideo);

        assert.ok(result.includes('send_video'));
        assert.ok(result.includes('https://example.com/video.mp4'));
      });

      it('должен генерировать отправку одного документа', () => {
        const result = generateAttachedMedia(validParamsSingleDocument);

        assert.ok(result.includes('send_document'));
        assert.ok(result.includes('/uploads/file.pdf'));
      });

      it('должен генерировать отправку одного аудио', () => {
        const result = generateAttachedMedia(validParamsSingleAudio);

        assert.ok(result.includes('send_audio'));
        assert.ok(result.includes('/uploads/audio.mp3'));
      });

      it('должен использовать FSInputFile для локальных файлов', () => {
        const result = generateAttachedMedia(validParamsSinglePhoto);

        assert.ok(result.includes('FSInputFile'));
        assert.ok(result.includes('get_upload_file_path'));
      });

      it('должен использовать URL напрямую для внешних файлов', () => {
        const result = generateAttachedMedia(validParamsSingleVideo);

        assert.ok(!result.includes('FSInputFile'));
        assert.ok(result.includes('"https://example.com/video.mp4"'));
      });
    });

    describe('Медиагруппы', () => {
      it('должен генерировать send_media_group для нескольких фото', () => {
        const result = generateAttachedMedia(validParamsMultiplePhotos);

        assert.ok(result.includes('send_media_group'));
        assert.ok(result.includes('InputMediaPhoto'));
      });

      it('должен добавлять caption только к первому элементу группы', () => {
        const result = generateAttachedMedia(validParamsMultiplePhotos);

        // caption должен быть только у первого элемента
        const captionMatches = result.match(/caption=processed_caption/g);
        assert.strictEqual(captionMatches?.length, 1);
      });

      it('должен разделять фото и документы на разные группы', () => {
        const result = generateAttachedMedia(validParamsMixedMedia);

        assert.ok(result.includes('media_group_'));
        assert.ok(result.includes('document_group_'));
      });

      it('должен отправлять клавиатуру отдельным сообщением при медиагруппе', () => {
        const result = generateAttachedMedia(validParamsMultiplePhotos);

        assert.ok(result.includes('send_message'));
        assert.ok(result.includes('reply_markup=keyboard'));
      });
    });

    describe('Клавиатура', () => {
      it('должен отправлять только первый файл при наличии inline клавиатуры', () => {
        const result = generateAttachedMedia(validParamsWithInlineKeyboard);

        // При inline клавиатуре — только один файл, значит send_photo (не send_media_group)
        assert.ok(result.includes('send_photo'));
        assert.ok(!result.includes('send_media_group'));
      });
    });

    describe('Форматирование', () => {
      it('должен добавлять parse_mode HTML', () => {
        const result = generateAttachedMedia(validParamsSingleVideo);

        assert.ok(result.includes('parse_mode="HTML"'));
      });

      it('должен добавлять parse_mode Markdown', () => {
        const result = generateAttachedMedia(validParamsMarkdown);

        assert.ok(result.includes('parse_mode="Markdown"'));
      });

      it('не должен добавлять parse_mode при formatMode none', () => {
        const result = generateAttachedMedia(validParamsSinglePhoto);

        assert.ok(!result.includes('parse_mode'));
      });
    });

    describe('Контекст обработчика', () => {
      it('должен использовать message.from_user.id в контексте message', () => {
        const result = generateAttachedMedia(validParamsSingleVideo);

        assert.ok(result.includes('message.from_user.id'));
      });

      it('должен использовать callback_query.from_user.id в контексте callback', () => {
        const result = generateAttachedMedia(validParamsSinglePhoto);

        assert.ok(result.includes('callback_query.from_user.id'));
      });
    });

    describe('Обработка ошибок', () => {
      it('должен генерировать try/except блок', () => {
        const result = generateAttachedMedia(validParamsSinglePhoto);

        assert.ok(result.includes('try:'));
        assert.ok(result.includes('except Exception as e:'));
      });

      it('должен генерировать fallback на answer при ошибке', () => {
        const result = generateAttachedMedia(validParamsSinglePhoto);

        assert.ok(result.includes('logging.error'));
        assert.ok(result.includes('.answer('));
      });
    });

    describe('Пустые данные', () => {
      it('должен возвращать пустую строку при пустом массиве', () => {
        const result = generateAttachedMedia(validParamsEmpty);

        assert.strictEqual(result, '');
      });

      it('должен возвращать пустую строку при отсутствии attachedMedia', () => {
        const result = generateAttachedMedia({ nodeId: 'test', attachedMedia: [] });

        assert.strictEqual(result, '');
      });
    });

    describe('Логирование', () => {
      it('должен генерировать logging.info при отправке', () => {
        const result = generateAttachedMedia(validParamsSinglePhoto);

        assert.ok(result.includes('logging.info'));
      });

      it('должен включать nodeId в сообщение лога', () => {
        const result = generateAttachedMedia(validParamsSinglePhoto);

        assert.ok(result.includes('node_1'));
      });
    });

    describe('Производительность', () => {
      it('должен генерировать код быстрее 10ms', () => {
        const start = Date.now();
        generateAttachedMedia(validParamsSinglePhoto);
        const duration = Date.now() - start;

        assert.ok(duration < 10, `Генерация заняла ${duration}ms (ожидалось < 10ms)`);
      });

      it('должен генерировать код 1000 раз быстрее 100ms', () => {
        const start = Date.now();
        for (let i = 0; i < 1000; i++) {
          generateAttachedMedia(validParamsSinglePhoto);
        }
        const duration = Date.now() - start;

        assert.ok(duration < 100, `1000 генераций заняли ${duration}ms (ожидалось < 100ms)`);
      });
    });
  });

  describe('attachedMediaParamsSchema', () => {
    describe('Валидация типов', () => {
      it('должен принимать корректные параметры', () => {
        const result = attachedMediaParamsSchema.safeParse(validParamsSinglePhoto);
        assert.ok(result.success);
      });

      it('должен отклонять отсутствующий nodeId', () => {
        const result = attachedMediaParamsSchema.safeParse(invalidParamsMissingNodeId);
        assert.ok(!result.success);
      });

      it('должен отклонять неправильный тип', () => {
        const result = attachedMediaParamsSchema.safeParse(invalidParamsWrongType);
        assert.ok(!result.success);
      });

      it('должен принимать все значения enum для formatMode', () => {
        for (const mode of ['html', 'markdown', 'none']) {
          const result = attachedMediaParamsSchema.safeParse({ nodeId: 'test', attachedMedia: [], formatMode: mode });
          assert.ok(result.success, `formatMode "${mode}" должен быть валидным`);
        }
      });

      it('должен принимать все значения enum для keyboardType', () => {
        for (const type of ['inline', 'reply', 'none']) {
          const result = attachedMediaParamsSchema.safeParse({ nodeId: 'test', attachedMedia: [], keyboardType: type });
          assert.ok(result.success, `keyboardType "${type}" должен быть валидным`);
        }
      });

      it('должен принимать все значения enum для handlerContext', () => {
        for (const ctx of ['message', 'callback']) {
          const result = attachedMediaParamsSchema.safeParse({ nodeId: 'test', attachedMedia: [], handlerContext: ctx });
          assert.ok(result.success, `handlerContext "${ctx}" должен быть валидным`);
        }
      });

      it('должен применять default значения', () => {
        const result = attachedMediaParamsSchema.safeParse({ nodeId: 'test' });
        assert.ok(result.success);
        if (result.success) {
          assert.strictEqual(result.data.formatMode, 'none');
          assert.strictEqual(result.data.keyboardType, 'none');
          assert.strictEqual(result.data.handlerContext, 'callback');
          assert.deepStrictEqual(result.data.attachedMedia, []);
        }
      });
    });
  });
});
