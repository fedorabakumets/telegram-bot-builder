/**
 * @fileoverview Тесты для шаблона media-save-vars
 * @module templates/media-save-vars/media-save-vars.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMediaSaveVars } from './media-save-vars.renderer';
import {
  validParamsWithImage,
  validParamsWithVideo,
  validParamsEmpty,
  validParamsWithIndent,
} from './media-save-vars.fixture';
import { mediaSaveVarsParamsSchema } from './media-save-vars.schema';

describe('generateMediaSaveVars()', () => {
  it('генерирует сохранение imageUrl', () => {
    const result = generateMediaSaveVars(validParamsWithImage);
    assert.ok(result.includes('image_url_node_img'));
    assert.ok(result.includes('https://example.com/photo.jpg'));
  });

  it('генерирует update_user_data_in_db', () => {
    const result = generateMediaSaveVars(validParamsWithImage);
    assert.ok(result.includes('await update_user_data_in_db'));
  });

  it('генерирует сохранение videoUrl', () => {
    const result = generateMediaSaveVars(validParamsWithVideo);
    assert.ok(result.includes('video_url_node_vid'));
  });

  it('возвращает пустую строку без медиа', () => {
    const result = generateMediaSaveVars(validParamsEmpty);
    assert.ok(!result.includes('update_user_data_in_db'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateMediaSaveVars(validParamsWithIndent);
    assert.ok(result.includes('    # Сохраняем imageUrl'));
  });
});

describe('mediaSaveVarsParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(mediaSaveVarsParamsSchema.safeParse(validParamsWithImage).success);
  });

  it('отклоняет отсутствие nodeId', () => {
    assert.ok(!mediaSaveVarsParamsSchema.safeParse({ imageUrl: 'u' }).success);
  });
});

describe('Производительность', () => {
  it('generateMediaSaveVars: быстрее 10ms', () => {
    const start = Date.now();
    generateMediaSaveVars(validParamsWithImage);
    assert.ok(Date.now() - start < 10);
  });
});
