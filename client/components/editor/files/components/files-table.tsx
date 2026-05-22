/**
 * @fileoverview Таблица файлов с адаптивным отображением (таблица/карточки)
 * @module components/editor/files/components/files-table
 */

import { Image, Film, Music, FileText, Sticker, Copy, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/utils';
import type { ProjectFile, FileMediaType } from '../hooks/use-project-files';

/** Пропсы таблицы файлов */
interface FilesTableProps {
  /** Массив файлов для отображения */
  files: ProjectFile[];
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

/**
 * Таблица файлов — десктоп: таблица, мобильный: карточки
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function FilesTable({ files, selectedIds, onToggleSelect, onCopyFileId, onDelete }: FilesTableProps) {
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
              <th className="p-2 text-left font-medium">Название</th>
              <th className="p-2 text-left font-medium w-20">Тип</th>
              <th className="p-2 text-left font-medium">file_id</th>
              <th className="p-2 text-right font-medium w-20">Размер</th>
              <th className="p-2 text-left font-medium w-32">Дата</th>
              <th className="w-20 p-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {files.map((file) => (
              <FileRow key={file.id} file={file} selected={selectedIds.has(file.id)}
                onToggle={() => onToggleSelect(file.id)} onCopy={onCopyFileId} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобильный: карточки */}
      <div className="sm:hidden flex-1 overflow-auto p-3 space-y-2">
        {files.map((file) => (
          <FileCard key={file.id} file={file} selected={selectedIds.has(file.id)}
            onToggle={() => onToggleSelect(file.id)} onCopy={onCopyFileId} onDelete={onDelete} />
        ))}
      </div>
    </>
  );
}

/** Строка таблицы для одного файла */
function FileRow({ file, selected, onToggle, onCopy, onDelete }: {
  file: ProjectFile; selected: boolean; onToggle: () => void;
  onCopy: (id: string) => void; onDelete?: (id: number) => void;
}) {
  const Icon = MEDIA_ICONS[file.mediaType ?? ''] ?? FileText;
  return (
    <tr className={cn('hover:bg-muted/30 transition-colors', selected && 'bg-primary/5')}>
      <td className="p-2 text-center">
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </td>
      <td className="p-2">
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
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
      </td>
    </tr>
  );
}

/** Карточка файла для мобильного вида */
function FileCard({ file, selected, onToggle, onCopy, onDelete }: {
  file: ProjectFile; selected: boolean; onToggle: () => void;
  onCopy: (id: string) => void; onDelete?: (id: number) => void;
}) {
  const Icon = MEDIA_ICONS[file.mediaType ?? ''] ?? FileText;
  return (
    <div className={cn('rounded-xl border p-3 flex gap-3 items-start', selected && 'border-primary/50 bg-primary/5')}>
      <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
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
      <div className="flex gap-1 shrink-0">
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
