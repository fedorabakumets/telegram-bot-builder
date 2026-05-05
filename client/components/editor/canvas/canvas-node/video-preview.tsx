/**
 * @fileoverview Компонент превью видео с нативным плеером браузера
 *
 * Отображает видео с нативными контролами: прогресс-бар, громкость,
 * скорость воспроизведения, полноэкранный режим.
 *
 * @module canvas-node/video-preview
 */

/** Пропсы компонента VideoPreview */
interface VideoPreviewProps {
  /** URL видеофайла */
  src: string;
  /** Дополнительные CSS-классы для обёртки */
  className?: string;
}

/**
 * Компонент превью видео с нативными контролами браузера.
 * Поддерживает воспроизведение, перемотку, громкость, скорость и полноэкранный режим.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент с видео-плеером
 */
export function VideoPreview({ src, className }: VideoPreviewProps) {
  return (
    <div className={className}>
      <video
        src={`${src}#t=0.1`}
        className="w-full h-auto max-h-48 object-cover"
        controls
        preload="metadata"
        onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
      />
    </div>
  );
}
