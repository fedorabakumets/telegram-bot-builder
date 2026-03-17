/**
 * @fileoverview Тесты для шаблона media-send
 * @module templates/media-send/media-send.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMediaSend } from './media-send.renderer';
import {
  validParamsWithImage,
  validParamsWithUploadImage,
  validParamsWithVideo,
  validParamsEmpty,
  validParamsWithIndent,
} from './media-send.fixture';
import { mediaSendParamsSchema } from './media-send.schema';

describe('generateMediaSend()', () => {
  it('генерирует send_photo для imageUrl', () => {
    const result = generateMediaSend(validParamsWithImage);
    assert.ok(result.includes('bot.send_photo'));
    assert.ok(result.includes('https://example.com/photo.jpg'));
  });

  it('генерирует FSInputFile для /uploads/ пути', () => {
    const result = generateMediaSend(validParamsWithUploadImage);
    assert.ok(result.includes('FSInputFile'));
    assert.ok(result.includes('get_upload_file_path'));
  });

  it('генерирует send_video для videoUrl', () => {
    const result = generateMediaSend(validParamsWithVideo);
    assert.ok(result.includes('bot.send_video'));
  });

  it('возвращает пустую строку без медиа', () => {
    const result = generateMediaSend(validParamsEmpty);
    assert.ok(!result.includes('bot.send_'));
  });

  it('передаёт caption=text и parse_mode', () => {
    const result = generateMediaSend(validParamsWithImage);
    assert.ok(result.includes('caption=text'));
    assert.ok(result.includes('parse_mode=parse_mode'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateMediaSend(validParamsWithIndent);
    assert.ok(result.includes('    await bot.send_photo'));
  });
});

describe('mediaSendParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(mediaSendParamsSchema.safeParse(validParamsWithImage).success);
  });

  it('отклоняет отсутствие nodeId', () => {
    assert.ok(!mediaSendParamsSchema.safeParse({ imageUrl: 'u' }).success);
  });
});

describe('Производительность', () => {
  it('generateMediaSend: быстрее 10ms', () => {
    const start = Date.now();
    generateMediaSend(validParamsWithImage);
    assert.ok(Date.now() - start < 10);
  });
});
