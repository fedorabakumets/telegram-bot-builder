/**
 * @fileoverview Тесты для обработчика завершения перетаскивания проекта
 * @module tests/unit/handlers/handle-project-drag-end.test
 */

/// <reference types="vitest/globals" />

import { handleProjectDragEnd } from '../../../handlers/handle-project-drag-end';

describe('handleProjectDragEnd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен сбрасывать draggedProject и dragOverProject', () => {
    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    handleProjectDragEnd(setDraggedProject, setDragOverProject);

    expect(setDraggedProject).toHaveBeenCalledWith(null);
    expect(setDragOverProject).toHaveBeenCalledWith(null);
  });

  it('должен вызываться один раз для каждой функции', () => {
    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    handleProjectDragEnd(setDraggedProject, setDragOverProject);

    expect(setDraggedProject).toHaveBeenCalledTimes(1);
    expect(setDragOverProject).toHaveBeenCalledTimes(1);
  });
});
