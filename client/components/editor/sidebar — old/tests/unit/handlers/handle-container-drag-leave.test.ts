/**
 * @fileoverview Тесты для обработчика ухода из контейнера проектов
 * @module tests/unit/handlers/handle-container-drag-leave.test
 */

/// <reference types="vitest/globals" />

import { handleContainerDragLeave } from '../../../handlers/handle-container-drag-leave';

describe('handleContainerDragLeave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен сбрасывать dragOverProject и dragOverSheet', () => {
    const setDragOverProject = vi.fn();
    const setDragOverSheet = vi.fn();

    handleContainerDragLeave(setDragOverProject, setDragOverSheet);

    expect(setDragOverProject).toHaveBeenCalledWith(null);
    expect(setDragOverSheet).toHaveBeenCalledWith(null);
  });

  it('должен вызывать функции ровно один раз', () => {
    const setDragOverProject = vi.fn();
    const setDragOverSheet = vi.fn();

    handleContainerDragLeave(setDragOverProject, setDragOverSheet);

    expect(setDragOverProject).toHaveBeenCalledTimes(1);
    expect(setDragOverSheet).toHaveBeenCalledTimes(1);
  });
});
