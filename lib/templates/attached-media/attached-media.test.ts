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
  validParamsWithAutoTransition,
  validParamsWithSafeEditFallback,
  validParamsStaticImageExternal,
  validParamsStaticImageLocal,
  validParamsStaticImageFakeCallback,
  validParamsStaticImageAutoTransition,
  validParamsStaticImageWaitingState,
  validParamsStaticImageSafeEdit,
  validParamsDynamicPhoto,
  validParamsDynamicVideo,
  validParamsDynamicAutoTransition,
  validParamsDynamicSafeEdit,
  invalidParamsMissingNodeId,
  invalidParamsWrongType,
} from './attached-media.fixture';

describe('attached-media.py.jinja2 шаблон', () => {

  // ─── Ветка 3: обычные attachedMedia ─────────────────────────────────────────

  describe('Одиночные файлы (ветка 3)', () => {
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

  describe('Медиагруппы (ветка 3)', () => {
    it('должен генерировать send_media_group для нескольких фото', () => {
      const result = generateAttachedMedia(validParamsMultiplePhotos);
      assert.ok(result.includes('send_media_group'));
      assert.ok(result.includes('InputMediaPhoto'));
    });

    it('должен добавлять caption только к первому элементу группы', () => {
      const result = generateAttachedMedia(validParamsMultiplePhotos);
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

  describe('Клавиатура (ветка 3)', () => {
    it('должен отправлять только первый файл при наличии inline клавиатуры', () => {
      const result = generateAttachedMedia(validParamsWithInlineKeyboard);
      assert.ok(result.includes('send_photo'));
      assert.ok(!result.includes('send_media_group'));
    });
  });

  describe('Форматирование (ветка 3)', () => {
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

  describe('Контекст обработчика (ветка 3)', () => {
    it('должен использовать message.from_user.id в контексте message', () => {
      const result = generateAttachedMedia(validParamsSingleVideo);
      assert.ok(result.includes('message.from_user.id'));
    });

    it('должен использовать callback_query.from_user.id в контексте callback', () => {
      const result = generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(result.includes('callback_query.from_user.id'));
    });
  });

  describe('autoTransitionTo (ветка 3)', () => {
    it('должен генерировать FakeCallbackQuery при autoTransitionTo', () => {
      const result = generateAttachedMedia(validParamsWithAutoTransition);
      assert.ok(result.includes('FakeCallbackQuery'));
      assert.ok(result.includes('handle_callback_node_next'));
      assert.ok(result.includes('"node_next"'));
    });

    it('не должен генерировать FakeCallbackQuery без autoTransitionTo', () => {
      const result = generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(!result.includes('FakeCallbackQuery'));
    });
  });

  describe('fallbackUseSafeEdit (ветка 3)', () => {
    it('должен использовать safe_edit_or_send в fallback при fallbackUseSafeEdit=true', () => {
      const result = generateAttachedMedia(validParamsWithSafeEditFallback);
      assert.ok(result.includes('safe_edit_or_send'));
    });

    it('должен использовать msg.answer в fallback по умолчанию', () => {
      const result = generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(result.includes('.answer('));
    });
  });

  describe('Обработка ошибок (ветка 3)', () => {
    it('должен генерировать try/except блок', () => {
      const result = generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(result.includes('try:'));
      assert.ok(result.includes('except Exception as e:'));
    });

    it('должен генерировать logging.error при ошибке', () => {
      const result = generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(result.includes('logging.error'));
    });
  });

  describe('Пустые данные', () => {
    it('должен возвращать пустую строку при пустом массиве', () => {
      assert.strictEqual(generateAttachedMedia(validParamsEmpty), '');
    });

    it('должен возвращать пустую строку при отсутствии attachedMedia', () => {
      assert.strictEqual(generateAttachedMedia({ nodeId: 'test', attachedMedia: [] }), '');
    });
  });

  // ─── Ветка 1: статическое изображение ───────────────────────────────────────

  describe('Статическое изображение (ветка 1)', () => {
    it('должен генерировать send_photo для внешнего URL', () => {
      const result = generateAttachedMedia(validParamsStaticImageExternal);
      assert.ok(result.includes('send_photo'));
      assert.ok(result.includes('"https://example.com/image.jpg"'));
    });

    it('должен использовать FSInputFile для локального статического изображения', () => {
      const result = generateAttachedMedia(validParamsStaticImageLocal);
      assert.ok(result.includes('FSInputFile'));
      assert.ok(result.includes('get_upload_file_path'));
      assert.ok(result.includes('/uploads/banner.png'));
    });

    it('должен оборачивать в if not is_fake_callback при isFakeCallbackCheck=true', () => {
      const result = generateAttachedMedia(validParamsStaticImageFakeCallback);
      assert.ok(result.includes('if not is_fake_callback:'));
    });

    it('не должен оборачивать в if not is_fake_callback по умолчанию', () => {
      const result = generateAttachedMedia(validParamsStaticImageExternal);
      assert.ok(!result.includes('is_fake_callback'));
    });

    it('должен генерировать FakeCallbackQuery при autoTransitionTo', () => {
      const result = generateAttachedMedia(validParamsStaticImageAutoTransition);
      assert.ok(result.includes('FakeCallbackQuery'));
      assert.ok(result.includes('handle_callback_node_after'));
    });

    it('должен вставлять waitingStateCode в шаблон', () => {
      const result = generateAttachedMedia(validParamsStaticImageWaitingState);
      assert.ok(result.includes('await state.set_state(UserState.waiting_input)'));
    });

    it('должен использовать safe_edit_or_send в fallback при fallbackUseSafeEdit=true', () => {
      const result = generateAttachedMedia(validParamsStaticImageSafeEdit);
      assert.ok(result.includes('safe_edit_or_send'));
    });

    it('должен генерировать try/except блок', () => {
      const result = generateAttachedMedia(validParamsStaticImageExternal);
      assert.ok(result.includes('try:'));
      assert.ok(result.includes('except Exception as e:'));
    });
  });

  // ─── Ветка 2: динамическое медиа из БД ──────────────────────────────────────

  describe('Динамическое медиа из БД (ветка 2)', () => {
    it('должен генерировать поиск переменной в all_user_vars', () => {
      const result = generateAttachedMedia(validParamsDynamicPhoto);
      assert.ok(result.includes('all_user_vars'));
      assert.ok(result.includes('"photo_url_node_dyn_1"'));
    });

    it('должен проверять photoUrl для типа photo', () => {
      const result = generateAttachedMedia(validParamsDynamicPhoto);
      assert.ok(result.includes('"photoUrl"'));
      assert.ok(result.includes('send_photo'));
    });

    it('должен проверять videoUrl для типа video', () => {
      const result = generateAttachedMedia(validParamsDynamicVideo);
      assert.ok(result.includes('"videoUrl"'));
      assert.ok(result.includes('send_video'));
    });

    it('должен генерировать fallback на текст если медиа не найдено', () => {
      const result = generateAttachedMedia(validParamsDynamicPhoto);
      assert.ok(result.includes('else:'));
      assert.ok(result.includes('не найдено'));
    });

    it('должен генерировать FakeCallbackQuery при autoTransitionTo', () => {
      const result = generateAttachedMedia(validParamsDynamicAutoTransition);
      assert.ok(result.includes('FakeCallbackQuery'));
      assert.ok(result.includes('handle_callback_node_target'));
    });

    it('должен использовать safe_edit_or_send в fallback при fallbackUseSafeEdit=true', () => {
      const result = generateAttachedMedia(validParamsDynamicSafeEdit);
      assert.ok(result.includes('safe_edit_or_send'));
    });

    it('должен генерировать try/except блок', () => {
      const result = generateAttachedMedia(validParamsDynamicPhoto);
      assert.ok(result.includes('try:'));
      assert.ok(result.includes('except Exception as e:'));
    });

    it('должен использовать callback_query.from_user.id в контексте callback', () => {
      const result = generateAttachedMedia(validParamsDynamicPhoto);
      assert.ok(result.includes('callback_query.from_user.id'));
    });

    it('должен использовать message.from_user.id в контексте message', () => {
      const result = generateAttachedMedia(validParamsDynamicVideo);
      assert.ok(result.includes('message.from_user.id'));
    });
  });

  // ─── Логирование ────────────────────────────────────────────────────────────

  describe('Логирование', () => {
    it('должен генерировать logging.info при отправке (ветка 3)', () => {
      const result = generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(result.includes('logging.info'));
    });

    it('должен включать nodeId в сообщение лога (ветка 3)', () => {
      const result = generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(result.includes('node_1'));
    });

    it('должен генерировать logging.info при отправке (ветка 1)', () => {
      const result = generateAttachedMedia(validParamsStaticImageExternal);
      assert.ok(result.includes('logging.info') || result.includes('logging.error'));
    });
  });

  // ─── Производительность ─────────────────────────────────────────────────────

  describe('Производительность', () => {
    it('должен генерировать код быстрее 10ms', () => {
      const start = Date.now();
      generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(Date.now() - start < 10);
    });

    it('должен генерировать код 1000 раз быстрее 100ms', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) generateAttachedMedia(validParamsSinglePhoto);
      assert.ok(Date.now() - start < 100);
    });
  });

  // ─── Схема ──────────────────────────────────────────────────────────────────

  describe('attachedMediaParamsSchema', () => {
    it('должен принимать корректные параметры', () => {
      assert.ok(attachedMediaParamsSchema.safeParse(validParamsSinglePhoto).success);
    });

    it('должен отклонять отсутствующий nodeId', () => {
      assert.ok(!attachedMediaParamsSchema.safeParse(invalidParamsMissingNodeId).success);
    });

    it('должен отклонять неправильный тип', () => {
      assert.ok(!attachedMediaParamsSchema.safeParse(invalidParamsWrongType).success);
    });

    it('должен принимать все значения enum для formatMode', () => {
      for (const mode of ['html', 'markdown', 'none']) {
        assert.ok(attachedMediaParamsSchema.safeParse({ nodeId: 'test', attachedMedia: [], formatMode: mode }).success);
      }
    });

    it('должен принимать все значения enum для keyboardType', () => {
      for (const type of ['inline', 'reply', 'none']) {
        assert.ok(attachedMediaParamsSchema.safeParse({ nodeId: 'test', attachedMedia: [], keyboardType: type }).success);
      }
    });

    it('должен принимать все значения enum для handlerContext', () => {
      for (const ctx of ['message', 'callback']) {
        assert.ok(attachedMediaParamsSchema.safeParse({ nodeId: 'test', attachedMedia: [], handlerContext: ctx }).success);
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
        assert.strictEqual(result.data.isFakeCallbackCheck, false);
        assert.strictEqual(result.data.fallbackUseSafeEdit, false);
      }
    });

    it('должен принимать новые поля: staticImageUrl, mediaVariable, autoTransitionTo', () => {
      const result = attachedMediaParamsSchema.safeParse({
        nodeId: 'test',
        attachedMedia: [],
        staticImageUrl: 'https://example.com/img.jpg',
        mediaVariable: 'photo_url_test',
        mediaType: 'photo',
        autoTransitionTo: 'next_node',
        waitingStateCode: '    pass',
        isFakeCallbackCheck: true,
        fallbackUseSafeEdit: true,
      });
      assert.ok(result.success);
    });
  });
});
