/**
 * @fileoverview Тесты для компонента ProjectList
 * @module tests/unit/components/ProjectList.test
 */

/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectList } from '../../../components/ProjectList';
import { BotProject } from '@shared/schema';

/**
 * Моковые данные для тестов
 */
const createMockProject = (id: number, name: string, created_at = '2024-01-01T00:00:00Z'): BotProject => ({
  id,
  name,
  description: `Description for ${name}`,
  created_at,
  updated_at: created_at,
} as BotProject);

const mockProjects: BotProject[] = [
  createMockProject(1, 'Project 1'),
  createMockProject(2, 'Project 2'),
  createMockProject(3, 'Project 3'),
];

describe('ProjectList', () => {
  const defaultProps = {
    projects: mockProjects,
    activeProject: mockProjects[0],
    dragState: {
      draggedProject: null,
      dragOverProject: null,
    },
    onProjectSelect: vi.fn(),
    onProjectDelete: vi.fn(),
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
  };

  it('должен рендерить список проектов', () => {
    render(<ProjectList {...defaultProps} />);
    
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Project 3')).toBeInTheDocument();
  });

  it('должен отображать сообщение когда нет проектов', () => {
    render(<ProjectList {...defaultProps} projects={[]} />);
    
    expect(screen.getByText('Нет проектов')).toBeInTheDocument();
    expect(screen.getByText('Создайте первый проект')).toBeInTheDocument();
  });

  it('должен выделять активный проект', () => {
    render(<ProjectList {...defaultProps} activeProject={mockProjects[1]} />);
    
    const activeProject = screen.getByText('Project 2').closest('div');
    expect(activeProject).toHaveClass('border-primary');
  });

  it('должен вызывать onProjectSelect при клике на проект', () => {
    const onProjectSelect = vi.fn();
    render(<ProjectList {...defaultProps} onProjectSelect={onProjectSelect} />);
    
    fireEvent.click(screen.getByText('Project 1'));
    expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('должен вызывать onProjectDelete при клике на кнопку удаления', () => {
    const onProjectDelete = vi.fn();
    render(<ProjectList {...defaultProps} onProjectDelete={onProjectDelete} />);
    
    // Находим кнопку удаления для первого проекта
    const deleteButtons = screen.getAllByRole('button', { name: /trash/i });
    fireEvent.click(deleteButtons[0]);
    
    expect(onProjectDelete).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('должен поддерживать drag-and-drop', () => {
    const onDragStart = vi.fn();
    const onDragOver = vi.fn();
    const onDragLeave = vi.fn();
    const onDrop = vi.fn();
    
    render(
      <ProjectList
        {...defaultProps}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />
    );
    
    const projectElement = screen.getByText('Project 1').closest('div');
    expect(projectElement).toHaveAttribute('draggable', 'true');
  });

  it('должен отображать количество узлов', () => {
    render(<ProjectList {...defaultProps} />);
    
    // Проверяем, что отображается текст с количеством узлов
    expect(screen.getByText(/узлов/)).toBeInTheDocument();
  });

  it('должен отображать дату создания', () => {
    render(<ProjectList {...defaultProps} />);
    
    // Проверяем, что дата отображается
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('должен показывать иконку GripVertical при наведении', () => {
    render(<ProjectList {...defaultProps} />);
    
    const gripIcons = screen.getAllByTestId(/grip/i);
    expect(gripIcons.length).toBeGreaterThan(0);
  });
});
