/**
 * @fileoverview Тесты для компонента MessageTimestamp
 * Проверяет отображение времени сообщения
 * @module tests/components/message-timestamp.test
 */

/// <reference types="vitest/globals" />

import { render, screen } from '@testing-library/react';
import { MessageTimestamp } from '../../components/message-timestamp';

describe('MessageTimestamp', () => {
  describe('Отображение времени', () => {
    it('должен возвращать null если createdAt не указан', () => {
      const { container } = render(<MessageTimestamp createdAt={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null если createdAt null', () => {
      const { container } = render(<MessageTimestamp createdAt={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null если createdAt пустая строка', () => {
      const { container } = render(<MessageTimestamp createdAt="" />);
      expect(container.firstChild).toBeNull();
    });

    it('должен рендерить дату в формате span с классами', () => {
      const date = new Date('2024-03-14T10:30:00Z');

      render(<MessageTimestamp createdAt={date} />);

      // formatDate возвращает форматированную дату в русском формате
      const timestamp = screen.getByText(/14 мар\. 2024/);
      expect(timestamp).toBeInTheDocument();
      expect(timestamp.tagName).toBe('SPAN');
      expect(timestamp).toHaveClass('text-xs');
      expect(timestamp).toHaveClass('text-muted-foreground');
    });
  });

  describe('Форматирование даты', () => {
    it('должен форматировать Date объект', () => {
      const date = new Date('2024-01-15T14:30:00Z');

      render(<MessageTimestamp createdAt={date} />);

      expect(screen.getByText(/15 янв\. 2024/)).toBeInTheDocument();
    });

    it('должен форматировать ISO строку', () => {
      const dateString = '2024-03-14T10:30:00Z';

      render(<MessageTimestamp createdAt={dateString} />);

      expect(screen.getByText(/14 мар\. 2024/)).toBeInTheDocument();
    });
  });

  describe('Стили и классы', () => {
    it('должен применять класс text-xs', () => {
      const date = new Date('2024-03-14T10:30:00Z');

      render(<MessageTimestamp createdAt={date} />);

      expect(screen.getByText(/14 мар\. 2024/)).toHaveClass('text-xs');
    });

    it('должен применять класс text-muted-foreground', () => {
      const date = new Date('2024-03-14T10:30:00Z');

      render(<MessageTimestamp createdAt={date} />);

      expect(screen.getByText(/14 мар\. 2024/)).toHaveClass('text-muted-foreground');
    });
  });

  describe('Граничные случаи', () => {
    it('должен обрабатывать дату в прошлом', () => {
      const oldDate = new Date('2020-01-01T00:00:00Z');

      render(<MessageTimestamp createdAt={oldDate} />);

      expect(screen.getByText(/1 янв\. 2020/)).toBeInTheDocument();
    });

    it('должен обрабатывать полночь', () => {
      const midnight = new Date('2024-03-14T00:00:00Z');

      render(<MessageTimestamp createdAt={midnight} />);

      expect(screen.getByText(/14 мар\. 2024/)).toBeInTheDocument();
    });

    it('должен обрабатывать полдень', () => {
      const noon = new Date('2024-03-14T12:00:00Z');

      render(<MessageTimestamp createdAt={noon} />);

      expect(screen.getByText(/14 мар\. 2024/)).toBeInTheDocument();
    });
  });
});
