/**
 * @fileoverview Информационный блок с метаданными медиа.
 * Показывает список переменных, которые будут созданы при включении saveMediaMetadata.
 */

import { MEDIA_METADATA_SUFFIXES } from './media-metadata-suffixes';

/** Пропсы компонента MediaMetadataInfo */
interface MediaMetadataInfoProps {
  /** Тип медиа: photo, video, audio, document */
  inputType: string;
  /** Имя базовой переменной */
  variableName: string;
}

/**
 * Информационный блок с именами переменных метаданных медиа.
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function MediaMetadataInfo({ inputType, variableName }: MediaMetadataInfoProps) {
  const suffixes = MEDIA_METADATA_SUFFIXES[inputType] || [];
  const baseName = variableName || 'variable';

  return (
    <div className="rounded-lg border border-cyan-200/60 dark:border-cyan-700/40 bg-gradient-to-br from-cyan-50/30 to-sky-50/20 dark:from-cyan-950/20 dark:to-sky-900/10 p-3 space-y-2">
      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
        Будут созданы переменные:
      </p>
      <div className="space-y-1.5">
        {suffixes.map(({ suffix, description, icon }) => (
          <div key={suffix} className="flex items-center gap-2 text-xs">
            <span className="shrink-0">{icon}</span>
            <code className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
              {baseName}_{suffix}
            </code>
            <span className="text-slate-400 dark:text-slate-500">—</span>
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
