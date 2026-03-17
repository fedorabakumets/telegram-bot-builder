/**
 * @fileoverview Тесты для шаблона attached-media-vars
 * @module templates/attached-media-vars/attached-media-vars.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateAttachedMediaVars } from './attached-media-vars.renderer';
import {
  validParamsWithImage,
  validParamsWithVideo,
  validParamsEmpty,
  validParamsWithIndent,
} from './attached-media-vars.fixture';
import { attachedMediaVarsParamsSchema } from './attached-media-vars.schema';

describe('generateAttachedMediaVars()', () => {
  it('генерирует установку imageUrl переменной', () => {
    const result = generateAttachedMediaVars(validParamsWithImage);
    assert.ok(result.includes('imageUrlVar_node_img'));
    assert.ok(result.includes('https://example.com/photo.jpg'));
  });

  it('генерирует установку videoUrl переменной', () => {
    const result = generateAttachedMediaVars(validParamsWithVideo);
    assert.ok(result.includes('videoUrlVar_node_vid'));
    assert.ok(result.includes('https://example.com/video.mp4'));
  });

  it('возвращает пустую строку без attachedMedia', () => {
    const result = generateAttachedMediaVars(validParamsEmpty);
    assert.ok(!result.includes('user_data[user_id]'));
  });

  it('генерирует logging.info с nodeId', () => {
    const result = generateAttachedMediaVars(validParamsWithImage);
    assert.ok(result.includes('node_img'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateAttachedMediaVars(validParamsWithIndent);
    assert.ok(result.includes('    user_id = message.from_user.id'));
  });
});

describe('attachedMediaVarsParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(attachedMediaVarsParamsSchema.safeParse(validParamsWithImage).success);
  });

  it('использует пустой массив по умолчанию для attachedMedia', () => {
    const result = attachedMediaVarsParamsSchema.safeParse({ nodeId: 'n' });
    assert.ok(result.success);
    if (result.success) assert.deepStrictEqual(result.data.attachedMedia, []);
  });

  it('отклоняет отсутствие nodeId', () => {
    assert.ok(!attachedMediaVarsParamsSchema.safeParse({ attachedMedia: [] }).success);
  });
});

describe('Производительность', () => {
  it('generateAttachedMediaVars: быстрее 10ms', () => {
    const start = Date.now();
    generateAttachedMediaVars(validParamsWithImage);
    assert.ok(Date.now() - start < 10);
  });
});
