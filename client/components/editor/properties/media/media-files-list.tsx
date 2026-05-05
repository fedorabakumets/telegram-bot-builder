/**
 * @fileoverview Список медиафайлов
 * 
 * Отображает несколько прикреплённых файлов с возможностью удаления.
 *
 * @module MediaFilesList
 */

import { MediaFileCard } from "./media-file-card";

/** Данные медиафайла */
export interface MediaFileData {
  /** URL файла */
  url: string;
  /** Имя файла */
  fileName: string;
  /** Тип файла */
  fileType: string;
  /** Описание файла */
  description?: string;
  /** Теги файла */
  tags?: string[];
  /** Кэшированный Telegram file_id (появляется после первой отправки ботом) */
  telegramFileId?: string | null;
  /** Маппинг tokenId → file_id для JSON file_id записей */
  fileIdsByToken?: Record<string, string>;
  /** Флаг скрытого файла */
  isHidden?: boolean;
  /** ID видеофайла в БД (нужен для установки обложки) */
  mediaFileId?: number;
  /** ID текущей обложки */
  thumbnailMediaId?: number | null;
  /** URL текущей обложки */
  thumbnailUrl?: string | null;
  /** Прямой URL обложки (из поля thumbnailUrl) */
  thumbnailDirectUrl?: string | null;
  /** ID проекта (нужен для загрузки фото для выбора обложки) */
  projectId?: number;
}

/** Пропсы списка файлов */
export interface MediaFilesListProps {
  files: MediaFileData[];
  onRemove: (index: number) => void;
  isHidden?: (index: number) => boolean;
  /** Callback при установке/сбросе обложки — передаёт URL видео и URL обложки */
  onThumbnailSet?: (videoUrl: string, thumbnailUrl: string | null) => void;
}

/**
 * Компонент списка медиафайлов
 */
export function MediaFilesList({ files, onRemove, isHidden, onThumbnailSet }: MediaFilesListProps) {
  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <MediaFileCard
          key={file.url + index}
          {...file}
          onRemove={() => onRemove(index)}
          isHidden={isHidden?.(index) ?? file.isHidden ?? false}
          onThumbnailSet={onThumbnailSet}
        />
      ))}
    </div>
  );
}
