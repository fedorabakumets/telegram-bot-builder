/**
 * @fileoverview Тесты для компонента DialogWarning
 * Проверяет отображение предупреждения и кнопку закрытия
 * @module tests/components/dialog-warning.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/dialog-warning.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { DialogWarning } from '../../components/dialog-warning';

describe('DialogWarning', () => {
  describe('Рендеринг предупреждения', () => {
    it('должен рендерить иконку предупреждения', () => {
      render(<DialogWarning />);

      const icon = document.querySelector('.fa-exclamation-triangle');
      expect(icon).toBeInTheDocument();
    });

    it('должен рендерить основной текст предупреждения', () => {
      render(<DialogWarning />);

      expect(screen.getByText('Некоторые сообщения могут не фиксироваться')).toBeInTheDocument();
    });

    it('должен рендерить дополнительный текст', () => {
      render(<DialogWarning />);

      expect(screen.getByText('Проверьте с помощью консоли логов для полной истории')).toBeInTheDocument();
    });

    it('должен применять правильные стили контейнера', () => {
      const { container } = render(<DialogWarning />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('flex');
      expect(outerDiv).toHaveClass('items-start');
      expect(outerDiv).toHaveClass('gap-2');
      expect(outerDiv).toHaveClass('p-3');
      expect(outerDiv).toHaveClass('bg-amber-50/50');
      expect(outerDiv).toHaveClass('dark:bg-amber-950/30');
      expect(outerDiv).toHaveClass('border-b');
      expect(outerDiv).toHaveClass('border-amber-200/50');
      expect(outerDiv).toHaveClass('dark:border-amber-800/40');
    });

    it('должен применять стили к иконке', () => {
      const { container } = render(<DialogWarning />);

      const icon = container.querySelector('.fa-exclamation-triangle');
      expect(icon).toHaveClass('text-amber-600');
      expect(icon).toHaveClass('dark:text-amber-400');
      expect(icon).toHaveClass('text-sm');
      expect(icon).toHaveClass('mt-0.5');
      expect(icon).toHaveClass('flex-shrink-0');
    });

    it('должен применять стили к основному тексту', () => {
      render(<DialogWarning />);

      const mainText = screen.getByText('Некоторые сообщения могут не фиксироваться');
      expect(mainText).toHaveClass('text-sm');
      expect(mainText).toHaveClass('text-amber-700');
      expect(mainText).toHaveClass('dark:text-amber-300');
      expect(mainText).toHaveClass('leading-relaxed');
      expect(mainText).toHaveClass('font-medium');
    });

    it('должен применять стили к дополнительному тексту', () => {
      render(<DialogWarning />);

      const hintText = screen.getByText('Проверьте с помощью консоли логов для полной истории');
      expect(hintText).toHaveClass('text-xs');
      expect(hintText).toHaveClass('text-amber-600');
      expect(hintText).toHaveClass('dark:text-amber-400');
      expect(hintText).toHaveClass('mt-1');
      expect(hintText).toHaveClass('leading-relaxed');
    });
  });

  describe('Кнопка закрытия', () => {
    it('должен рендерить кнопку закрытия когда передан onClose', () => {
      const onClose = vi.fn();
      render(<DialogWarning onClose={onClose} />);

      const closeButton = screen.getByTestId('button-close-warning');
      expect(closeButton).toBeInTheDocument();
    });

    it('не должен рендерить кнопку закрытия когда onClose не передан', () => {
      render(<DialogWarning />);

      const closeButton = screen.queryByTestId('button-close-warning');
      expect(closeButton).not.toBeInTheDocument();
    });

    it('должен вызывать onClose при клике на кнопку', () => {
      const onClose = vi.fn();
      render(<DialogWarning onClose={onClose} />);

      const closeButton = screen.getByTestId('button-close-warning');
      closeButton.click();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('должен применять стили к кнопке', () => {
      const onClose = vi.fn();
      render(<DialogWarning onClose={onClose} />);

      const closeButton = screen.getByTestId('button-close-warning');
      expect(closeButton).toHaveClass('h-6');
      expect(closeButton).toHaveClass('w-6');
      expect(closeButton).toHaveClass('flex-shrink-0');
    });

    it('должен рендерить иконку X в кнопке', () => {
      const onClose = vi.fn();
      render(<DialogWarning onClose={onClose} />);

      const closeButton = screen.getByTestId('button-close-warning');
      const icon = closeButton.querySelector('.lucide-x');
      expect(icon).toHaveClass('w-3.5');
      expect(icon).toHaveClass('h-3.5');
    });
  });
});
