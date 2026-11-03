/** @fileoverview Проверки устойчивости идентификаторов OpenAPI и сохранения исходных контрактов. */
import { describe, expect, it } from 'vitest';
import { withStableOperationIds } from './operation-ids';

describe('Идентификаторы OpenAPI', () => {
  it('сохраняет контракт и не зависит от порядка маршрутов', () => {
    const source = { paths: { '/a/{id}': { get: { security: [], responses: { 200: {} } }, parameters: [] } } };
    const first = withStableOperationIds(source);
    const extended = withStableOperationIds({ paths: { '/new': { get: {} }, ...source.paths } });
    expect(first.paths['/a/{id}'].get).toEqual(extended.paths['/a/{id}'].get);
    expect(source.paths['/a/{id}'].get).not.toHaveProperty('operationId');
    expect(first.paths['/a/{id}'].parameters).toEqual([]);
    expect(first.paths['/a/{id}'].get).toMatchObject(source.paths['/a/{id}'].get);
  });
  it('сохраняет ручной ID и выявляет дубли', () => {
    expect(withStableOperationIds({ paths: { '/a': { get: { operationId: 'read_a' } } } })
      .paths['/a'].get).toHaveProperty('operationId', 'read_a');
    expect(() => withStableOperationIds({ paths: {
      '/a': { get: { operationId: 'duplicate' } }, '/b': { post: { operationId: 'duplicate' } },
    } })).toThrow('Повторяющийся');
  });
  it('различает методы, параметры и похожие имена путей', () => {
    const result = withStableOperationIds({ paths: {
      '/a-b': { get: {}, post: {} }, '/a_b': { get: {} }, '/a/{id}': { get: {} }, '/a/id': { get: {} },
    } });
    const ids = Object.values(result.paths).flatMap(methods => Object.values(methods)
      .map(operation => (operation as { operationId: string }).operationId));
    expect(new Set(ids).size).toBe(5);
  });
});
