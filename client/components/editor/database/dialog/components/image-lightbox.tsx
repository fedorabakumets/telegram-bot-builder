/**
 * @fileoverview Компонент лайтбокса для просмотра изображений и видео на весь экран
 * @module client/components/editor/database/dialog/components/image-lightbox
 */

import { useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

/**
 * Свойства компонента лайтбокса
 */
interface ImageLightboxProps {
  /** URL медиафайла для отображения */
  src: string;
  /** Alt текст изображения */
  alt?: string;
  /** Тип медиа: 'image' или 'video'. По умолчанию 'image' */
  mediaType?: 'image' | 'video';
  /** Колбэк закрытия лайтбокса */
  onClose: () => void;
}

/**
 * Лайтбокс для просмотра изображения или видео на весь экран.
 * Использует модальный диалог с управлением фокусом и закрытием по Escape.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ImageLightbox({ src, alt = 'Изображение', mediaType = 'image', onClose }: ImageLightboxProps) {
  /** Элемент, открывший просмотр, для возврата клавиатурного фокуса. */
  const previousFocus = useRef(typeof document !== 'undefined' ? document.activeElement as HTMLElement | null : null);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-[94vw] border-0 bg-background p-8 shadow-none [&>button]:text-foreground"
        data-testid="lightbox-overlay"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          previousFocus.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Просмотр медиафайла</DialogTitle>
        <DialogDescription className="sr-only">{alt}</DialogDescription>
      {/* Медиа-контент — клик по нему не закрывает лайтбокс */}
      {mediaType === 'video' ? (
        <video
          src={src}
          controls
          playsInline
          className="mx-auto max-h-[80dvh] max-w-full rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          data-testid="lightbox-video"
        />
      ) : (
        <img
          src={src}
          alt={alt}
          className="mx-auto max-h-[80dvh] max-w-full rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          data-testid="lightbox-image"
        />
      )}
      </DialogContent>
    </Dialog>
  );
}
