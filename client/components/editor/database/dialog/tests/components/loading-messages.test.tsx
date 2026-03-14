/**
 * @fileoverview Тесты для компонента LoadingMessages
 * Проверяет отображение состояния загрузки
 * @module tests/components/loading-messages.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/loading-messages.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { LoadingMessages } from '../../components/loading-messages';

describe('LoadingMessages', () => {
  it('должен рендерить иконку загрузки', () => {
    render(<LoadingMessages />);

    const icon = document.querySelector('.lucide-refresh-cw');
    expect(icon).toBeInTheDocument();
  });

  it('должен рендерить текст "Загрузка..."', () => {
    render(<LoadingMessages />);

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('должен применять анимацию вращения к иконке', () => {
    const { container } = render(<LoadingMessages />);

    const icon = container.querySelector('.lucide-refresh-cw');
    expect(icon).toHaveClass('animate-spin');
  });

  it('должен применять правильные стили контейнера', () => {
    const { container } = render(<LoadingMessages />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('flex');
    expect(outerDiv).toHaveClass('items-center');
    expect(outerDiv).toHaveClass('justify-center');
    expect(outerDiv).toHaveClass('py-8');
  });

  it('должен применять стили к иконке', () => {
    const { container } = render(<LoadingMessages />);

    const icon = container.querySelector('.lucide-refresh-cw');
    expect(icon).toHaveClass('w-6');
    expect(icon).toHaveClass('h-6');
    expect(icon).toHaveClass('text-muted-foreground');
  });

  it('должен применять стили к тексту', () => {
    render(<LoadingMessages />);

    const textElement = screen.getByText('Загрузка...');
    expect(textElement).toHaveClass('text-muted-foreground');
    expect(textElement).toHaveClass('text-sm');
    expect(textElement).toHaveClass('ml-2');
  });
});
