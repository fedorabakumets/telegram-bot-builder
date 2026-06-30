/**
 * @fileoverview Временная карточка файла (узкие экраны) — каркасный плейсхолдер
 * компактного/карточного режима таблицы (Req 7.8, 13.3). Показывает превью+имя,
 * тип, размер, дату, хранилище, сотрудника и действия. TODO(task 7.3): вынести
 * ячейки (превью+имя, file_id, сотрудник, хранилище, использования).
 * @module components/editor/files/panel/table/file-card-placeholder
 */

import { FileText, Copy, Trash2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/utils';
import type { FileRowProps } from './file-row';
import {
  MEDIA_ICONS, MEDIA_TYPE_LABELS, getSizeColor, formatSize, formatDate,
  getPreviewUrl, shouldShowPreview,
} from './files-table-utils';
import { getDownloadHref } from './file-download';

/**
 * Каркасная карточка файла (узкий экран). Будет заменена в задаче 7.3.
 * @param props - Свойства карточки (совпадают со строкой таблицы `FileRow`)
 * @returns JSX элемент карточки
 */
export function FileCardPlaceholder({
  file, projectId, selected, selectedTokenId, onToggle, onCopy, onDelete, collaborators,
}: FileRowProps) {
  const Icon = MEDIA_ICONS[file.mediaType ?? ''] ?? FileText;
  const previewUrl = getPreviewUrl(file, projectId);
  const showThumb = shouldShowPreview(file) && previewUrl;
  const uploader = collaborators.find((c) => c.userId === file.uploadedBy);
  /** Ссылка скачивания: прямой url либо прокси по file_id; null = недоступно (Req 15.4) */
  const downloadHref = getDownloadHref(file, projectId, selectedTokenId);

  return (
    <div className={cn('rounded-xl border p-3 flex gap-3 items-start', selected && 'border-primary/50 bg-primary/5')}>
      <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {showThumb ? (
          <img src={previewUrl!} alt="" className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-medium truncate">{file.fileName ?? '—'}</p>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground items-center">
          <Badge variant="secondary" className="text-[10px]">{MEDIA_TYPE_LABELS[file.mediaType ?? ''] ?? file.mediaType ?? '?'}</Badge>
          <span className={getSizeColor(file.fileSize)}>{formatSize(file.fileSize)}</span>
          <span>{formatDate(file.createdAt)}</span>
          <Badge variant="outline" className="text-[10px]">{file.storageName ?? file.storageBackend ?? 'local'}</Badge>
          {/* ID + сотрудник */}
          <span>ID {file.id}</span>
          <span className="truncate max-w-[90px]">{uploader?.name ?? '—'}</span>
        </div>
        {file.fileId && (
          <p className="font-mono text-[10px] text-muted-foreground truncate">{file.fileId.slice(0, 24)}…</p>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {downloadHref ? (
          <a href={downloadHref} download={file.fileName ?? 'file'}>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Скачать"><Download className="h-3 w-3" /></Button>
          </a>
        ) : (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/40" disabled title="Только file_id — прямое скачивание недоступно">
            <Download className="h-3 w-3" />
          </Button>
        )}
        {file.fileId && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCopy(file.fileId!)} title="Копировать file_id">
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(file.id)} title="Удалить">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
