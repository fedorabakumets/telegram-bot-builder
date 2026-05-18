/**
 * @fileoverview Тесты для шаблона загрузки контента из таблицы _content
 * @module templates/content/content.test
 */

import { describe, it, expect } from 'vitest';
import { generateContentCode } from './content.renderer';
import { contentParamsSchema } from './content.schema';
import { validParams, validParamsCustomInterval } from './content.fixture';

// ─── generateContentCode() ───────────────────────────────────────────────────

describe('generateContentCode()', () => {
  it('генерирует код с projectId', () => {
    const result = generateContentCode(validParams);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('содержит load_content', () => {
    const result = generateContentCode(validParams);
    expect(result).toContain('load_content');
  });

  it('содержит get_content', () => {
    const result = generateContentCode(validParams);
    expect(result).toContain('get_content');
  });

  it('содержит _content_reload_loop', () => {
    const result = generateContentCode(validParams);
    expect(result).toContain('_content_reload_loop');
  });

  it('содержит правильный projectId в SQL', () => {
    const result = generateContentCode(validParams);
    expect(result).toContain('245');
  });

  it('содержит правильный интервал', () => {
    const result = generateContentCode(validParamsCustomInterval);
    expect(result).toContain('30');
  });

  it('содержит _content_cache', () => {
    const result = generateContentCode(validParams);
    expect(result).toContain('_content_cache');
  });

  it('содержит reload_content', () => {
    const result = generateContentCode(validParams);
    expect(result).toContain('reload_content');
  });
});

// ─── contentParamsSchema ─────────────────────────────────────────────────────

describe('contentParamsSchema', () => {
  it('принимает валидные параметры', () => {
    expect(contentParamsSchema.safeParse(validParams).success).toBe(true);
  });

  it('принимает кастомный интервал', () => {
    expect(contentParamsSchema.safeParse(validParamsCustomInterval).success).toBe(true);
  });

  it('projectId обязателен', () => {
    const invalid = { reloadIntervalSeconds: 60 };
    expect(contentParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('projectId должен быть положительным', () => {
    const invalid = { projectId: -1, reloadIntervalSeconds: 60 };
    expect(contentParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('projectId должен быть целым числом', () => {
    const invalid = { projectId: 1.5, reloadIntervalSeconds: 60 };
    expect(contentParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('reloadIntervalSeconds >= 10', () => {
    const invalid = { projectId: 100, reloadIntervalSeconds: 5 };
    expect(contentParamsSchema.safeParse(invalid).success).toBe(false);
  });

  it('reloadIntervalSeconds по умолчанию 60', () => {
    const minimal = { projectId: 100 };
    const result = contentParamsSchema.parse(minimal);
    expect(result.reloadIntervalSeconds).toBe(60);
  });
});
