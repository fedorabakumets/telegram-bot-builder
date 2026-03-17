/**
 * @fileoverview Тесты для шаблона media-path-resolve
 * @module templates/media-path-resolve/media-path-resolve.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMediaPathResolve } from './media-path-resolve.renderer';
import {
  validParamsPhoto,
  validParamsVideo,
  validParamsAudio,
  validParamsDocument,
  validParamsWithIndent,
} from './media-path-resolve.fixture';
import { mediaPathResolveParamsSchema } from './media-path-resolve.schema';

describe('generateMediaPathResolve()', () => {
  it('генерирует проверку startswith /uploads/', () => {
    const result = generateMediaPathResolve(validParamsPhoto);
    assert.ok(result.includes("startswith('/uploads/')"));
  });

  it('генерирует get_upload_file_path для фото', () => {
    const result = generateMediaPathResolve(validParamsPhoto);
    assert.ok(result.includes('photo_path = get_upload_file_path'));
    assert.ok(result.includes('photo_url = FSInputFile(photo_path)'));
  });

  it('генерирует get_upload_file_path для видео', () => {
    const result = generateMediaPathResolve(validParamsVideo);
    assert.ok(result.includes('video_path = get_upload_file_path'));
    assert.ok(result.includes('video_url = FSInputFile(video_path)'));
  });

  it('генерирует get_upload_file_path для аудио', () => {
    const result = generateMediaPathResolve(validParamsAudio);
    assert.ok(result.includes('audio_path = get_upload_file_path'));
  });

  it('генерирует get_upload_file_path для документа', () => {
    const result = generateMediaPathResolve(validParamsDocument);
    assert.ok(result.includes('document_path = get_upload_file_path'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateMediaPathResolve(validParamsWithIndent);
    assert.ok(result.includes("    if photo_url.startswith('/uploads/')"));
  });
});

describe('mediaPathResolveParamsSchema', () => {
  it('принимает все типы медиа', () => {
    for (const t of ['photo', 'video', 'audio', 'document']) {
      assert.ok(mediaPathResolveParamsSchema.safeParse({ mediaType: t, urlVar: 'u' }).success);
    }
  });

  it('отклоняет неверный тип медиа', () => {
    assert.ok(!mediaPathResolveParamsSchema.safeParse({ mediaType: 'gif', urlVar: 'u' }).success);
  });

  it('отклоняет отсутствие urlVar', () => {
    assert.ok(!mediaPathResolveParamsSchema.safeParse({ mediaType: 'photo' }).success);
  });
});

describe('Производительность', () => {
  it('generateMediaPathResolve: быстрее 10ms', () => {
    const start = Date.now();
    generateMediaPathResolve(validParamsPhoto);
    assert.ok(Date.now() - start < 10);
  });
});
