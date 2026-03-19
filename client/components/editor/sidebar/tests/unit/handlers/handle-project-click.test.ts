/**
 * @fileoverview Тесты для обработчика клика по проекту
 * @module tests/unit/handlers/handle-project-click.test
 */

/// <reference types="vitest/globals" />

import { handleProjectClick } from '../../../handlers/handle-project-click';
import { BotProject } from '@shared/schema';

const createMockProject = (id: number, name: string): BotProject => ({
  id,
  name,
  description: `Description for ${name}`,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
} as unknown as BotProject);

describe('handleProjectClick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен сбрасывать drag-состояние если draggedProject установлен', () => {
    const draggedProject = createMockProject(1, 'Test');
    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    handleProjectClick({ draggedProject, setDraggedProject, setDragOverProject });

    expect(setDraggedProject).toHaveBeenCalledWith(null);
    expect(setDragOverProject).toHaveBeenCalledWith(null);
  });

  it('не должен вызывать setDraggedProject если draggedProject null', () => {
    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    handleProjectClick({ draggedProject: null, setDraggedProject, setDragOverProject });

    expect(setDraggedProject).not.toHaveBeenCalled();
    expect(setDragOverProject).not.toHaveBeenCalled();
  });

  it('должен вызывать функции ровно один раз', () => {
    const draggedProject = createMockProject(1, 'Test');
    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    handleProjectClick({ draggedProject, setDraggedProject, setDragOverProject });

    expect(setDraggedProject).toHaveBeenCalledTimes(1);
    expect(setDragOverProject).toHaveBeenCalledTimes(1);
  });
});
