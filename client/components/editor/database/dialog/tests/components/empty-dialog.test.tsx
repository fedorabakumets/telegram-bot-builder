/**
 * @fileoverview Тесты для компонента EmptyDialog
 * Проверяет отображение пустого состояния диалога
 * @module tests/components/empty-dialog.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/empty-dialog.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { EmptyDialog } from '../../components/empty-dialog';

describe('EmptyDialog', () => {
  it('должен рендерить иконку сообщения', () => {
    render(<EmptyDialog />);

    const icon = screen.getByTestId('empty-dialog-messages').querySelector('.lucide-message-square');
    expect(icon).toBeInTheDocument();
  });

  it('должен рендерить текст "Нет сообщений"', () => {
    render(<EmptyDialog />);

    expect(screen.getByText('Нет сообщений')).toBeInTheDocument();
  });

  it('должен рендерить подсказку о начале диалога', () => {
    render(<EmptyDialog />);

    expect(screen.getByText(/Начните диалог, отправив первое сообщение/)).toBeInTheDocument();
  });

  it('должен применять правильные стили контейнера', () => {
    const { container } = render(<EmptyDialog />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('flex');
    expect(outerDiv).toHaveClass('flex-col');
    expect(outerDiv).toHaveClass('items-center');
    expect(outerDiv).toHaveClass('justify-center');
    expect(outerDiv).toHaveClass('py-12');
    expect(outerDiv).toHaveClass('text-center');
  });

  it('должен иметь data-testid атрибут', () => {
    render(<EmptyDialog />);

    expect(screen.getByTestId('empty-dialog-messages')).toBeInTheDocument();
  });

  it('должен применять стили к иконке', () => {
    render(<EmptyDialog />);

    const icon = screen.getByTestId('empty-dialog-messages').querySelector('.lucide-message-square');
    expect(icon).toHaveClass('w-12');
    expect(icon).toHaveClass('h-12');
    expect(icon).toHaveClass('text-muted-foreground');
  });

  it('должен применять стили к основному тексту', () => {
    render(<EmptyDialog />);

    const textElement = screen.getByText('Нет сообщений');
    expect(textElement).toHaveClass('text-muted-foreground');
    expect(textElement).toHaveClass('text-sm');
  });

  it('должен применять стили к подсказке', () => {
    render(<EmptyDialog />);

    const hintElement = screen.getByText(/Начните диалог, отправив первое сообщение/);
    expect(hintElement).toHaveClass('text-xs');
    expect(hintElement).toHaveClass('text-muted-foreground');
    expect(hintElement).toHaveClass('mt-1');
  });
});
