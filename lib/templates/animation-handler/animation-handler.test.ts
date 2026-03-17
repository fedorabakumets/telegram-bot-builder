/**
 * @fileoverview Тесты для шаблона animation-handler
 * @module templates/animation-handler/animation-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateAnimationHandler } from './animation-handler.renderer';
import {
  validParamsWithUrl,
  validParamsWithUpload,
  validParamsEmpty,
  validParamsWithIndent,
} from './animation-handler.fixture';
import { animationHandlerParamsSchema } from './animation-handler.schema';

describe('generateAnimationHandler()', () => {
  it('генерирует send_animation для URL', () => {
    const result = generateAnimationHandler(validParamsWithUrl);
    assert.ok(result.includes('bot.send_animation'));
    assert.ok(result.includes('https://example.com/animation.gif'));
  });

  it('генерирует FSInputFile для /uploads/ пути', () => {
    const result = generateAnimationHandler(validParamsWithUpload);
    assert.ok(result.includes('FSInputFile'));
    assert.ok(result.includes('get_upload_file_path'));
  });

  it('возвращает пустую строку без animationUrl', () => {
    const result = generateAnimationHandler(validParamsEmpty);
    assert.ok(!result.includes('send_animation'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateAnimationHandler(validParamsWithIndent);
    assert.ok(result.includes('    await bot.send_animation'));
  });

  it('передаёт caption=text и parse_mode', () => {
    const result = generateAnimationHandler(validParamsWithUrl);
    assert.ok(result.includes('caption=text'));
    assert.ok(result.includes('parse_mode=parse_mode'));
  });
});

describe('animationHandlerParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(animationHandlerParamsSchema.safeParse(validParamsWithUrl).success);
  });

  it('принимает пустой объект', () => {
    assert.ok(animationHandlerParamsSchema.safeParse({}).success);
  });

  it('отклоняет числовой animationUrl', () => {
    assert.ok(!animationHandlerParamsSchema.safeParse({ animationUrl: 123 }).success);
  });
});

describe('Производительность', () => {
  it('generateAnimationHandler: быстрее 10ms', () => {
    const start = Date.now();
    generateAnimationHandler(validParamsWithUrl);
    assert.ok(Date.now() - start < 10);
  });
});
