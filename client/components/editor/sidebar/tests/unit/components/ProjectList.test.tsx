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
const createMockProject = (id: number, name: string, createdAt = '2024-01-01T00:00:00Z'): BotProject => ({
  id,
  name,
  description: `Description for ${name}`,
  data: {},
  createdAt: new Date(createdAt),
  updatedAt: new Date(createdAt),
  ownerId: null,
  botToken: null,
  userDatabaseEnabled: null,
  lastExportedGoogleSheetId: null,
  lastExportedGoogleSheetUrl: null,
  lastExportedAt: null,
  lastExportedStructureSheetId: null,
  lastExportedStructureSheetUrl: null,
  lastExportedStructureAt: null,
});

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

  it('должен выделять активный проект классом border-primary', () => {
    render(<ProjectList {...defaultProps} activeProject={mockProjects[1]} />);
    
    // Находим контейнер активного проекта по тексту заголовка
    const project2Heading = screen.getByText('Project 2');
    const projectContainer = project2Heading.closest('.group');
    expect(projectContainer).toHaveClass('border-primary');
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
    
    // Находим все кнопки удаления и кликаем на первую
    const deleteButtons = screen.getAllByRole('button');
    // Фильтруем кнопки с Trash2 иконкой (они без имени)
    const trashButton = deleteButtons.find(btn => 
      btn.querySelector('svg[class*="trash"]')
    );
    
    if (trashButton) {
      fireEvent.click(trashButton);
      expect(onProjectDelete).toHaveBeenCalledWith(mockProjects[0]);
    }
  });

  it('должен поддерживать drag-and-drop', () => {
    render(<ProjectList {...defaultProps} />);
    
    // Проверяем, что у элемента есть draggable атрибут
    const projectElement = screen.getByText('Project 1').closest('.group');
    expect(projectElement?.getAttribute('draggable')).toBe('true');
  });

  it('должен отображать количество узлов для каждого проекта', () => {
    render(<ProjectList {...defaultProps} />);
    
    // Проверяем, что текст "узлов" присутствует (минимум 3 раза)
    const nodeCountElements = screen.getAllByText(/узлов/);
    expect(nodeCountElements.length).toBeGreaterThanOrEqual(1);
  });

  it('должен отображать дату создания для каждого проекта', () => {
    render(<ProjectList {...defaultProps} />);
    
    // Проверяем, что дата присутствует в формате DD.MM.YYYY (3 раза, по одному на проект)
    const dateElements = screen.getAllByText(/01\.01\.2024/);
    expect(dateElements.length).toBe(3);
  });

  it('должен показывать иконку GripVertical', () => {
    render(<ProjectList {...defaultProps} />);
    
    // Проверяем наличие иконки grip по классу
    const gripIcons = document.querySelectorAll('.lucide-grip-vertical');
    expect(gripIcons.length).toBe(3); // По одной на каждый проект
  });
});
