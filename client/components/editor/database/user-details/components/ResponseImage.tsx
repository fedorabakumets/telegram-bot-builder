/**
 * @fileoverview Компонент изображения ответа
 * @description Отображает фото или медиа из ответа пользователя
 */

import React from 'react';

/**
 * @interface ResponseImageProps
 * @description Свойства компонента изображения
 */
interface ResponseImageProps {
  /** URL изображения */
  src: string;
  /** Альтернативный текст */
  alt: string;
}

/**
 * Компонент изображения с обработкой ошибок
 * @param {ResponseImageProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент изображения
 */
export function ResponseImage({ src, alt }: ResponseImageProps): React.JSX.Element {
  return (
    <div className="rounded-lg overflow-hidden max-w-[150px]">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto rounded-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}
