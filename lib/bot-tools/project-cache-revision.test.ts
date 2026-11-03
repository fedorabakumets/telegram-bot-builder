/** @fileoverview Регрессии позднего PUT и rollback после принятой новой live-ревизии. */
import { describe, expect, it } from 'vitest';
import { isSavedProjectReceipt, preferNewerProject, rollbackProjectList } from '../../client/pages/editor/utils/project-cache-revision';

describe('Монотонность кеша проектов', () => {
  it('не принимает произвольный HTTP-успех за подтверждённую квитанцию', () => {
    expect(isSavedProjectReceipt({ id: 1, revision: 2 })).toBe(false);
    expect(isSavedProjectReceipt({ id: 1, revision: 2, persistence: { confirmed: true } })).toBe(true);
  });
  it('сохраняет live revision6 при позднем успехе и ошибке revision5', () => {
    const current = { id: 1, revision: 6, data: 'agent' };
    expect(preferNewerProject(current, { id: 1, revision: 5, data: 'late' })).toBe(current);
    expect(rollbackProjectList([current], [{ id: 1, revision: 4, data: 'before' }])[0]).toBe(current);
    expect(preferNewerProject(current, { id: 1, data: 'old API' })).toBe(current);
  });
  it('разрешает откат своей оптимистичной ревизии и не удаляет новые проекты списка', () => {
    const previous = { id: 1, revision: 5, data: 'saved' };
    expect(preferNewerProject({ id: 1, revision: 5, data: 'draft' }, previous)).toBe(previous);
    expect(rollbackProjectList([{ id: 1, revision: 5, data: 'draft' }, { id: 2, revision: 1, data: 'new' }], [previous]))
      .toEqual([previous, { id: 2, revision: 1, data: 'new' }]);
  });
});
