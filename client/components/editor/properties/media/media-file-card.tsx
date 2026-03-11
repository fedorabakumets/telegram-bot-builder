/**
 * @fileoverview Карточка медиафайла
 *
 * Отображает информацию о файле с кнопками просмотра и удаления.
 *
 * @module MediaFileCard
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, X } from "lucide-react";

/** Пропсы компонента MediaFileCard */
export interface MediaFileCardProps {
  url: string;
  fileName: string;
  fileType: string;
  description?: string;
  tags?: string[];
  onPreview?: () => void;
  onRemove?: () => void;
  isHidden?: boolean;
}

/** Иконка для типа файла */
const FILE_ICONS: Record<string, string> = {
  image: '',
  photo: '',
  video: '🎥',
  audio: '🎵',
  document: '📄',
  sticker: '📌'
};

/**
 * Компонент карточки медиафайла
 */
export function MediaFileCard({
  url,
  fileName,
  fileType,
  description,
  tags,
  onPreview,
  onRemove,
  isHidden = false
}: MediaFileCardProps) {
  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else if (fileType === 'image' || fileType === 'photo') {
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border p-3 sm:p-4 ${
      isHidden 
        ? 'border-gray-300/60 dark:border-gray-700/60 bg-gradient-to-br from-gray-100/50 to-gray-50/30 dark:from-gray-900/30 dark:to-gray-800/20 opacity-60' 
        : 'border-emerald-200/60 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/30 dark:to-green-900/20'
    }`}>
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {fileType === 'image' || fileType === 'photo' ? (
            <img src={url} alt={fileName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg sm:text-xl">{FILE_ICONS[fileType]}</span>
          )}
          {isHidden && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-xs text-white font-medium">Скрыт</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-xs sm:text-sm font-semibold truncate ${
              isHidden ? 'text-gray-700 dark:text-gray-300' : 'text-emerald-900 dark:text-emerald-100'
            }`}>{fileName}</p>
            {isHidden && (
              <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                Скрыт
              </Badge>
            )}
          </div>
          <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70 truncate mt-0.5">{fileType.toUpperCase()}</p>
          <p className="text-xs text-emerald-600/50 dark:text-emerald-400/50 truncate mt-1">{url}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {fileType === 'image' && !isHidden && (
            <Button size="sm" variant="ghost" onClick={handlePreview} className="h-8 w-8 p-0">
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </Button>
          )}
          {onRemove && (
            <Button size="sm" variant="ghost" onClick={onRemove} className="h-8 w-8 p-0">
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Details */}
      {(description || tags?.length) && (
        <div className="mt-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg p-2 border border-slate-200/40 dark:border-slate-800/40">
          {description && (
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <i className="fas fa-quote-left mr-2 text-slate-400"></i>
              {description}
            </p>
          )}
          {tags?.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs mr-1">
              <i className="fas fa-tag text-xs mr-1"></i>{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
