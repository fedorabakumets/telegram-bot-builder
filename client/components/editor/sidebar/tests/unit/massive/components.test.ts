/**
 * @fileoverview Тесты для массива компонентов
 * @module tests/unit/massive/components.test
 */

/// <reference types="vitest/globals" />

import { components } from '../../../massive/massiv';

describe('Components Array', () => {
  it('должен быть массивом', () => {
    expect(Array.isArray(components)).toBe(true);
  });

  it('должен содержать более 10 компонентов', () => {
    expect(components.length).toBeGreaterThan(10);
  });

  it('каждый компонент должен иметь обязательные поля', () => {
    components.forEach(component => {
      expect(component).toHaveProperty('id');
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('description');
      expect(component).toHaveProperty('icon');
      expect(component).toHaveProperty('color');
      expect(component).toHaveProperty('type');
      expect(component).toHaveProperty('defaultData');
    });
  });

  it('каждый компонент должен иметь уникальный id', () => {
    const ids = components.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('каждый компонент должен иметь defaultData', () => {
    components.forEach(component => {
      expect(component.defaultData).toBeDefined();
      expect(typeof component.defaultData).toBe('object');
    });
  });
});
