/**
 * @fileoverview Таблица файлов с адаптивным отображением (таблица/карточки)
 * @module components/editor/files/components/files-table
 */

import { useState } from 'react';
import { Image, Film, Music, FileText, Sticker, Copy, Trash2, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/utils';
import type { ProjectFile, FileMediaType } from '../hooks/use-project-files';

/** Пропсы таблицы файлов */
interface FilesTableProps {
  /** Массив файлов для отображения */
  files: ProjectFile[];
  /** ID проекта для проксирования превью */
  projectId: number;
  /** Выбранные ID файлов */
  selectedIds: Set<number>;
  /** Обработчик выбора/снятия файла */
  onToggleSelect: (id: number) => void;
  /** Обработчик копирования file_id */
  onCopyFileId: (fileId: string) => void;
  /** Обработчик удаления файла */
  onDelete?: (id: number) => void;
}

/** Иконка по типу медиа */
const MEDIA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  photo: Image, video: Film, audio: Music, voice: Music,
  document: FileText, sticker: Sticker,
};

/** Цвет бейджа размера */
function getSizeColor(size: number | null): string {
  if (!size) return 'text-muted-foreground';
  if (size < 1_048_576) return 'text-green-500';
  if (size < 10_485_760) return 'text-yellow-500';
  if (size < 52_428_800) return 'text-orange-500';
  return 'text-red-500';
}

/** Форматирование размера файла */
function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/** Форматирование даты */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

/** Строит URL превью для файла */
function getPreviewUrl(file: ProjectFile, projectId: number): string | null {
  // Для загруженных файлов с локальным URL
  if (file.url && !file.url.startsWith('{')) return file.url;
  // Для файлов с file_id — проксирование через Telegram
  if (file.fileId && file.tokenId) {
    return `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(file.fileId)}&tokenId=${file.tokenId}`;
  }
  if (file.fileId) {
    return `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(file.fileId)}`;
  }
  return null;
}

/** Типы медиа для которых показываем миниатюру */
const PREVIEW_TYPES = new Set(['photo', 'video', 'sticker', 'animation']);

/** Расширения файлов которые являются изображениями/видео (для document с расширением) */
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'avi', 'mov', 'webm', 'mkv']);

/** Определяет, нужно ли показывать превью для файла */
function shouldShowPreview(file: ProjectFile): boolean {
  if (PREVIEW_TYPES.has(file.mediaType ?? '')) return true;
  // Проверяем расширение для документов (mp4 может быть сохранён как document)
  const ext = file.fileName?.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);
}

/** Определяет тип медиа для лайтбокса */
function getLightboxType(file: ProjectFile): 'image' | 'video' {
  if (file.mediaType === 'video' || file.mediaType === 'animation') return 'video';
  const ext = file.fileName?.split('.').pop()?.toLowerCase() ?? '';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return 'image';
}

/**
 * Таблица файлов — десктоп: таблица, мобильный: карточки
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function FilesTable({ files, projectId, selectedIds, onToggleSelect, onCopyFileId, onDelete }: FilesTableProps) {
  /** Индекс файла в лайтбоксе (null = закрыт) */
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  /** Список файлов с превью для навигации в лайтбоксе */
  const previewableFiles = files
    .map((file, idx) => ({ file, idx, url: getPreviewUrl(file, projectId) }))
    .filter(({ file, url }) => shouldShowPreview(file) && url);

  /** Открыть лайтбокс для конкретного файла */
  const openLightbox = (fileId: number) => {
    const idx = previewableFiles.findIndex(({ file }) => file.id === fileId);
    if (idx >= 0) setLightboxIndex(idx);
  };

  /** Навигация в лайтбоксе */
  const goPrev = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () => setLightboxIndex((i) => (i !== null && i < previewableFiles.length - 1 ? i + 1 : i));

  const currentLightbox = lightboxIndex !== null ? previewableFiles[lightboxIndex] : null;

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Файлы не найдены</p>
      </div>
    );
  }

  return (
    <>
      {/* Десктоп: таблица */}
      <div className="hidden sm:block flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/60 border-b">
            <tr>
              <th className="w-8 p-2"><span className="sr-only">Выбрать</span></th>
              <th className="w-10 p-2"></th>
              <th className="p-2 text-left font-medium">Название файла</th>
              <th className="p-2 text-left font-medium w-20">Тип</th>
              <th className="p-2 text-left font-medium">file_id</th>
              <th className="p-2 text-right font-medium w-20">Размер</th>
              <th className="p-2 text-left font-medium w-32">Дата загрузки</th>
              <th className="w-24 p-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {files.map((file) => (
              <FileRow key={file.id} file={file} projectId={projectId} selected={selectedIds.has(file.id)}
                onToggle={() => onToggleSelect(file.id)} onCopy={onCopyFileId} onDelete={onDelete}
                onPreviewClick={() => openLightbox(file.id)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобильный: карточки */}
      <div className="sm:hidden flex-1 overflow-auto p-3 space-y-2">
        {files.map((file) => (
          <FileCard key={file.id} file={file} projectId={projectId} selected={selectedIds.has(file.id)}
            onToggle={() => onToggleSelect(file.id)} onCopy={onCopyFileId} onDelete={onDelete}
            onPreviewClick={() => openLightbox(file.id)} />
        ))}
      </div>

      {/* Лайтбокс с навигацией */}
      {currentLightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxIndex(null)}>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10" onClick={() => setLightboxIndex(null)}>
            <X className="h-6 w-6" />
          </Button>

          {/* Стрелка влево */}
          {lightboxIndex !== null && lightboxIndex > 0 && (
            <Button variant="ghost" size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}>
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Стрелка вправо */}
          {lightboxIndex !== null && lightboxIndex < previewableFiles.length - 1 && (
            <Button variant="ghost" size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => { e.stopPropagation(); goNext(); }}>
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Контент */}
          <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {getLightboxType(currentLightbox.file) === 'video' ? (
              <video key={currentLightbox.url} src={currentLightbox.url!} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg" />
            ) : (
              <img src={currentLightbox.url!} alt="Превью" className="max-w-full max-h-[80vh] rounded-lg object-contain" />
            )}
            <p className="text-white/70 text-xs text-center truncate max-w-[80vw]">
              {currentLightbox.file.fileName ?? '—'} • {lightboxIndex! + 1}/{previewableFiles.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/** Строка таблицы для одного файла */
function FileRow({ file, projectId, selected, onToggle, onCopy, onDelete, onPreviewClick }: {
  file: ProjectFile; projectId: number; selected: boolean; onToggle: () => void;
  onCopy: (id: string) => void; onDelete?: (id: number) => void;
  onPreviewClick: () => void;
}) {
  const Icon = MEDIA_ICONS[file.mediaType ?? ''] ?? FileText;
  const previewUrl = getPreviewUrl(file, projectId);
  const showThumbnail = shouldShowPreview(file) && previewUrl;
  return (
    <tr className={cn('hover:bg-muted/30 transition-colors', selected && 'bg-primary/5')}>
      <td className="p-2 text-center">
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </td>
      <td className="p-2">
        <div
          className={cn('w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden', showThumbnail && 'cursor-pointer hover:ring-2 hover:ring-primary/50')}
          onClick={() => showThumbnail && onPreviewClick()}
        >
          {showThumbnail ? (
            <img src={previewUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <Icon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </td>
      <td className="p-2 max-w-[180px] truncate">{file.fileName ?? '—'}</td>
      <td className="p-2">
        <Badge variant="secondary" className="text-[10px]">{file.mediaType ?? '?'}</Badge>
      </td>
      <td className="p-2 max-w-[140px]">
        {file.fileId ? (
          <span className="font-mono text-[10px] truncate block">{file.fileId.slice(0, 20)}…</span>
        ) : '—'}
      </td>
      <td className={cn('p-2 text-right font-mono', getSizeColor(file.fileSize))}>
        {formatSize(file.fileSize)}
      </td>
      <td className="p-2 text-muted-foreground">{formatDate(file.createdAt)}</td>
      <td className="p-2">
        <div className="flex gap-1">
          {previewUrl && (
            <a href={previewUrl} download={file.fileName ?? 'file'} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Скачать">
                <Download className="h-3 w-3" />
              </Button>
            </a>
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
      </td>
    </tr>
  );
}

/** Карточка файла для мобильного вида */
function FileCard({ file, projectId, selected, onToggle, onCopy, onDelete, onPreviewClick }: {
  file: ProjectFile; projectId: number; selected: boolean; onToggle: () => void;
  onCopy: (id: string) => void; onDelete?: (id: number) => void;
  onPreviewClick: () => void;
}) {
  const Icon = MEDIA_ICONS[file.mediaType ?? ''] ?? FileText;
  const previewUrl = getPreviewUrl(file, projectId);
  const showThumbnail = shouldShowPreview(file) && previewUrl;
  return (
    <div className={cn('rounded-xl border p-3 flex gap-3 items-start', selected && 'border-primary/50 bg-primary/5')}>
      <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
      <div
        className={cn('w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden', showThumbnail && 'cursor-pointer hover:ring-2 hover:ring-primary/50')}
        onClick={() => showThumbnail && onPreviewClick()}
      >
        {showThumbnail ? (
          <img src={previewUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-medium truncate">{file.fileName ?? '—'}</p>
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          <Badge variant="secondary" className="text-[10px]">{file.mediaType ?? '?'}</Badge>
          <span className={getSizeColor(file.fileSize)}>{formatSize(file.fileSize)}</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
        {file.fileId && (
          <p className="font-mono text-[10px] text-muted-foreground truncate">{file.fileId.slice(0, 24)}…</p>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {previewUrl && (
          <a href={previewUrl} download={file.fileName ?? 'file'} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Скачать">
              <Download className="h-3 w-3" />
            </Button>
          </a>
        )}
        {file.fileId && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCopy(file.fileId!)}>
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(file.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
