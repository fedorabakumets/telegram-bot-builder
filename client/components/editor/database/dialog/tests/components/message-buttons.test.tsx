/**
 * @fileoverview Тесты для компонента MessageButtons
 * Проверяет отображение кнопок бота
 * @module tests/components/message-buttons.test
 */

/// <reference types="vitest/globals" />

import { render, screen } from '@testing-library/react';
import { MessageButtons } from '../../components/message-buttons';

describe('MessageButtons', () => {
  describe('Отображение кнопок', () => {
    it('должен возвращать null если buttons не массив', () => {
      const { container } = render(<MessageButtons buttons={null as any} index={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null если buttons пустой массив', () => {
      const { container } = render(<MessageButtons buttons={[]} index={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null если buttons undefined', () => {
      const { container } = render(<MessageButtons buttons={undefined as any} index={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен рендерить одну кнопку', () => {
      const buttons = [{ text: 'Button 1' }];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-button-preview-0-0')).toBeInTheDocument();
    });

    it('должен рендерить несколько кнопок', () => {
      const buttons = [
        { text: 'Button 1' },
        { text: 'Button 2' },
        { text: 'Button 3' },
      ];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
      expect(screen.getByText('Button 3')).toBeInTheDocument();
      
      expect(screen.getByTestId('dialog-button-preview-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-button-preview-0-1')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-button-preview-0-2')).toBeInTheDocument();
    });

    it('должен использовать btnIndex для key (а не уникальный id)', () => {
      const buttons = [
        { text: 'Button 1' },
        { text: 'Button 2' },
      ];

      const { container } = render(<MessageButtons buttons={buttons} index={0} />);

      const buttonElements = container.querySelectorAll('[data-testid^="dialog-button-preview"]');
      expect(buttonElements).toHaveLength(2);
      
      // Проверяем что используются индексы 0 и 1
      expect(screen.getByTestId('dialog-button-preview-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-button-preview-0-1')).toBeInTheDocument();
    });
  });

  describe('data-testid', () => {
    it('должен использовать format: dialog-button-preview-{index}-{btnIndex}', () => {
      const buttons = [{ text: 'Button' }];

      render(<MessageButtons buttons={buttons} index={5} />);

      expect(screen.getByTestId('dialog-button-preview-5-0')).toBeInTheDocument();
    });

    it('должен использовать разные btnIndex для разных кнопок', () => {
      const buttons = [
        { text: 'Button 1' },
        { text: 'Button 2' },
        { text: 'Button 3' },
      ];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByTestId('dialog-button-preview-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-button-preview-0-1')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-button-preview-0-2')).toBeInTheDocument();
    });
  });

  describe('Стили и классы', () => {
    it('должен применять классы для контейнера', () => {
      const buttons = [{ text: 'Button' }];

      render(<MessageButtons buttons={buttons} index={0} />);

      const container = screen.getByTestId('dialog-button-preview-0-0').parentElement;
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('flex-wrap');
      expect(container).toHaveClass('gap-1');
      expect(container).toHaveClass('mt-1');
    });

    it('должен применять классы для кнопок', () => {
      const buttons = [{ text: 'Button' }];

      render(<MessageButtons buttons={buttons} index={0} />);

      const button = screen.getByTestId('dialog-button-preview-0-0');
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('px-2');
      expect(button).toHaveClass('py-0.5');
      expect(button).toHaveClass('text-xs');
      expect(button).toHaveClass('rounded-md');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('border-blue-300');
      expect(button).toHaveClass('text-blue-700');
    });

    it('должен применять dark mode классы', () => {
      const buttons = [{ text: 'Button' }];

      render(<MessageButtons buttons={buttons} index={0} />);

      const button = screen.getByTestId('dialog-button-preview-0-0');
      expect(button).toHaveClass('dark:bg-gray-800');
      expect(button).toHaveClass('dark:border-blue-700');
      expect(button).toHaveClass('dark:text-blue-300');
    });
  });

  describe('Текст кнопок', () => {
    it('должен отображать текст кнопки', () => {
      const buttons = [{ text: 'Click Me' }];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('должен отображать пустую строку если text undefined', () => {
      const buttons = [{ text: undefined }];

      render(<MessageButtons buttons={buttons} index={0} />);

      const button = screen.getByTestId('dialog-button-preview-0-0');
      expect(button).toHaveTextContent('');
    });

    it('должен отображать пустую строку если text null', () => {
      const buttons = [{ text: null }];

      render(<MessageButtons buttons={buttons} index={0} />);

      const button = screen.getByTestId('dialog-button-preview-0-0');
      expect(button).toHaveTextContent('');
    });

    it('должен преобразовывать числовой текст в строку', () => {
      const buttons = [{ text: 123 as any }];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('должен отображать эмодзи в тексте', () => {
      const buttons = [{ text: '👍 Like' }];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByText('👍 Like')).toBeInTheDocument();
    });

    it('должен отображать длинный текст кнопки', () => {
      const buttons = [{ text: 'A'.repeat(100) }];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });
  });

  describe('Граничные случаи', () => {
    it('должен обрабатывать кнопки с пустым объектом', () => {
      const buttons = [{}];

      render(<MessageButtons buttons={buttons} index={0} />);

      const button = screen.getByTestId('dialog-button-preview-0-0');
      expect(button).toHaveTextContent('');
    });

    it('должен обрабатывать смешанные кнопки', () => {
      const buttons = [
        { text: 'Button 1' },
        { text: undefined },
        { text: 'Button 3' },
        { text: null },
      ];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 3')).toBeInTheDocument();
      expect(screen.getAllByTestId(/dialog-button-preview-0-\d+/)).toHaveLength(4);
    });

    it('должен обрабатывать очень большой массив кнопок', () => {
      const buttons = Array(50).fill({ text: 'Button' });

      render(<MessageButtons buttons={buttons} index={0} />);

      const allButtons = screen.getAllByTestId(/dialog-button-preview-0-\d+/);
      expect(allButtons).toHaveLength(50);
    });
  });

  describe('Использование index из пропсов', () => {
    it('должен использовать index=0', () => {
      const buttons = [{ text: 'Button' }];

      render(<MessageButtons buttons={buttons} index={0} />);

      expect(screen.getByTestId('dialog-button-preview-0-0')).toBeInTheDocument();
    });

    it('должен использовать index=1', () => {
      const buttons = [{ text: 'Button' }];

      render(<MessageButtons buttons={buttons} index={1} />);

      expect(screen.getByTestId('dialog-button-preview-1-0')).toBeInTheDocument();
    });

    it('должен использовать index=999', () => {
      const buttons = [{ text: 'Button' }];

      render(<MessageButtons buttons={buttons} index={999} />);

      expect(screen.getByTestId('dialog-button-preview-999-0')).toBeInTheDocument();
    });

    it('должен использовать разные index для разных сообщений', () => {
      const buttons = [{ text: 'Button' }];

      const { rerender } = render(<MessageButtons buttons={buttons} index={0} />);
      expect(screen.getByTestId('dialog-button-preview-0-0')).toBeInTheDocument();

      rerender(<MessageButtons buttons={buttons} index={1} />);
      expect(screen.getByTestId('dialog-button-preview-1-0')).toBeInTheDocument();
    });
  });
});
