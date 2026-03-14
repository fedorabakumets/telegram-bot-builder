/**
 * @fileoverview Тесты для компонента DialogInput
 * Проверяет ввод и отправку сообщений
 * @module tests/components/dialog-input.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/dialog-input.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DialogInput } from '../../components/dialog-input';

// Мокируем CompactInlineEditor
vi.mock('@/components/editor/inline-rich/compact-inline-editor', () => ({
  CompactInlineEditor: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="compact-inline-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Мокируем Button компонент
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, size, className, 'data-testid': dataTestId }: any) => (
    <button
      data-testid={dataTestId || 'button'}
      onClick={onClick}
      disabled={disabled}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

// Мокируем lucide-react иконки
vi.mock('lucide-react', () => ({
  RefreshCw: ({ className }: any) => (
    <svg data-testid="refresh-cw-icon" className={className} />
  ),
  Send: ({ className }: any) => (
    <svg data-testid="send-icon" className={className} />
  ),
}));

describe('DialogInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Рендеринг', () => {
    it('должен рендерить поле ввода', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      expect(screen.getByTestId('compact-inline-editor')).toBeInTheDocument();
    });

    it('должен рендерить placeholder', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      expect(screen.getByTestId('compact-inline-editor')).toHaveAttribute('placeholder', 'Введите сообщение...');
    });

    it('должен рендерить кнопку отправки', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      expect(screen.getByTestId('dialog-panel-button-send')).toBeInTheDocument();
    });

    it('должен рендерить текст подсказки про Enter', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      expect(screen.getByText('Enter - отправить')).toBeInTheDocument();
    });

    it('должен применять стили к контейнеру', () => {
      const { container } = render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('p-3');
      expect(outerDiv).toHaveClass('space-y-2');
    });
  });

  describe('Ввод текста', () => {
    it('должен обновлять значение при вводе', async () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const input = screen.getByTestId('compact-inline-editor');
      fireEvent.change(input, { target: { value: 'Новое сообщение' } });

      expect(input).toHaveValue('Новое сообщение');
    });

    it('должен начинать с пустым значением', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      expect(screen.getByTestId('compact-inline-editor')).toHaveValue('');
    });
  });

  describe('Отправка сообщения', () => {
    it('должен вызывать onSend при клике на кнопку', () => {
      const onSend = vi.fn();
      render(<DialogInput isPending={false} onSend={onSend} />);

      const input = screen.getByTestId('compact-inline-editor');
      fireEvent.change(input, { target: { value: 'Тестовое сообщение' } });

      const button = screen.getByTestId('dialog-panel-button-send');
      fireEvent.click(button);

      expect(onSend).toHaveBeenCalledWith('Тестовое сообщение');
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('должен очищать поле после отправки', () => {
      const onSend = vi.fn();
      render(<DialogInput isPending={false} onSend={onSend} />);

      const input = screen.getByTestId('compact-inline-editor');
      fireEvent.change(input, { target: { value: 'Тестовое сообщение' } });

      const button = screen.getByTestId('dialog-panel-button-send');
      fireEvent.click(button);

      expect(input).toHaveValue('');
    });

    it('не должен отправлять пустое сообщение', () => {
      const onSend = vi.fn();
      render(<DialogInput isPending={false} onSend={onSend} />);

      const button = screen.getByTestId('dialog-panel-button-send');
      fireEvent.click(button);

      expect(onSend).not.toHaveBeenCalled();
    });

    it('не должен отправлять сообщение с пробелами', () => {
      const onSend = vi.fn();
      render(<DialogInput isPending={false} onSend={onSend} />);

      const input = screen.getByTestId('compact-inline-editor');
      fireEvent.change(input, { target: { value: '   ' } });

      const button = screen.getByTestId('dialog-panel-button-send');
      fireEvent.click(button);

      expect(onSend).not.toHaveBeenCalled();
    });

    it('не должен отправлять когда isPending=true', () => {
      const onSend = vi.fn();
      render(<DialogInput isPending={true} onSend={onSend} />);

      const input = screen.getByTestId('compact-inline-editor');
      fireEvent.change(input, { target: { value: 'Тестовое сообщение' } });

      const button = screen.getByTestId('dialog-panel-button-send');
      fireEvent.click(button);

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('Состояние кнопки', () => {
    it('должен быть disabled когда поле пустое', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const button = screen.getByTestId('dialog-panel-button-send');
      expect(button).toBeDisabled();
    });

    it('должен быть disabled когда введены только пробелы', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const input = screen.getByTestId('compact-inline-editor');
      fireEvent.change(input, { target: { value: '   ' } });

      const button = screen.getByTestId('dialog-panel-button-send');
      expect(button).toBeDisabled();
    });

    it('должен быть enabled когда есть текст', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const input = screen.getByTestId('compact-inline-editor');
      fireEvent.change(input, { target: { value: 'Текст' } });

      const button = screen.getByTestId('dialog-panel-button-send');
      expect(button).not.toBeDisabled();
    });

    it('должен быть disabled когда isPending=true', () => {
      render(<DialogInput isPending={true} onSend={vi.fn()} />);

      const input = screen.getByTestId('compact-inline-editor');
      fireEvent.change(input, { target: { value: 'Текст' } });

      const button = screen.getByTestId('dialog-panel-button-send');
      expect(button).toBeDisabled();
    });
  });

  describe('Отображение иконки загрузки', () => {
    it('должен показывать иконку загрузки когда isPending=true', () => {
      render(<DialogInput isPending={true} onSend={vi.fn()} />);

      expect(screen.getByTestId('refresh-cw-icon')).toBeInTheDocument();
    });

    it('не должен показывать иконку загрузки когда isPending=false', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      expect(screen.queryByTestId('refresh-cw-icon')).not.toBeInTheDocument();
    });

    it('должен показывать иконку отправки когда isPending=false', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('не должен показывать иконку отправки когда isPending=true', () => {
      render(<DialogInput isPending={true} onSend={vi.fn()} />);

      expect(screen.queryByTestId('send-icon')).not.toBeInTheDocument();
    });

    it('должен показывать текст "Отправить" когда isPending=false', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      expect(screen.getByText('Отправить')).toBeInTheDocument();
    });

    it('не должен показывать текст "Отправить" когда isPending=true', () => {
      render(<DialogInput isPending={true} onSend={vi.fn()} />);

      expect(screen.queryByText('Отправить')).not.toBeInTheDocument();
    });
  });

  describe('Стили кнопки', () => {
    it('должен иметь size="sm"', () => {
      render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const button = screen.getByTestId('dialog-panel-button-send');
      expect(button).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('Flex контейнер кнопки', () => {
    it('должен иметь flex контейнер для кнопки', () => {
      const { container } = render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });

    it('должен иметь justify-between', () => {
      const { container } = render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toHaveClass('justify-between');
    });

    it('должен иметь items-center', () => {
      const { container } = render(<DialogInput isPending={false} onSend={vi.fn()} />);

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toHaveClass('items-center');
    });
  });
});
