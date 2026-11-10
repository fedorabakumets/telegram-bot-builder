/**
 * @fileoverview Проверка соответствия справочных констант схемам конструктора.
 */
import { describe, expect, it } from 'vitest';
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
});
