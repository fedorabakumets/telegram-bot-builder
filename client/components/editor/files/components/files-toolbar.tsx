/**
 * @fileoverview Панель фильтров для вкладки файлов — табы источника + фильтр типа
 * @module components/editor/files/components/files-toolbar
 */

import { Inbox, Send, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/utils';
import type { FileSource, FileMediaType } from '../hooks/use-project-files';

/** Пропсы тулбара */
interface FilesToolbarProps {
  /** Текущий источник */
  source: FileSource;
  /** Обработчик смены источника */
  onSourceChange: (source: FileSource) => void;
  /** Текущий фильтр типа медиа */
  mediaType?: FileMediaType;
  /** Обработчик смены типа */
  onMediaTypeChange: (type: FileMediaType | undefined) => void;
  /** Общее количество файлов */
  total: number;
  /** Загрузка данных */
  isLoading: boolean;
}

/** Конфигурация табов источника */
const SOURCE_TABS: Array<{ value: FileSource; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'incoming', label: 'Входящие', icon: Inbox },
  { value: 'outgoing', label: 'Исходящие', icon: Send },
  { value: 'uploaded', label: 'Загруженные', icon: Upload },
];

/** Типы медиа для фильтра */
const MEDIA_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Все типы' },
  { value: 'photo', label: 'Фото' },
  { value: 'video', label: 'Видео' },
  { value: 'audio', label: 'Аудио' },
  { value: 'document', label: 'Документы' },
  { value: 'sticker', label: 'Стикеры' },
];

/**
 * Тулбар с табами источника и фильтром типа медиа
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function FilesToolbar({ source, onSourceChange, mediaType, onMediaTypeChange, total, isLoading }: FilesToolbarProps) {
  return (
    <div className="px-3 sm:px-4 py-2 border-b flex flex-wrap items-center gap-2">
      {/* Табы источника */}
      <div className="flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
        {SOURCE_TABS.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant="ghost"
            size="sm"
            onClick={() => onSourceChange(value)}
            className={cn(
              'h-7 px-2.5 text-xs gap-1.5 rounded-md',
              source === value
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
      </div>

      {/* Фильтр типа */}
      <Select value={mediaType ?? 'all'} onValueChange={(v) => onMediaTypeChange(v === 'all' ? undefined : v as FileMediaType)}>
        <SelectTrigger className="h-7 w-[120px] text-xs border-border/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MEDIA_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Счётчик */}
      <span className="ml-auto text-xs text-muted-foreground">
        {isLoading ? 'Загрузка…' : `${total} файлов`}
      </span>
    </div>
  );
}
