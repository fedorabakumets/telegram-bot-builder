/**
 * @fileoverview Тесты для шаблона parse-mode
 * @module templates/parse-mode/parse-mode.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateParseMode } from './parse-mode.renderer';
import {
  validParamsMarkdown,
  validParamsHtml,
  validParamsNone,
  validParamsMarkdownFlag,
  validParamsWithIndent,
} from './parse-mode.fixture';
import { parseModeParamsSchema } from './parse-mode.schema';

describe('generateParseMode()', () => {
  it('генерирует ParseMode.MARKDOWN для markdown', () => {
    const result = generateParseMode(validParamsMarkdown);
    assert.ok(result.includes('parse_mode = ParseMode.MARKDOWN'));
  });

  it('генерирует ParseMode.HTML для html', () => {
    const result = generateParseMode(validParamsHtml);
    assert.ok(result.includes('parse_mode = ParseMode.HTML'));
  });

  it('генерирует parse_mode = None без форматирования', () => {
    const result = generateParseMode(validParamsNone);
    assert.ok(result.includes('parse_mode = None'));
  });

  it('генерирует ParseMode.MARKDOWN для флага markdown=true', () => {
    const result = generateParseMode(validParamsMarkdownFlag);
    assert.ok(result.includes('parse_mode = ParseMode.MARKDOWN'));
  });

  it('генерирует проверку conditional_parse_mode', () => {
    const result = generateParseMode(validParamsMarkdown);
    assert.ok(result.includes('conditional_parse_mode'));
  });

  it('применяет кастомный отступ', () => {
    const result = generateParseMode(validParamsWithIndent);
    assert.ok(result.includes('    # Используем parse_mode'));
  });

  it('при конфликте markdown=true + formatMode="html" — побеждает formatMode (HTML)', () => {
    // formatMode имеет приоритет над устаревшим флагом markdown
    const result = generateParseMode({ markdown: true, formatMode: 'html' });
    assert.ok(result.includes('parse_mode = ParseMode.HTML'), 'должен быть HTML');
    assert.ok(!result.includes('parse_mode = ParseMode.MARKDOWN'), 'Markdown не должен быть');
  });
});

describe('parseModeParamsSchema', () => {
  it('принимает пустой объект', () => {
    assert.ok(parseModeParamsSchema.safeParse({}).success);
  });

  it('принимает markdown formatMode', () => {
    assert.ok(parseModeParamsSchema.safeParse({ formatMode: 'markdown' }).success);
  });

  it('отклоняет числовой markdown', () => {
    assert.ok(!parseModeParamsSchema.safeParse({ markdown: 1 }).success);
  });
});

describe('Производительность', () => {
  it('generateParseMode: быстрее 10ms', () => {
    const start = Date.now();
    generateParseMode(validParamsMarkdown);
    assert.ok(Date.now() - start < 10);
  });
});
