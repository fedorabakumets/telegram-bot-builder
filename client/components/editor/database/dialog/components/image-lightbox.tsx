/**
 * @fileoverview Компонент лайтбокса для просмотра изображений на весь экран
 * @module client/components/editor/database/dialog/components/image-lightbox
 */

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Свойства компонента лайтбокса
 */
interface ImageLightboxProps {
  /** URL изображения для отображения */
  src: string;
  /** Alt текст изображения */
  alt?: string;
  /** Колбэк закрытия лайтбокса */
  onClose: () => void;
}

/**
 * Лайтбокс для просмотра изображения на весь экран.
 * Закрывается по клику на фон, кнопку ✕ или клавишу Escape.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ImageLightbox({ src, alt = 'Изображение', onClose }: ImageLightboxProps) {
  /** Закрытие по Escape */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      {/* Кнопка закрытия */}
      <button
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Изображение — клик по нему не закрывает лайтбокс */}
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="lightbox-image"
      />
    </div>
  );
}
