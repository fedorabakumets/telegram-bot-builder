/**
 * @fileoverview Превью вложения рассылки с сохранением сведений при ошибке загрузки.
 */
import { useState } from 'react';

/** Свойства отображаемого вложения. */
interface MediaPreviewContentProps {
  /** Адрес файла или прокси Telegram. */
  src: string;
  /** Тип содержимого вложения. */
  kind: 'photo' | 'video' | 'audio';
  /** Имя файла либо понятная подпись для Telegram file_id. */
  name: string;
}

/**
 * Показывает вложение и оставляет подпись, если содержимое недоступно.
 * @param props - Сведения о вложении.
 * @returns Превью с подписью и состоянием загрузки.
 */
export function MediaPreviewContent({ src, kind, name }: MediaPreviewContentProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  const label = kind === 'photo' ? 'Изображение' : kind === 'video' ? 'Видео' : 'Аудио';
  /** Запоминает ошибку только текущего адреса, не скрывая сведения о вложении. */
  const handleError = () => setFailedSrc(src);
  return (
    <figure className="min-w-0 max-w-xs space-y-1">
      {!failed && kind === 'photo' && (
        <img src={src} alt={name} className="max-h-40 max-w-full rounded-lg object-contain" onError={handleError} />
      )}
      {!failed && kind === 'video' && (
        <video src={src} controls preload="metadata" className="max-h-40 w-full rounded-lg" onError={handleError} />
      )}
      {!failed && kind === 'audio' && (
        <audio src={src} controls preload="metadata" className="w-full" onError={handleError} />
      )}
      <figcaption className="break-words text-xs text-muted-foreground">
        {label}: {name}
        {failed && <span role="status" className="block">Не удалось загрузить вложение. Оно сохранено в рассылке.</span>}
      </figcaption>
    </figure>
  );
}
