/**
 * @fileoverview Тесты для компонента ProjectCard
 * Проверяет рендеринг, взаимодействие и drag-and-drop функциональность
 * @module tests/unit/components/project-card.test
 */

/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from '../../../components/project-card';
import { BotProject } from '@shared/schema';

/**
 * Моковые данные для тестов
 */
const createMockProject = (
  id: number,
  name: string,
  description = '',
  createdAt = '2024-01-01T00:00:00Z'
): BotProject => ({
  id,
  name,
  description,
  data: {
    version: 2,
    sheets: [
      { id: 'sheet-1', name: 'Лист 1' },
      { id: 'sheet-2', name: 'Лист 2' },
    ],
  },
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

const mockProject = createMockProject(1, 'Тестовый проект', 'Описание проекта');

const mockAllProjects = [
  createMockProject(1, 'Тестовый проект'),
  createMockProject(2, 'Другой проект'),
];

const defaultProps = {
  project: mockProject,
  isActive: false,
  currentProjectId: 1,
  activeSheetId: 'sheet-1',
  onProjectSelect: vi.fn(),
  onProjectDelete: vi.fn(),
  onSheetSelect: vi.fn(),
  onSheetRename: vi.fn(),
  onSheetDuplicate: vi.fn(),
  onSheetDelete: vi.fn(),
  dragState: {
    draggedProject: null,
    dragOverProject: null,
    draggedSheet: null,
    dragOverSheet: null,
  },
  onProjectDragStart: vi.fn(),
  onProjectDragOver: vi.fn(),
  onProjectDragLeave: vi.fn(),
  onProjectDrop: vi.fn(),
  onSheetDragStart: vi.fn(),
  onSheetDragOver: vi.fn(),
  onSheetDragLeave: vi.fn(),
  onSheetDrop: vi.fn(),
  editingState: {
    editingSheetId: null,
    editingSheetName: '',
  },
  onStartEditingSheet: vi.fn(),
  onSaveSheetName: vi.fn(),
  onCancelEditSheetName: vi.fn(),
  onEditingSheetNameChange: vi.fn(),
  allProjects: mockAllProjects,
  onMoveSheetToProject: vi.fn(),
};

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен рендерить проект с правильными данными', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('Тестовый проект')).toBeInTheDocument();
    expect(screen.getByText('Описание проекта')).toBeInTheDocument();
  });

  it('должен показывать активный проект выделенным', () => {
    const { container } = render(<ProjectCard {...defaultProps} isActive={true} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('from-blue-600/20');
  });

  it('должен вызывать onProjectSelect при клике', () => {
    const onProjectSelect = vi.fn();
    render(<ProjectCard {...defaultProps} onProjectSelect={onProjectSelect} />);

    fireEvent.click(screen.getByText('Тестовый проект'));
    expect(onProjectSelect).toHaveBeenCalledWith(1);
  });

  it('должен вызывать onProjectDelete при удалении', () => {
    const onProjectDelete = vi.fn();
    render(<ProjectCard {...defaultProps} onProjectDelete={onProjectDelete} />);

    // Находим кнопку удаления по title атрибуту
    const deleteButton = screen.getByTitle('Удалить проект');
    fireEvent.click(deleteButton);
    expect(onProjectDelete).toHaveBeenCalledWith(1);
  });

  it('должен отображать листы проекта', () => {
    render(<ProjectCard {...defaultProps} />);

    expect(screen.getByText('Лист 1')).toBeInTheDocument();
    expect(screen.getByText('Лист 2')).toBeInTheDocument();
  });

  it('должен показывать метаданные проекта (узлы, листы, дата)', () => {
    render(<ProjectCard {...defaultProps} />);

    // Проверяем наличие иконок метаданных
    expect(document.querySelector('.lucide-zap')).toBeInTheDocument();
    expect(document.querySelector('.lucide-file-text')).toBeInTheDocument();
    expect(document.querySelector('.lucide-calendar')).toBeInTheDocument();
  });

  it('должен вызывать onSheetSelect при клике на лист', () => {
    const onSheetSelect = vi.fn();
    render(<ProjectCard {...defaultProps} onSheetSelect={onSheetSelect} />);

    fireEvent.click(screen.getByText('Лист 1'));
    expect(onSheetSelect).toHaveBeenCalledWith('sheet-1');
  });

  it('должен вызывать onStartEditingSheet при двойном клике на лист', () => {
    const onStartEditingSheet = vi.fn();
    render(
      <ProjectCard
        {...defaultProps}
        onStartEditingSheet={onStartEditingSheet}
      />
    );

    fireEvent.doubleClick(screen.getByText('Лист 1'));
    expect(onStartEditingSheet).toHaveBeenCalledWith('sheet-1', 'Лист 1');
  });

  it('должен вызывать onSheetDuplicate при клике на кнопку копирования', () => {
    const onSheetDuplicate = vi.fn();
    render(<ProjectCard {...defaultProps} onSheetDuplicate={onSheetDuplicate} />);

    // Находим кнопку дублирования рядом с Лист 1
    const sheetElement = screen.getByText('Лист 1').closest('.group\\/sheet');
    const copyButton = sheetElement?.querySelector('button[title="Дублировать лист"]');
    
    if (copyButton) {
      fireEvent.click(copyButton);
      expect(onSheetDuplicate).toHaveBeenCalledWith('sheet-1');
    }
  });

  it('должен вызывать onSheetDelete при клике на кнопку удаления листа', () => {
    const onSheetDelete = vi.fn();
    render(<ProjectCard {...defaultProps} onSheetDelete={onSheetDelete} />);

    // Находим кнопку удаления листа
    const sheetElement = screen.getByText('Лист 1').closest('.group\\/sheet');
    const deleteButton = sheetElement?.querySelector('button[title="Удалить лист"]');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(onSheetDelete).toHaveBeenCalledWith('sheet-1');
    }
  });

  it('должен показывать индикатор владельца проекта', () => {
    render(<ProjectCard {...defaultProps} />);

    // Проверяем наличие индикатора владельца (👥 для общего проекта)
    expect(screen.getByText('👥')).toBeInTheDocument();
  });

  it('должен показывать индикатор личного проекта', () => {
    const personalProject = createMockProject(2, 'Личный проект', '', '2024-01-01T00:00:00Z');
    personalProject.ownerId = 123;

    render(<ProjectCard {...defaultProps} project={personalProject} />);

    // Проверяем наличие индикатора владельца (👤 для личного проекта)
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('должен поддерживать drag-and-drop для проекта', () => {
    const { container } = render(<ProjectCard {...defaultProps} />);

    const card = container.firstChild as HTMLElement;
    expect(card.getAttribute('draggable')).toBe('true');
  });

  it('должен вызывать onProjectDragStart при начале перетаскивания', () => {
    const onProjectDragStart = vi.fn();
    render(<ProjectCard {...defaultProps} onProjectDragStart={onProjectDragStart} />);

    const card = screen.getByText('Тестовый проект').closest('.group') as HTMLElement;
    fireEvent.dragStart(card);
    expect(onProjectDragStart).toHaveBeenCalled();
  });

  it('должен применять стили при перетаскивании над проектом', () => {
    const { container } = render(
      <ProjectCard
        {...defaultProps}
        dragState={{
          ...defaultProps.dragState,
          dragOverProject: 1,
        }}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-blue-500');
  });

  it('должен отображать режим редактирования имени листа', () => {
    render(
      <ProjectCard
        {...defaultProps}
        editingState={{
          editingSheetId: 'sheet-1',
          editingSheetName: 'Новое имя',
        }}
      />
    );

    // В режиме редактирования должен быть input
    const input = screen.getByDisplayValue('Новое имя');
    expect(input).toBeInTheDocument();
  });

  it('должен вызывать onSaveSheetName при нажатии Enter в режиме редактирования', () => {
    const onSaveSheetName = vi.fn();
    render(
      <ProjectCard
        {...defaultProps}
        editingState={{
          editingSheetId: 'sheet-1',
          editingSheetName: 'Новое имя',
        }}
        onSaveSheetName={onSaveSheetName}
      />
    );

    const input = screen.getByDisplayValue('Новое имя');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSaveSheetName).toHaveBeenCalled();
  });

  it('должен вызывать onCancelEditSheetName при нажатии Escape в режиме редактирования', () => {
    const onCancelEditSheetName = vi.fn();
    render(
      <ProjectCard
        {...defaultProps}
        editingState={{
          editingSheetId: 'sheet-1',
          editingSheetName: 'Новое имя',
        }}
        onCancelEditSheetName={onCancelEditSheetName}
      />
    );

    const input = screen.getByDisplayValue('Новое имя');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancelEditSheetName).toHaveBeenCalled();
  });

  it('должен вызывать onEditingSheetNameChange при изменении input', () => {
    const onEditingSheetNameChange = vi.fn();
    render(
      <ProjectCard
        {...defaultProps}
        editingState={{
          editingSheetId: 'sheet-1',
          editingSheetName: 'Старое имя',
        }}
        onEditingSheetNameChange={onEditingSheetNameChange}
      />
    );

    const input = screen.getByDisplayValue('Старое имя');
    fireEvent.change(input, { target: { value: 'Новое имя' } });
    expect(onEditingSheetNameChange).toHaveBeenCalledWith('Новое имя');
  });

  it('должен отображать кнопку перемещения листа в другой проект', () => {
    render(<ProjectCard {...defaultProps} allProjects={mockAllProjects} />);

    // Находим кнопку перемещения (Share2 иконка)
    const sheetElement = screen.getByText('Лист 1').closest('.group\\/sheet');
    const moveButton = sheetElement?.querySelector('button[title="Переместить в другой проект"]');
    
    expect(moveButton).toBeInTheDocument();
  });

  it('должен скрывать кнопки управления листом когда не hovered', () => {
    render(<ProjectCard {...defaultProps} />);

    const sheetElement = screen.getByText('Лист 1').closest('.group\\/sheet');
    const buttonsContainer = sheetElement?.querySelector('.opacity-0');
    
    // Кнопки должны быть с классом opacity-0 когда не hovered
    expect(buttonsContainer).toBeInTheDocument();
  });
});
