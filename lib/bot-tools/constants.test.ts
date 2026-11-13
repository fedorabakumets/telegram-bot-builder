/**
 * @fileoverview Проверка соответствия справочных констант схемам конструктора.
 */
import { describe, expect, it, vi } from 'vitest';
import { nodeSchema } from '@shared/schema/tables/node-schema';
import { CONDITION_OPERATORS, NODE_TYPES, ZOD_CONDITION_OPERATORS } from './constants';

describe('Константы инструментов конструктора', () => {
  it('содержат все допустимые типы нод из схемы', () => {
    expect(NODE_TYPES).toEqual(nodeSchema.shape.type.options);
    expect(NODE_TYPES).toContain('message');
  });

  it('извлекают операторы из веток с обёрткой default', () => {
    expect(ZOD_CONDITION_OPERATORS).toEqual(CONDITION_OPERATORS);
    expect(ZOD_CONDITION_OPERATORS).toContain('filled');
    expect(ZOD_CONDITION_OPERATORS).toContain('else');
  });

  it('загружаются без метода unwrap у обёртки default', async () => {
    vi.resetModules();
    const { nodeSchema: schema } = await import('@shared/schema/tables/node-schema');
    const branches = schema.shape.data.shape.branches;
    const descriptor = Object.getOwnPropertyDescriptor(branches, 'unwrap');
    Object.defineProperty(branches, 'unwrap', { configurable: true, value: undefined });
    try {
      const constants = await import('./constants');
      expect(constants.ZOD_CONDITION_OPERATORS).toEqual(CONDITION_OPERATORS);
      expect(branches.parse(undefined)).toEqual([]);
    } finally {
      if (descriptor) Object.defineProperty(branches, 'unwrap', descriptor);
      else Reflect.deleteProperty(branches, 'unwrap');
      vi.resetModules();
    }
  });
});
