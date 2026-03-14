/**
 * @fileoverview Тесты для компонента NoUserSelected
 * Проверяет отображение состояния отсутствия выбранного пользователя
 * @module tests/components/no-user-selected.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/no-user-selected.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { NoUserSelected } from '../../components/no-user-selected';

describe('NoUserSelected', () => {
  it('должен рендерить иконку сообщения', () => {
    render(<NoUserSelected />);

    const icon = document.querySelector('.lucide-message-square');
    expect(icon).toBeInTheDocument();
  });

  it('должен рендерить текст подсказки', () => {
    render(<NoUserSelected />);

    expect(screen.getByText('Выберите пользователя для просмотра диалога')).toBeInTheDocument();
  });

  it('должен применять правильные стили контейнера', () => {
    const { container } = render(<NoUserSelected />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('h-full');
    expect(outerDiv).toHaveClass('flex');
    expect(outerDiv).toHaveClass('flex-col');
    expect(outerDiv).toHaveClass('items-center');
    expect(outerDiv).toHaveClass('justify-center');
    expect(outerDiv).toHaveClass('text-muted-foreground');
    expect(outerDiv).toHaveClass('p-4');
  });

  it('должен применять стили к иконке', () => {
    const { container } = render(<NoUserSelected />);

    const icon = container.querySelector('.lucide-message-square');
    expect(icon).toHaveClass('w-12');
    expect(icon).toHaveClass('h-12');
    expect(icon).toHaveClass('mb-4');
  });

  it('должен применять стили к тексту', () => {
    render(<NoUserSelected />);

    const textElement = screen.getByText('Выберите пользователя для просмотра диалога');
    expect(textElement).toHaveClass('text-center');
  });
});
