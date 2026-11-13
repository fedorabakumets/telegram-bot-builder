/**
 * @fileoverview Проверка извлечения enum-полей из настоящих схем Zod 3 и Zod 4.
 */
import { describe, expect, it } from 'vitest';
import { z as z3 } from 'zod/v3';
import { z as z4 } from 'zod/v4';
import { nodeSchema } from '@shared/schema/tables/node-schema';
import { extractEnumFields } from './enum-introspection';

describe.each([
  ['Zod 3', {
    nested: z3.object({
      mode: z3.enum(['first', 'second']).default('first').nullable().optional(),
      branches: z3.array(z3.object({ operator: z3.enum(['filled', 'else']) })).default([]),
      ignored: z3.string(),
    }),
    preprocess: z3.preprocess((value) => value, z3.enum(['a', 'b'])),
    transform: z3.enum(['a', 'b']).transform((value) => value),
  }],
  ['Zod 4', {
    nested: z4.object({
      mode: z4.enum(['first', 'second']).default('first').nullable().optional(),
      branches: z4.array(z4.object({ operator: z4.enum(['filled', 'else']) })).default([]),
      ignored: z4.string(),
    }),
    preprocess: z4.preprocess((value) => value, z4.enum(['a', 'b'])),
    transform: z4.enum(['a', 'b']).transform((value) => value),
  }],
] as const)('Извлечение enum: %s', (_name, schemas) => {
  it('обходит объекты, массивы и вложенные обёртки без изменения путей', () => {
    expect(extractEnumFields(schemas.nested)).toEqual({
      mode: ['first', 'second'],
      'branches[].operator': ['filled', 'else'],
    });
  });

  it('сохраняет enum под preprocess и преобразованием результата', () => {
    expect(extractEnumFields(schemas.preprocess, 'input'))
      .toEqual({ input: ['a', 'b'] });
    expect(extractEnumFields(schemas.transform, 'output'))
      .toEqual({ output: ['a', 'b'] });
  });
});

it('извлекает операторы веток из рабочей схемы конструктора', () => {
  const fields = extractEnumFields(nodeSchema.shape.data);
  expect(fields['branches[].operator']).toContain('filled');
  expect(fields['branches[].operator']).toContain('else');
});

it('безопасно обрабатывает пустые и циклические внешние значения', () => {
  expect(extractEnumFields(undefined)).toEqual({});
  expect(extractEnumFields({})).toEqual({});
  const cyclic: any = { _def: { type: 'default' } };
  cyclic._def.innerType = cyclic;
  expect(extractEnumFields(cyclic)).toEqual({});
});
