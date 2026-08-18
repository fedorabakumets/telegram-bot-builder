/**
 * @fileoverview Обёртка блока ввода Telegram file_id с кнопкой закрытия.
 * @module client/components/editor/properties/components/media-file/file-id-input-panel
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIdInput } from '../../media/file-id-input';

/** Тип медиа для file_id */
type MediaType = 'photo' | 'video' | 'audio' | 'document';

/** Пропсы панели ввода file_id */
export interface FileIdInputPanelProps {
  /** ID проекта для загрузки токенов */
  projectId: number;
  /** Выбранный тип медиа */
  mediaType: MediaType;
  /** Смена типа медиа */
  onMediaTypeChange: (type: MediaType) => void;
  /** Добавить JSON-запись в attachedMedia */
  onAdd: (entry: string) => void;
  /** Закрыть панель */
  onClose: () => void;
}

/**
 * Фиолетовый блок ввода file_id с крестиком в шапке.
 * @param props - Проект, тип медиа и колбэки
 * @returns JSX панели
 */
export function FileIdInputPanel({
  projectId,
  mediaType,
  onMediaTypeChange,
  onAdd,
  onClose,
}: FileIdInputPanelProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-violet-200/60 dark:border-violet-700/60 bg-violet-50/30 dark:bg-violet-900/10 p-3">
      <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-3 flex items-center justify-between rounded-t-lg border-b border-violet-200/60 bg-violet-100/90 px-2 py-1 dark:border-violet-700/60 dark:bg-violet-950/90">
        <span className="truncate px-1 text-xs font-medium text-violet-800 dark:text-violet-200">
          Telegram file_id
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-violet-800 hover:bg-violet-200/80 hover:text-violet-950 dark:text-violet-200 dark:hover:bg-violet-800/60 dark:hover:text-white"
          onClick={onClose}
          title="Закрыть"
          aria-label="Закрыть ввод file_id"
          data-testid="file-id-input-close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <FileIdInput
        projectId={projectId}
        mediaType={mediaType}
        onMediaTypeChange={onMediaTypeChange}
        onAdd={onAdd}
      />
    </div>
  );
}
