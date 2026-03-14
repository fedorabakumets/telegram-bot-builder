/**
 * @fileoverview Тесты для компонента WarningTooltip
 * Проверяет отображение tooltip с предупреждением
 * @module tests/components/warning-tooltip.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/warning-tooltip.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { WarningTooltip } from '../../components/warning-tooltip';

// Мокируем Tooltip компоненты
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children, delayDuration }: any) => (
    <div data-testid="tooltip-wrapper" data-delay={delayDuration}>
      {children}
    </div>
  ),
  TooltipContent: ({ children, side, align, className }: any) => (
    <div data-testid="tooltip-content" data-side={side} data-align={align} className={className}>
      {children}
    </div>
  ),
  TooltipTrigger: ({ children, asChild }: any) => (
    <span data-testid="tooltip-trigger" data-as-child={asChild}>
      {children}
    </span>
  ),
}));

// Мокируем lucide-react иконки
vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: any) => (
    <svg data-testid="alert-triangle-icon" className={className} />
  ),
}));

describe('WarningTooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Рендеринг', () => {
    it('должен рендерить иконку предупреждения', () => {
      render(<WarningTooltip />);

      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toBeInTheDocument();
    });

    it('должен применять стили к кнопке', () => {
      render(<WarningTooltip />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-amber-500');
      expect(button).toHaveClass('hover:text-amber-600');
      expect(button).toHaveClass('dark:text-amber-400');
      expect(button).toHaveClass('dark:hover:text-amber-300');
      expect(button).toHaveClass('transition-colors');
    });

    it('должен иметь aria-label с текстом предупреждения', () => {
      render(<WarningTooltip />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Панель в разработке');
    });

    it('должен применять стили к иконке', () => {
      render(<WarningTooltip />);

      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveClass('w-3.5');
      expect(icon).toHaveClass('h-3.5');
    });
  });

  describe('Кастомные сообщения', () => {
    it('должен использовать кастомное message', () => {
      render(<WarningTooltip message="Кастомное сообщение" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Кастомное сообщение');
    });

    it('должен использовать кастомное hint', () => {
      render(<WarningTooltip hint="Кастомная подсказка" />);

      const content = screen.getByTestId('tooltip-content');
      expect(content).toBeInTheDocument();
    });

    it('должен использовать оба кастомных значения', () => {
      render(
        <WarningTooltip
          message="Моё сообщение"
          hint="Моя подсказка"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Моё сообщение');
    });
  });

  describe('Tooltip Content', () => {
    it('должен рендерить tooltip content с правильными стилями', () => {
      render(<WarningTooltip />);

      const content = screen.getByTestId('tooltip-content');
      expect(content).toHaveClass('max-w-[240px]');
      expect(content).toHaveClass('bg-amber-50');
      expect(content).toHaveClass('dark:bg-amber-950');
      expect(content).toHaveClass('border-amber-200');
      expect(content).toHaveClass('dark:border-amber-800');
    });

    it('должен иметь side="bottom"', () => {
      render(<WarningTooltip />);

      const content = screen.getByTestId('tooltip-content');
      expect(content).toHaveAttribute('data-side', 'bottom');
    });

    it('должен иметь align="start"', () => {
      render(<WarningTooltip />);

      const content = screen.getByTestId('tooltip-content');
      expect(content).toHaveAttribute('data-align', 'start');
    });

    it('должен рендерить текст сообщения в tooltip', () => {
      render(<WarningTooltip />);

      const content = screen.getByTestId('tooltip-content');
      expect(content).toHaveTextContent('Панель в разработке');
    });

    it('должен рендерить текст подсказки в tooltip', () => {
      render(<WarningTooltip />);

      const content = screen.getByTestId('tooltip-content');
      expect(content).toHaveTextContent('Отправка, отображение и сохранение сообщений могут работать некорректно');
    });

    it('должен применять стили к тексту сообщения', () => {
      render(<WarningTooltip />);

      const content = screen.getByTestId('tooltip-content');
      const messageText = content.querySelector('p');
      expect(messageText).toHaveClass('text-xs');
      expect(messageText).toHaveClass('font-medium');
      expect(messageText).toHaveClass('text-amber-700');
      expect(messageText).toHaveClass('dark:text-amber-300');
    });

    it('должен применять стили к тексту подсказки', () => {
      render(<WarningTooltip />);

      const content = screen.getByTestId('tooltip-content');
      const hintParagraphs = content.querySelectorAll('p');
      expect(hintParagraphs[1]).toHaveClass('text-[10px]');
      expect(hintParagraphs[1]).toHaveClass('text-amber-600');
      expect(hintParagraphs[1]).toHaveClass('dark:text-amber-400');
      expect(hintParagraphs[1]).toHaveClass('mt-1');
    });
  });

  describe('Tooltip Trigger', () => {
    it('должен иметь asChild={true}', () => {
      render(<WarningTooltip />);

      const trigger = screen.getByTestId('tooltip-trigger');
      expect(trigger).toHaveAttribute('data-as-child', 'true');
    });
  });

  describe('Tooltip Wrapper', () => {
    it('должен иметь delayDuration={200}', () => {
      render(<WarningTooltip />);

      const wrapper = screen.getByTestId('tooltip-wrapper');
      expect(wrapper).toHaveAttribute('data-delay', '200');
    });
  });
});
