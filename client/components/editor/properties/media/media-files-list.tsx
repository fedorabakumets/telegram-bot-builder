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
  url: string;
  fileName: string;
  fileType: string;
  description?: string;
  tags?: string[];
  isHidden?: boolean;
}

/** Пропсы списка файлов */
export interface MediaFilesListProps {
  files: MediaFileData[];
  onRemove: (index: number) => void;
  isHidden?: (index: number) => boolean;
}

/**
 * Компонент списка медиафайлов
 */
export function MediaFilesList({ files, onRemove, isHidden }: MediaFilesListProps) {
  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <MediaFileCard
          key={file.url + index}
          {...file}
          onRemove={() => onRemove(index)}
          isHidden={isHidden?.(index) ?? file.isHidden ?? false}
        />
      ))}
    </div>
  );
}
