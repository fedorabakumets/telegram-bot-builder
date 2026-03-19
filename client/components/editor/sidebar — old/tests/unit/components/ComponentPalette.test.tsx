/**
 * @fileoverview Тесты для компонента ComponentPalette
 * @module tests/unit/components/ComponentPalette.test
 */

/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentPalette } from '../../../components/ComponentPalette';
import { ComponentDefinition } from '@shared/schema';

/**
 * Моковые данные для тестов
 */
const createMockComponent = (id: string, name: string): ComponentDefinition => ({
  id,
  name,
  description: `Description for ${name}`,
  icon: 'fas fa-test',
  color: 'bg-blue-100 text-blue-600',
  type: 'message',
  defaultData: {},
} as ComponentDefinition);

const mockCategories = [
  {
    name: 'Сообщения',
    description: 'Компоненты сообщений',
    icon: 'fas fa-comment',
    components: [
      createMockComponent('text-message', 'Текстовое сообщение'),
      createMockComponent('sticker-message', 'Стикер'),
    ],
  },
  {
    name: 'Команды',
    description: 'Компоненты команд',
    icon: 'fas fa-terminal',
    components: [
      createMockComponent('start-command', '/start команда'),
      createMockComponent('help-command', '/help команда'),
    ],
  },
];

describe('ComponentPalette', () => {
  const defaultProps = {
    categories: mockCategories,
    onComponentDragStart: vi.fn(),
  };

  it('должен рендерить категории компонентов', () => {
    render(<ComponentPalette {...defaultProps} />);
    
    expect(screen.getByText('Сообщения')).toBeInTheDocument();
    expect(screen.getByText('Команды')).toBeInTheDocument();
  });

  it('должен отображать количество компонентов в категории', () => {
    render(<ComponentPalette {...defaultProps} />);
    
    // Проверяем, что число "2" присутствует 2 раза (по одному на категорию)
    const countElements = screen.getAllByText('2');
    expect(countElements.length).toBe(2);
  });

  it('должен сворачивать категорию при клике на заголовок', () => {
    render(<ComponentPalette {...defaultProps} />);
    
    // Компоненты видны изначально
    expect(screen.getByText('Текстовое сообщение')).toBeInTheDocument();
    
    // Кликаем на заголовок категории
    fireEvent.click(screen.getByText('Сообщения'));
    
    // Компоненты скрыты
    expect(screen.queryByText('Текстовое сообщение')).not.toBeInTheDocument();
  });

  it('должен разворачивать категорию при повторном клике', () => {
    render(<ComponentPalette {...defaultProps} />);
    
    // Сворачиваем
    fireEvent.click(screen.getByText('Сообщения'));
    expect(screen.queryByText('Текстовое сообщение')).not.toBeInTheDocument();
    
    // Разворачиваем
    fireEvent.click(screen.getByText('Сообщения'));
    expect(screen.getByText('Текстовое сообщение')).toBeInTheDocument();
  });

  it('должен вызывать onComponentDragStart при начале перетаскивания', () => {
    const onComponentDragStart = vi.fn();
    render(<ComponentPalette {...defaultProps} onComponentDragStart={onComponentDragStart} />);
    
    const component = screen.getByText('Текстовое сообщение').closest('[draggable]');
    if (component) {
      fireEvent.dragStart(component);
      expect(onComponentDragStart).toHaveBeenCalled();
    }
  });

  it('должен иметь правильный draggable атрибут', () => {
    render(<ComponentPalette {...defaultProps} />);
    
    const component = screen.getByText('Текстовое сообщение').closest('[draggable]');
    expect(component?.getAttribute('draggable')).toBe('true');
  });

  it('должен отображать иконку компонента', () => {
    render(<ComponentPalette {...defaultProps} />);
    
    const icons = document.querySelectorAll('.fa-test');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('должен отображать иконку ChevronDown для развёрнутой категории', () => {
    render(<ComponentPalette {...defaultProps} />);
    
    // Находим категорию "Сообщения" и проверяем иконку
    const categoryHeader = screen.getByText('Сообщения').closest('button');
    const chevronDown = categoryHeader?.querySelector('.lucide-chevron-down');
    expect(chevronDown).toBeInTheDocument();
  });

  it('должен отображать иконку ChevronRight для свёрнутой категории', () => {
    render(<ComponentPalette {...defaultProps} />);
    
    // Сворачиваем категорию
    fireEvent.click(screen.getByText('Сообщения'));
    
    const categoryHeader = screen.getByText('Сообщения').closest('button');
    const chevronRight = categoryHeader?.querySelector('.lucide-chevron-right');
    expect(chevronRight).toBeInTheDocument();
  });
});
