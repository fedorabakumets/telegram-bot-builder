/**
 * @fileoverview Тесты для шаблона медиа-ноды
 * @module templates/media-node/media-node.test
 */

import { describe, it, expect } from 'vitest';
import { generateMediaNode } from './media-node.renderer';
import { mediaNodeParamsSchema } from './media-node.schema';
import {
  fixtureOnePhoto,
  fixtureOneVideo,
  fixtureOneAudio,
  fixtureOneDocument,
  fixtureMixedGroup,
  fixtureWithAutoTransition,
  fixtureUploadPaths,
  fixtureEmpty,
} from './media-node.fixture';

describe('media-node.py.jinja2 шаблон', () => {

  describe('Одиночные файлы', () => {
    it('должен использовать answer_photo для .jpg файла', () => {
      const result = generateMediaNode(fixtureOnePhoto);
      expect(result).toContain('answer_photo');
    });

    it('должен использовать answer_video для .mp4 файла', () => {
      const result = generateMediaNode(fixtureOneVideo);
      expect(result).toContain('answer_video');
    });

    it('должен использовать answer_audio для .mp3 файла', () => {
      const result = generateMediaNode(fixtureOneAudio);
      expect(result).toContain('answer_audio');
    });

    it('должен использовать answer_document для .pdf файла', () => {
      const result = generateMediaNode(fixtureOneDocument);
      expect(result).toContain('answer_document');
    });

    it('должен использовать answer_photo для .png файла', () => {
      const result = generateMediaNode({ nodeId: 'n1', attachedMedia: ['https://example.com/img.png'] });
      expect(result).toContain('answer_photo');
    });

    it('должен использовать answer_photo для .webp файла', () => {
      const result = generateMediaNode({ nodeId: 'n1', attachedMedia: ['https://example.com/img.webp'] });
      expect(result).toContain('answer_photo');
    });

    it('должен использовать answer_audio для .wav файла', () => {
      const result = generateMediaNode({ nodeId: 'n1', attachedMedia: ['https://example.com/sound.wav'] });
      expect(result).toContain('answer_audio');
    });

    it('должен использовать answer_audio для .ogg файла', () => {
      const result = generateMediaNode({ nodeId: 'n1', attachedMedia: ['https://example.com/sound.ogg'] });
      expect(result).toContain('answer_audio');
    });

    it('должен НЕ использовать answer_media_group при одном файле', () => {
      const result = generateMediaNode(fixtureOnePhoto);
      expect(result).not.toContain('answer_media_group');
    });
  });

  describe('Медиагруппа', () => {
    it('должен использовать answer_media_group при нескольких файлах', () => {
      const result = generateMediaNode(fixtureMixedGroup);
      expect(result).toContain('answer_media_group');
    });

    it('должен использовать InputMediaPhoto в медиагруппе для фото', () => {
      const result = generateMediaNode(fixtureMixedGroup);
      expect(result).toContain('InputMediaPhoto');
    });

    it('должен использовать InputMediaVideo в медиагруппе для видео', () => {
      const result = generateMediaNode(fixtureMixedGroup);
      expect(result).toContain('InputMediaVideo');
    });

    it('должен использовать InputMediaAudio в медиагруппе для аудио', () => {
      const result = generateMediaNode(fixtureMixedGroup);
      expect(result).toContain('InputMediaAudio');
    });

    it('должен использовать InputMediaDocument в медиагруппе для документа', () => {
      const result = generateMediaNode({
        nodeId: 'n1',
        attachedMedia: ['https://example.com/a.pdf', 'https://example.com/b.zip'],
      });
      expect(result).toContain('InputMediaDocument');
    });

    it('должен генерировать медиагруппу из 6+ файлов', () => {
      const result = generateMediaNode({
        nodeId: 'n1',
        attachedMedia: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
          'https://example.com/6.jpg',
        ],
      });
      expect(result).toContain('answer_media_group');
      expect(result.match(/InputMediaPhoto/g)?.length).toBe(6);
    });

    it('должен генерировать смешанную медиагруппу (фото + видео)', () => {
      const result = generateMediaNode({
        nodeId: 'n1',
        attachedMedia: ['https://example.com/photo.jpg', 'https://example.com/video.mp4'],
      });
      expect(result).toContain('InputMediaPhoto');
      expect(result).toContain('InputMediaVideo');
      expect(result).toContain('answer_media_group');
    });
  });

  describe('FSInputFile для /uploads/ путей', () => {
    it('должен использовать FSInputFile для /uploads/ пути', () => {
      const result = generateMediaNode(fixtureUploadPaths);
      expect(result).toContain('FSInputFile');
    });

    it('должен использовать get_upload_file_path для /uploads/ пути', () => {
      const result = generateMediaNode(fixtureUploadPaths);
      expect(result).toContain('get_upload_file_path');
    });

    it('должен использовать FSInputFile в медиагруппе для /uploads/ путей', () => {
      const result = generateMediaNode(fixtureUploadPaths);
      expect(result).toContain('answer_media_group');
      expect(result).toContain('FSInputFile');
    });

    it('должен использовать FSInputFile для одиночного /uploads/ фото', () => {
      const result = generateMediaNode({ nodeId: 'n1', attachedMedia: ['/uploads/photo.jpg'] });
      expect(result).toContain('FSInputFile');
      expect(result).toContain('answer_photo');
    });
  });

  describe('Автопереход', () => {
    it('должен генерировать FakeCallbackQuery при enableAutoTransition', () => {
      const result = generateMediaNode(fixtureWithAutoTransition);
      expect(result).toContain('FakeCallbackQuery');
    });

    it('должен содержать ID целевого узла при автопереходе', () => {
      const result = generateMediaNode(fixtureWithAutoTransition);
      expect(result).toContain('next_node_1');
    });

    it('должен НЕ генерировать FakeCallbackQuery без автоперехода', () => {
      const result = generateMediaNode(fixtureOnePhoto);
      expect(result).not.toContain('FakeCallbackQuery');
    });

    it('должен НЕ генерировать автопереход если enableAutoTransition=false', () => {
      const result = generateMediaNode({ ...fixtureOnePhoto, enableAutoTransition: false });
      expect(result).not.toContain('FakeCallbackQuery');
    });
  });

  describe('Структура обработчика', () => {
    it('должен содержать nodeId в имени обработчика', () => {
      const result = generateMediaNode(fixtureOnePhoto);
      expect(result).toContain('handle_callback_media_photo_1');
    });

    it('должен содержать callback_query декоратор с nodeId', () => {
      const result = generateMediaNode(fixtureOnePhoto);
      expect(result).toContain('@dp.callback_query');
      expect(result).toContain('media_photo_1');
    });

    it('должен содержать logging.info', () => {
      const result = generateMediaNode(fixtureOnePhoto);
      expect(result).toContain('logging.info');
    });

    it('должен генерировать разные обработчики для разных nodeId', () => {
      const r1 = generateMediaNode({ nodeId: 'node_a', attachedMedia: [] });
      const r2 = generateMediaNode({ nodeId: 'node_b', attachedMedia: [] });
      expect(r1).toContain('handle_callback_node_a');
      expect(r2).toContain('handle_callback_node_b');
      expect(r1).not.toContain('handle_callback_node_b');
    });

    it('должен применять safe_name фильтр к nodeId с дефисами', () => {
      const result = generateMediaNode({ nodeId: 'my-node-id', attachedMedia: [] });
      expect(result).toContain('handle_callback_my_node_id');
    });
  });

  describe('Пустой массив медиа', () => {
    it('не должен генерировать answer_photo при пустом attachedMedia', () => {
      const result = generateMediaNode(fixtureEmpty);
      expect(result).not.toContain('answer_photo');
    });

    it('не должен генерировать answer_media_group при пустом attachedMedia', () => {
      const result = generateMediaNode(fixtureEmpty);
      expect(result).not.toContain('answer_media_group');
    });

    it('должен генерировать pass при пустом attachedMedia', () => {
      const result = generateMediaNode(fixtureEmpty);
      expect(result).toContain('pass');
    });
  });

  describe('Валидация схемы', () => {
    it('должен принимать валидные параметры', () => {
      const result = mediaNodeParamsSchema.safeParse(fixtureOnePhoto);
      expect(result.success).toBe(true);
    });

    it('должен отклонять отсутствующий nodeId', () => {
      const result = mediaNodeParamsSchema.safeParse({ attachedMedia: [] });
      expect(result.success).toBe(false);
    });

    it('должен отклонять неверный тип attachedMedia', () => {
      const result = mediaNodeParamsSchema.safeParse({ nodeId: 'n1', attachedMedia: 'not-array' });
      expect(result.success).toBe(false);
    });

    it('должен отклонять nodeId не-строку', () => {
      const result = mediaNodeParamsSchema.safeParse({ nodeId: 123, attachedMedia: [] });
      expect(result.success).toBe(false);
    });

    it('должен принимать пустой массив attachedMedia', () => {
      const result = mediaNodeParamsSchema.safeParse({ nodeId: 'n1', attachedMedia: [] });
      expect(result.success).toBe(true);
    });

    it('должен бросать исключение при невалидных данных через generateMediaNode', () => {
      expect(() => {
        // @ts-expect-error — намеренно передаём неверные данные
        generateMediaNode({ nodeId: 123, attachedMedia: [] });
      }).toThrow();
    });
  });
});
