/**
 * @fileoverview Тесты для компонента MessageMedia
 * Проверяет отображение медиафайлов в сообщениях
 * @module tests/components/message-media.test
 *
 * @description
 * Компонент MessageMedia:
 * - Принимает media: Array<{url: string, messageId?: number}>
 * - НЕ проверяет type поля (photo/image/picture и т.д.)
 * - Использует idx для key: key={idx}
 * - data-testid={`dialog-photo-${m.messageId}-${idx}`} (может быть undefined)
 * - onError скрывает изображение через display: none
 */

/// <reference types="vitest/globals" />

import { render, screen } from '@testing-library/react';
import { MessageMedia } from '../../components/message-media';

describe('MessageMedia', () => {
  describe('Отображение медиа', () => {
    it('должен возвращать null если media не массив', () => {
      const { container } = render(<MessageMedia media={null as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null если media пустой массив', () => {
      const { container } = render(<MessageMedia media={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен возвращать null если media undefined', () => {
      const { container } = render(<MessageMedia media={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('должен рендерить одно изображение', () => {
      const media = [
        {
          url: 'https://example.com/image1.jpg',
        },
      ];

      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(img).toHaveAttribute('alt', 'Photo');
    });

    it('должен рендерить несколько изображений', () => {
      const media = [
        { url: 'https://example.com/image1.jpg' },
        { url: 'https://example.com/image2.jpg' },
        { url: 'https://example.com/image3.jpg' },
      ];

      render(<MessageMedia media={media} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
      expect(images[2]).toHaveAttribute('src', 'https://example.com/image3.jpg');
    });

    it('должен использовать messageId и idx для data-testid', () => {
      const media = [
        {
          url: 'https://example.com/image.jpg',
          messageId: 123,
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByTestId('dialog-photo-123-0')).toBeInTheDocument();
    });

    it('должен использовать несколько изображений с разными messageId', () => {
      const media = [
        { url: 'https://example.com/1.jpg', messageId: 100 },
        { url: 'https://example.com/2.jpg', messageId: 200 },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByTestId('dialog-photo-100-0')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-photo-200-1')).toBeInTheDocument();
    });
  });

  describe('Стили и классы', () => {
    it('должен применять классы для контейнера', () => {
      const media = [
        { url: 'https://example.com/image.jpg' },
      ];

      render(<MessageMedia media={media} />);

      const container = screen.getByRole('img').parentElement;
      expect(container).toHaveClass('rounded-lg');
      expect(container).toHaveClass('overflow-hidden');
      expect(container).toHaveClass('max-w-[200px]');
      expect(container).toHaveClass('space-y-1');
    });

    it('должен применять классы для изображений', () => {
      const media = [
        { url: 'https://example.com/image.jpg' },
      ];

      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toHaveClass('w-full');
      expect(img).toHaveClass('h-auto');
      expect(img).toHaveClass('rounded-lg');
    });
  });

  describe('Обработка ошибок', () => {
    it('должен скрывать изображение при ошибке загрузки', () => {
      const media = [
        { url: 'https://example.com/invalid.jpg' },
      ];

      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');

      // Симулируем ошибку загрузки
      img.dispatchEvent(new Event('error'));

      expect(img).toHaveStyle('display: none');
    });

    it('должен обрабатывать несколько изображений с ошибками', () => {
      const media = [
        { url: 'https://example.com/invalid1.jpg' },
        { url: 'https://example.com/valid.jpg' },
      ];

      render(<MessageMedia media={media} />);

      const images = screen.getAllByRole('img');

      // Симулируем ошибку на первом изображении
      images[0].dispatchEvent(new Event('error'));

      expect(images[0]).toHaveStyle('display: none');
      expect(images[1]).not.toHaveStyle('display: none');
    });
  });

  describe('Граничные случаи', () => {
    it('должен обрабатывать пустой URL', () => {
      const media = [
        { url: '' },
      ];

      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '');
    });

    it('должен обрабатывать очень длинный URL', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000) + '.jpg';
      const media = [
        { url: longUrl },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toHaveAttribute('src', longUrl);
    });

    it('должен обрабатывать URL с специальными символами', () => {
      const media = [
        { url: 'https://example.com/image%20with%20spaces.jpg' },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        'https://example.com/image%20with%20spaces.jpg'
      );
    });

    it('должен обрабатывать data: URL', () => {
      const media = [
        {
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});
