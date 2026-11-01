/**
 * @fileoverview Адаптивная карточка файла с читаемым именем и раскрываемыми сведениями.
 * @module components/editor/files/panel/table/file-card-placeholder
 */
import { FileSize } from './file-size';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/utils';
import type { FileRowProps } from './file-row';
import { MEDIA_TYPE_LABELS, formatDate, getPreviewUrl, shouldShowPreview } from './files-table-utils';
import { getDownloadHref } from './file-download';
import { MediaThumbnail } from './media-thumbnail';
import { FileCardDetails } from './file-card-details';
import { FileDeleteConfirm } from './file-delete-confirm';


/**
 * Показывает файл без наложения столбцов в узкой рабочей области.
 * @param props - Данные файла, выбор и доступные действия
 * @returns Карточка файла с дополнительными сведениями
 */
export function FileCardPlaceholder({
  file, projectId, selected, selectedTokenId, onToggle, onCopy, onDelete,
  collaborators, allSheets, onGoToNode, onPreviewClick,
}: FileRowProps) {
  const previewUrl = getPreviewUrl(file, projectId);
  const downloadHref = getDownloadHref(file, projectId, selectedTokenId);

  const name = file.fileName ?? `Файл ${file.id}`;
  return (
    <article className={cn('files-file-card rounded-xl border p-4 space-y-4', selected && 'files-file-card-selected')} aria-label={name}>
      <div className="files-card-heading flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1 h-5 w-5 shrink-0" aria-label={`Выбрать ${name}`} />
        <button type="button" onClick={onPreviewClick} disabled={!shouldShowPreview(file) || !previewUrl} aria-label={`Открыть превью ${name}`} title="Открыть на весь экран" className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <MediaThumbnail file={file} projectId={projectId} />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{name}</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{MEDIA_TYPE_LABELS[file.mediaType ?? ''] ?? 'Файл'}</span>
            <FileSize file={file} projectId={projectId} />
            <span className="text-xs self-center">{formatDate(file.createdAt)}</span>
          </p>
        </div>
      </div>
      <div className="files-card-actions flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="files-card-buttons flex items-center gap-2">
          {downloadHref ? (
            <Button variant="ghost" size="icon" asChild>
              <a href={downloadHref} download={name} aria-label={`Скачать ${name}`} title="Скачать файл"><Download className="h-4 w-4" /></a>
            </Button>
          ) : <Button variant="outline" size="sm" disabled>Скачивание недоступно</Button>}
          {onDelete && <FileDeleteConfirm id={file.id} name={name} onDelete={onDelete}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Удалить ${name}`} title="Удалить файл"><Trash2 className="h-4 w-4" /></Button></FileDeleteConfirm>}
        </div>
      </div>
      <FileCardDetails file={file} projectId={projectId} selectedTokenId={selectedTokenId} collaborators={collaborators} allSheets={allSheets} onGoToNode={onGoToNode} selected={selected} onToggle={onToggle} onCopy={onCopy} />
    </article>
  );
}
