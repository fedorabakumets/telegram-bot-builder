/**
 * @fileoverview Тесты для компонента SidebarHeader
 * Проверяет рендеринг заголовка и переключение вкладок
 * @module components/editor/sidebar/tests/unit/components/sidebar-header.test
 */

/// <reference types="vitest/globals" />

import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarHeader } from '../../../components/sidebar-header';

describe('SidebarHeader', () => {
  const mockProps = {
    currentTab: 'elements' as const,
    onTabChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен рендерить заголовок "Компоненты"', () => {
    render(<SidebarHeader {...mockProps} />);

    expect(screen.getByText('Компоненты')).toBeInTheDocument();
  });

  it('должен переключаться на вкладку "Элементы"', () => {
    render(<SidebarHeader {...mockProps} currentTab="projects" onTabChange={mockProps.onTabChange} />);

    const elementsTab = screen.getByText('Элементы');
    fireEvent.click(elementsTab);

    expect(mockProps.onTabChange).toHaveBeenCalledWith('elements');
  });

  it('должен переключаться на вкладку "Проекты"', () => {
    render(<SidebarHeader {...mockProps} />);

    const projectsTab = screen.getByText('Проекты');
    fireEvent.click(projectsTab);

    expect(mockProps.onTabChange).toHaveBeenCalledWith('projects');
  });

  it('должен показывать активную вкладку выделенной', () => {
    const { container } = render(<SidebarHeader {...mockProps} currentTab="elements" />);

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveClass('from-blue-600', 'to-blue-500', 'text-white');
    expect(buttons[1]).not.toHaveClass('from-blue-600', 'to-blue-500', 'text-white');
  });

  it('должен вызывать onClose при клике на кнопку закрытия', () => {
    const onClose = vi.fn();
    render(<SidebarHeader {...mockProps} onClose={onClose} />);

    const closeButton = screen.getByTestId('button-close-components-sidebar');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('не должен показывать кнопку закрытия если onClose не передан', () => {
    render(<SidebarHeader {...mockProps} onClose={undefined} />);

    expect(screen.queryByTestId('button-close-components-sidebar')).not.toBeInTheDocument();
  });

  it('должен показывать LayoutButtons если showLayoutButtons=true', () => {
    render(
      <SidebarHeader
        {...mockProps}
        showLayoutButtons
        onToggleCanvas={vi.fn()}
        onToggleHeader={vi.fn()}
        onToggleProperties={vi.fn()}
        onShowFullLayout={vi.fn()}
      />
    );

    // LayoutButtons рендерится через иконки
    expect(screen.getByText('Компоненты')).toBeInTheDocument();
  });

  it('не должен показывать LayoutButtons если showLayoutButtons=false', () => {
    const { container } = render(<SidebarHeader {...mockProps} showLayoutButtons={false} />);

    // Проверяем что нет кнопок макета
    expect(container.querySelectorAll('button').length).toBe(2); // только вкладки
  });
});
