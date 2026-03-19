/**
 * @fileoverview Тесты для компонента ComponentsTab
 * Проверяет рендеринг категорий, сворачивание/разворачивание,
 * добавление компонентов и touch-события
 * @module tests/unit/components/components-tab.test
 */

/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentsTab } from '../../../components/components-tab';
import type { ComponentDefinition } from '@shared/schema';

/**
 * Моковые данные для тестов
 */
const createMockComponent = (id: string, name: string): ComponentDefinition => ({
  id,
  name,
  description: `Описание для ${name}`,
  icon: 'fas fa-test',
  color: 'bg-blue-100 text-blue-600',
  type: 'message',
  defaultData: {},
} as ComponentDefinition);

const mockCategories = [
  {
    title: 'Сообщения',
    components: [
      createMockComponent('text-message', 'Текстовое сообщение'),
      createMockComponent('sticker-message', 'Стикер'),
    ],
  },
  {
    title: 'Команды',
    components: [
      createMockComponent('start-command', '/start команда'),
      createMockComponent('help-command', '/help команда'),
    ],
  },
];

const mockTouchState = {
  touchedComponent: null,
  isDragging: false,
};

describe('ComponentsTab', () => {
  const defaultProps = {
    categories: mockCategories,
    collapsedCategories: new Set<string>(),
    touchState: mockTouchState,
    onToggleCategory: vi.fn(),
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
    onComponentDrag: vi.fn(),
    onComponentAdd: vi.fn(),
  };

  it('должен рендерить категории компонентов', () => {
    render(<ComponentsTab {...defaultProps} />);

    expect(screen.getByText('Сообщения')).toBeInTheDocument();
    expect(screen.getByText('Команды')).toBeInTheDocument();
  });

  it('должен сворачивать/разворачивать категории', () => {
    const onToggleCategory = vi.fn();
    const collapsedCategories = new Set<string>(['Сообщения']);
    const { rerender } = render(<ComponentsTab {...defaultProps} onToggleCategory={onToggleCategory} />);

    // Компоненты видны изначально
    expect(screen.getByText('Текстовое сообщение')).toBeInTheDocument();

    // Кликаем на заголовок категории - сворачиваем
    fireEvent.click(screen.getByTestId('category-Сообщения'));
    expect(onToggleCategory).toHaveBeenCalledWith('Сообщения');

    // Проверяем, что после сворачивания компоненты скрыты
    // Для этого симулируем состояние свёрнутой категории
    rerender(
      <ComponentsTab
        {...defaultProps}
        collapsedCategories={collapsedCategories}
        onToggleCategory={onToggleCategory}
      />
    );

    expect(screen.queryByText('Текстовое сообщение')).not.toBeInTheDocument();
  });

  it('должен вызывать onComponentAdd при клике на кнопку добавления', () => {
    const onComponentAdd = vi.fn();
    render(<ComponentsTab {...defaultProps} onComponentAdd={onComponentAdd} />);

    // Находим кнопку добавления компонента (она видна при hover)
    const addButton = screen.getByTestId('button-add-text-message');
    fireEvent.click(addButton);

    expect(onComponentAdd).toHaveBeenCalledTimes(1);
    expect(onComponentAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'text-message', name: 'Текстовое сообщение' })
    );
  });

  it('должен вызывать onTouchStart при касании компонента', () => {
    const onTouchStart = vi.fn();
    render(<ComponentsTab {...defaultProps} onTouchStart={onTouchStart} />);

    // Находим компонент
    const component = screen.getByTestId('component-text-message');
    
    // Симулируем touch событие
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(touchEvent, 'target', { value: component });
    
    component.dispatchEvent(touchEvent);

    expect(onTouchStart).toHaveBeenCalled();
  });

  it('должен отображать количество компонентов в категории', () => {
    render(<ComponentsTab {...defaultProps} />);

    // Проверяем, что число "2" присутствует 2 раза (по одному на категорию)
    const countElements = screen.getAllByText('2');
    expect(countElements.length).toBe(2);
  });

  it('должен отображать иконку компонента', () => {
    render(<ComponentsTab {...defaultProps} />);

    const icons = document.querySelectorAll('.fa-test');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('должен отображать иконку ChevronDown для развёрнутой категории', () => {
    render(<ComponentsTab {...defaultProps} />);

    // Находим категорию "Сообщения" и проверяем иконку
    const categoryHeader = screen.getByTestId('category-Сообщения');
    const chevronDown = categoryHeader.querySelector('.lucide-chevron-down');
    expect(chevronDown).toBeInTheDocument();
  });

  it('должен отображать иконку ChevronRight для свёрнутой категории', () => {
    const collapsedCategories = new Set<string>(['Сообщения']);
    render(<ComponentsTab {...defaultProps} collapsedCategories={collapsedCategories} />);

    const categoryHeader = screen.getByTestId('category-Сообщения');
    const chevronRight = categoryHeader.querySelector('.lucide-chevron-right');
    expect(chevronRight).toBeInTheDocument();
  });
});
