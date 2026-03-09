/**
 * @fileoverview Компонент для отображения видео с инструкцией
 *
 * Красивое отображение видео с кнопкой play.
 *
 * @module QrAuthVideo
 */

import { useState } from 'react';
import { Play } from 'lucide-react';

/**
 * Пропсы компонента QrAuthVideo
 */
export interface QrAuthVideoProps {
  /** Путь к видео файлу */
  src: string;
}

/**
 * Компонент для отображения видео с инструкцией
 *
 * @param {QrAuthVideoProps} props - Пропсы компонента
 * @returns {JSX.Element} Видео с инструкцией
 */
export function QrAuthVideo({ src }: QrAuthVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
      {!isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors z-10"
          type="button"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-amber-600 ml-1" fill="currentColor" />
          </div>
        </button>
      )}
      <video
        src={src}
        className="w-full h-full"
        controls={isPlaying}
        autoPlay={isPlaying}
        playsInline
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
