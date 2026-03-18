/**
 * @fileoverview Тесты для обработчиков drag-and-drop проектов
 * @module tests/unit/handlers/project-drag-handlers.test
 */

/// <reference types="vitest/globals" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleProjectDragStart } from '../../../handlers/handle-project-drag-start';
import { handleProjectDragOver } from '../../../handlers/handle-project-drag-over';
import { handleProjectDragLeave } from '../../../handlers/handle-project-drag-leave';
import { handleProjectDrop } from '../../../handlers/handle-project-drop';
import { BotProject } from '@shared/schema';
import { QueryClient } from '@tanstack/react-query';

describe('Project Drag-and-Drop Handlers', () => {
  const createMockProject = (id: number, name: string): BotProject => ({
    id,
    name,
    description: `Description for ${name}`,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as BotProject);

  const createMockDragEvent = () => ({
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
    dataTransfer: {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
    },
  } as unknown as React.DragEvent);

  describe('handleProjectDragStart', () => {
    it('должен устанавливать перетаскиваемый проект', () => {
      const project = createMockProject(1, 'Test Project');
      const setDraggedSheet = vi.fn();
      const setDraggedProject = vi.fn();
      const e = createMockDragEvent();

      handleProjectDragStart(e, { project, setDraggedSheet, setDraggedProject });

      expect(setDraggedSheet).toHaveBeenCalledWith(null);
      expect(setDraggedProject).toHaveBeenCalledWith(project);
    });

    it('должен устанавливать effectAllowed в move', () => {
      const project = createMockProject(1, 'Test');
      const setDraggedSheet = vi.fn();
      const setDraggedProject = vi.fn();
      const e = createMockDragEvent();

      handleProjectDragStart(e, { project, setDraggedSheet, setDraggedProject });

      expect(e.dataTransfer.effectAllowed).toBe('move');
    });

    it('должен вызывать stopPropagation', () => {
      const project = createMockProject(1, 'Test');
      const setDraggedSheet = vi.fn();
      const setDraggedProject = vi.fn();
      const e = createMockDragEvent();

      handleProjectDragStart(e, { project, setDraggedSheet, setDraggedProject });

      expect(e.stopPropagation).toHaveBeenCalled();
    });

    it('должен устанавливать данные в dataTransfer', () => {
      const project = createMockProject(42, 'Test');
      const setDraggedSheet = vi.fn();
      const setDraggedProject = vi.fn();
      const e = createMockDragEvent();

      handleProjectDragStart(e, { project, setDraggedSheet, setDraggedProject });

      expect(e.dataTransfer.setData).toHaveBeenCalledWith('text/plain', '42');
    });
  });

  describe('handleProjectDragOver', () => {
    it('должен устанавливать целевой проект', () => {
      const setDragOverProject = vi.fn();
      const e = createMockDragEvent();

      handleProjectDragOver(e, 123, setDragOverProject);

      expect(setDragOverProject).toHaveBeenCalledWith(123);
    });

    it('должен вызывать preventDefault', () => {
      const setDragOverProject = vi.fn();
      const e = createMockDragEvent();

      handleProjectDragOver(e, 1, setDragOverProject);

      expect(e.preventDefault).toHaveBeenCalled();
    });

    it('должен устанавливать dropEffect в move', () => {
      const setDragOverProject = vi.fn();
      const e = createMockDragEvent();

      handleProjectDragOver(e, 1, setDragOverProject);

      expect(e.dataTransfer.dropEffect).toBe('move');
    });
  });

  describe('handleProjectDragLeave', () => {
    it('должен сбрасывать целевой проект', () => {
      const setDragOverProject = vi.fn();

      handleProjectDragLeave(setDragOverProject);

      expect(setDragOverProject).toHaveBeenCalledWith(null);
    });
  });

  describe('handleProjectDrop', () => {
    const createMockQueryClient = (projects: BotProject[]) => ({
      getQueryData: vi.fn().mockReturnValue(projects),
      setQueryData: vi.fn(),
    } as unknown as QueryClient);

    const createMockToast = () => vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('должен предотвращать стандартное поведение', () => {
      const e = createMockDragEvent();
      const draggedProject = createMockProject(1, 'Dragged');
      const targetProject = createMockProject(2, 'Target');
      const queryClient = createMockQueryClient([draggedProject, targetProject]);
      const setDraggedProject = vi.fn();
      const setDragOverProject = vi.fn();
      const toast = createMockToast();

      handleProjectDrop(e, {
        draggedProject,
        targetProject,
        queryClient,
        setDraggedProject,
        setDragOverProject,
        toast,
      });

      expect(e.preventDefault).toHaveBeenCalled();
      expect(e.stopPropagation).toHaveBeenCalled();
    });

    it('должен сбрасывать dragOverProject', () => {
      const e = createMockDragEvent();
      const draggedProject = createMockProject(1, 'Dragged');
      const targetProject = createMockProject(2, 'Target');
      const queryClient = createMockQueryClient([draggedProject, targetProject]);
      const setDraggedProject = vi.fn();
      const setDragOverProject = vi.fn();
      const toast = createMockToast();

      handleProjectDrop(e, {
        draggedProject,
        targetProject,
        queryClient,
        setDraggedProject,
        setDragOverProject,
        toast,
      });

      expect(setDragOverProject).toHaveBeenCalledWith(null);
    });

    it('должен отменять операцию если draggedProject не установлен', () => {
      const e = createMockDragEvent();
      const targetProject = createMockProject(2, 'Target');
      const queryClient = createMockQueryClient([targetProject]);
      const setDraggedProject = vi.fn();
      const setDragOverProject = vi.fn();
      const toast = createMockToast();

      handleProjectDrop(e, {
        draggedProject: null,
        targetProject,
        queryClient,
        setDraggedProject,
        setDragOverProject,
        toast,
      });

      expect(setDraggedProject).toHaveBeenCalledWith(null);
      expect(toast).not.toHaveBeenCalled();
    });

    it('должен отменять операцию если перетаскивают тот же проект', () => {
      const e = createMockDragEvent();
      const project = createMockProject(1, 'Same');
      const queryClient = createMockQueryClient([project]);
      const setDraggedProject = vi.fn();
      const setDragOverProject = vi.fn();
      const toast = createMockToast();

      handleProjectDrop(e, {
        draggedProject: project,
        targetProject: project,
        queryClient,
        setDraggedProject,
        setDragOverProject,
        toast,
      });

      expect(setDraggedProject).toHaveBeenCalledWith(null);
      expect(toast).not.toHaveBeenCalled();
    });

    it('должен отменять операцию если проект не найден', () => {
      const e = createMockDragEvent();
      const draggedProject = createMockProject(999, 'Not Exists');
      const targetProject = createMockProject(1, 'Target');
      const queryClient = createMockQueryClient([targetProject]);
      const setDraggedProject = vi.fn();
      const setDragOverProject = vi.fn();
      const toast = createMockToast();

      handleProjectDrop(e, {
        draggedProject,
        targetProject,
        queryClient,
        setDraggedProject,
        setDragOverProject,
        toast,
      });

      expect(setDraggedProject).toHaveBeenCalledWith(null);
      expect(toast).not.toHaveBeenCalled();
    });

    it('должен переупорядочивать проекты', () => {
      const e = createMockDragEvent();
      const project1 = createMockProject(1, 'First');
      const project2 = createMockProject(2, 'Second');
      const project3 = createMockProject(3, 'Third');
      const projects = [project1, project2, project3];
      const queryClient = createMockQueryClient(projects);
      const setDraggedProject = vi.fn();
      const setDragOverProject = vi.fn();
      const toast = createMockToast();

      // Перемещаем project3 перед project1
      handleProjectDrop(e, {
        draggedProject: project3,
        targetProject: project1,
        queryClient,
        setDraggedProject,
        setDragOverProject,
        toast,
      });

      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        ['/api/projects'],
        expect.arrayContaining([project3, project1, project2])
      );
    });

    it('должен показывать уведомление об успехе', () => {
      const e = createMockDragEvent();
      const project1 = createMockProject(1, 'First');
      const project2 = createMockProject(2, 'Second');
      const queryClient = createMockQueryClient([project1, project2]);
      const setDraggedProject = vi.fn();
      const setDragOverProject = vi.fn();
      const toast = createMockToast();

      handleProjectDrop(e, {
        draggedProject: project2,
        targetProject: project1,
        queryClient,
        setDraggedProject,
        setDragOverProject,
        toast,
      });

      expect(toast).toHaveBeenCalledWith({
        title: '✅ Проекты переупорядочены',
        description: 'Проект "Second" перемещен',
      });
    });

    it('должен обновлять кеш queryClient', () => {
      const e = createMockDragEvent();
      const project1 = createMockProject(1, 'First');
      const project2 = createMockProject(2, 'Second');
      const queryClient = createMockQueryClient([project1, project2]);
      const setDraggedProject = vi.fn();
      const setDragOverProject = vi.fn();
      const toast = createMockToast();

      handleProjectDrop(e, {
        draggedProject: project2,
        targetProject: project1,
        queryClient,
        setDraggedProject,
        setDragOverProject,
        toast,
      });

      expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/projects'], expect.any(Array));
      expect(queryClient.setQueryData).toHaveBeenCalledWith(['/api/projects/list'], expect.any(Array));
    });
  });
});
