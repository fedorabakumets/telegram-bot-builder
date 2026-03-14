/**
 * @fileoverview Тесты для компонента MessageMedia
 * Проверяет отображение медиафайлов в сообщении
 * @module tests/components/message-media.test
 *
 * @description
 * Для тестирования React-компонентов используется @testing-library/react
 * Запуск: npx vitest run client/components/editor/database/dialog/tests/components/message-media.test.tsx
 */

/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageMedia } from '../../components/message-media';

describe('MessageMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Рендеринг медиа', () => {
    it('должен рендерить одно изображение', () => {
      const media = [{ url: 'https://example.com/image.jpg', messageId: 1 }];
      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(img).toHaveAttribute('alt', 'Photo');
    });

    it('должен рендерить несколько изображений', () => {
      const media = [
        { url: 'https://example.com/image1.jpg', messageId: 1 },
        { url: 'https://example.com/image2.jpg', messageId: 2 },
        { url: 'https://example.com/image3.jpg', messageId: 3 },
      ];
      render(<MessageMedia media={media} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
      expect(images[2]).toHaveAttribute('src', 'https://example.com/image3.jpg');
    });

    it('должен применять стили к контейнеру', () => {
      const media = [{ url: 'https://example.com/image.jpg', messageId: 1 }];
      const { container } = render(<MessageMedia media={media} />);

      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toHaveClass('rounded-lg');
      expect(outerDiv).toHaveClass('overflow-hidden');
      expect(outerDiv).toHaveClass('max-w-[200px]');
      expect(outerDiv).toHaveClass('space-y-1');
    });

    it('должен применять стили к изображениям', () => {
      const media = [{ url: 'https://example.com/image.jpg', messageId: 1 }];
      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toHaveClass('w-full');
      expect(img).toHaveClass('h-auto');
      expect(img).toHaveClass('rounded-lg');
    });

    it('должен использовать data-testid с messageId и индексом', () => {
      const media = [{ url: 'https://example.com/image.jpg', messageId: 123 }];
      render(<MessageMedia media={media} />);

      const img = screen.getByTestId('dialog-photo-123-0');
      expect(img).toBeInTheDocument();
    });

    it('должен использовать правильный индекс для нескольких изображений', () => {
      const media = [
        { url: 'https://example.com/image1.jpg', messageId: 1 },
        { url: 'https://example.com/image2.jpg', messageId: 1 },
      ];
      render(<MessageMedia media={media} />);

      expect(screen.getByTestId('dialog-photo-1-0')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-photo-1-1')).toBeInTheDocument();
    });
  });

  describe('Отсутствие медиа', () => {
    it('должен возвращать null когда media не передан', () => {
      const { container } = render(<MessageMedia />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null когда media пустой массив', () => {
      const { container } = render(<MessageMedia media={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null когда media не массив', () => {
      const { container } = render(<MessageMedia media={'invalid' as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null когда media null', () => {
      const { container } = render(<MessageMedia media={null as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null когда media undefined', () => {
      const { container } = render(<MessageMedia media={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Обработка ошибок загрузки', () => {
    it('должен скрывать изображение при ошибке загрузки', () => {
      const media = [{ url: 'https://example.com/broken.jpg', messageId: 1 }];
      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      fireEvent.error(img);

      expect(img).toHaveAttribute('style', 'display: none;');
    });

    it('должен скрывать только изображение с ошибкой при нескольких медиа', () => {
      const media = [
        { url: 'https://example.com/good.jpg', messageId: 1 },
        { url: 'https://example.com/broken.jpg', messageId: 2 },
      ];
      render(<MessageMedia media={media} />);

      const images = screen.getAllByRole('img');
      fireEvent.error(images[1]);

      expect(images[0]).not.toHaveAttribute('style', 'display: none;');
      expect(images[1]).toHaveAttribute('style', 'display: none;');
    });
  });

  describe('Изображения без messageId', () => {
    it('должен рендерить изображение без messageId', () => {
      const media = [{ url: 'https://example.com/image.jpg' }];
      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('должен использовать undefined в data-testid когда нет messageId', () => {
      const media = [{ url: 'https://example.com/image.jpg' }];
      render(<MessageMedia media={media} />);

      const img = screen.getByTestId('dialog-photo-undefined-0');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Ключи для изображений', () => {
    it('должен использовать индекс как ключ', () => {
      const media = [
        { url: 'https://example.com/image1.jpg', messageId: 1 },
        { url: 'https://example.com/image2.jpg', messageId: 1 },
      ];
      const { container } = render(<MessageMedia media={media} />);

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(2);
    });
  });
});
