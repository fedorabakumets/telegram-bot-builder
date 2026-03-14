/**
 * @fileoverview Тесты для компонента MessageMedia
 * Проверяет отображение медиафайлов в сообщениях
 * @module tests/components/message-media.test
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
          id: 1,
          url: 'https://example.com/image1.jpg',
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(img).toHaveAttribute('alt', 'Photo');
    });

    it('должен рендерить несколько изображений', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/image1.jpg',
          type: 'photo',
        },
        {
          id: 2,
          url: 'https://example.com/image2.jpg',
          type: 'photo',
        },
        {
          id: 3,
          url: 'https://example.com/image3.jpg',
          type: 'photo',
        },
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
          id: 1,
          url: 'https://example.com/image.jpg',
          type: 'photo',
          messageId: 123,
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByTestId('dialog-photo-123-0')).toBeInTheDocument();
    });

    it('должен использовать idx если messageId не указан', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/image.jpg',
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByTestId('dialog-photo-undefined-0')).toBeInTheDocument();
    });
  });

  describe('Стили и классы', () => {
    it('должен применять классы для контейнера', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/image.jpg',
          type: 'photo',
        },
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
        {
          id: 1,
          url: 'https://example.com/image.jpg',
          type: 'photo',
        },
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
        {
          id: 1,
          url: 'https://example.com/invalid.jpg',
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      
      // Симулируем ошибку загрузки
      img.dispatchEvent(new Event('error'));

      expect(img).toHaveStyle('display: none');
    });

    it('должен обрабатывать несколько изображений с ошибками', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/invalid1.jpg',
          type: 'photo',
        },
        {
          id: 2,
          url: 'https://example.com/valid.jpg',
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      const images = screen.getAllByRole('img');
      
      // Симулируем ошибку на первом изображении
      images[0].dispatchEvent(new Event('error'));

      expect(images[0]).toHaveStyle('display: none');
      expect(images[1]).not.toHaveStyle('display: none');
    });
  });

  describe('Разные типы медиа', () => {
    it('должен рендерить фото с type: photo', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/photo.jpg',
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('должен рендерить изображение с type: image', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/image.png',
          type: 'image',
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('должен рендерить изображение с type: picture', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/picture.jpeg',
          type: 'picture',
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Медиа с дополнительными свойствами', () => {
    it('должен рендерить изображение с width и height', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/image.jpg',
          type: 'photo',
          width: 800,
          height: 600,
        },
      ];

      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      // width и height не используются в компоненте, но он должен рендериться
    });

    it('должен рендерить изображение без width и height', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/image.jpg',
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Производительность и ключи', () => {
    it('должен использовать уникальный key для каждого изображения', () => {
      const media = [
        { id: 1, url: 'https://example.com/1.jpg', type: 'photo' },
        { id: 2, url: 'https://example.com/2.jpg', type: 'photo' },
        { id: 3, url: 'https://example.com/3.jpg', type: 'photo' },
      ];

      const { container } = render(<MessageMedia media={media} />);

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(3);
      
      // Проверяем что у каждого изображения свой key (через data-testid)
      expect(screen.getByTestId('dialog-photo-undefined-0')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-photo-undefined-1')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-photo-undefined-2')).toBeInTheDocument();
    });
  });

  describe('Граничные случаи', () => {
    it('должен обрабатывать пустой URL', () => {
      const media = [
        {
          id: 1,
          url: '',
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '');
    });

    it('должен обрабатывать очень длинный URL', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000) + '.jpg';
      const media = [
        {
          id: 1,
          url: longUrl,
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toHaveAttribute('src', longUrl);
    });

    it('должен обрабатывать URL с специальными символами', () => {
      const media = [
        {
          id: 1,
          url: 'https://example.com/image%20with%20spaces.jpg',
          type: 'photo',
        },
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
          id: 1,
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          type: 'photo',
        },
      ];

      render(<MessageMedia media={media} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});
