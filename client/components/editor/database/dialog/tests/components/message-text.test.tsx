/**
 * @fileoverview Тесты для компонента MessageText
 * Проверяет отображение текста сообщения с разными стилями
 * @module tests/components/message-text.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/message-text.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MessageText } from '../../components/message-text';

describe('MessageText', () => {
  describe('Рендеринг текста', () => {
    it('должен рендерить простой текст', () => {
      render(<MessageText text="Привет мир" messageType="bot" />);

      expect(screen.getByText('Привет мир')).toBeInTheDocument();
    });

    it('должен рендерить текст с переносами строк', () => {
      render(<MessageText text="Строка 1\nСтрока 2" messageType="bot" />);

      const paragraph = document.querySelector('p');
      expect(paragraph?.textContent).toContain('Строка 1');
      expect(paragraph?.textContent).toContain('Строка 2');
    });

    it('должен обрабатывать null текст', () => {
      const { container } = render(<MessageText text={null} messageType="bot" />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('');
    });

    it('должен обрабатывать undefined текст', () => {
      const { container } = render(<MessageText text={undefined} messageType="bot" />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('');
    });

    it('должен обрабатывать пустую строку', () => {
      const { container } = render(<MessageText text="" messageType="bot" />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('');
    });

    it('должен обрезать пробелы в конце текста', () => {
      const { container } = render(<MessageText text="Текст с пробелами   " messageType="bot" />);

      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toBe('Текст с пробелами');
    });
  });

  describe('Стили для бота', () => {
    it('должен применять стили для бота', () => {
      const { container } = render(<MessageText text="Текст" messageType="bot" />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('bg-blue-100');
      expect(outerDiv).toHaveClass('dark:bg-blue-900/50');
      expect(outerDiv).toHaveClass('text-blue-900');
      expect(outerDiv).toHaveClass('dark:text-blue-100');
    });

    it('должен применять rounded-lg для бота', () => {
      const { container } = render(<MessageText text="Текст" messageType="bot" />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('rounded-lg');
    });

    it('должен применять отступы для бота', () => {
      const { container } = render(<MessageText text="Текст" messageType="bot" />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('px-3');
      expect(outerDiv).toHaveClass('py-2');
    });
  });

  describe('Стили для пользователя', () => {
    it('должен применять стили для пользователя', () => {
      const { container } = render(<MessageText text="Текст" messageType="user" />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('bg-green-100');
      expect(outerDiv).toHaveClass('dark:bg-green-900/50');
      expect(outerDiv).toHaveClass('text-green-900');
      expect(outerDiv).toHaveClass('dark:text-green-100');
    });

    it('должен применять rounded-lg для пользователя', () => {
      const { container } = render(<MessageText text="Текст" messageType="user" />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('rounded-lg');
    });

    it('должен применять отступы для пользователя', () => {
      const { container } = render(<MessageText text="Текст" messageType="user" />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('px-3');
      expect(outerDiv).toHaveClass('py-2');
    });
  });

  describe('Стили текста', () => {
    it('должен применять text-sm к параграфу', () => {
      const { container } = render(<MessageText text="Текст" messageType="bot" />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('text-sm');
    });

    it('должен применять whitespace-pre-wrap', () => {
      const { container } = render(<MessageText text="Текст" messageType="bot" />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('whitespace-pre-wrap');
    });

    it('должен применять break-words', () => {
      const { container } = render(<MessageText text="Текст" messageType="bot" />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('break-words');
    });
  });
});
