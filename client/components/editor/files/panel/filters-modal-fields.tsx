/**
 * @fileoverview Поля модалки фильтров `FiltersModalFields` (Req 6.2–6.7).
 * Композирует секции черновика фильтров: поиск по имени (внутри модалки),
 * диапазон дат, тип медиа Telegram + обложка, селектор «Сотрудник» с аватарами,
 * селектор «Хранилище» и фильтр размера. Date/Size реализованы выделенными
 * виджетами FiltersDateRange (filters-date-range.tsx) и FiltersSizeRange
 * (filters-size-range.tsx).
 * @module components/editor/files/panel/filters-modal-fields
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FileFilters } from '../hooks/project-files-query-params';
import type { CollaboratorInfo } from '../hooks/use-project-collaborators';
import type { StorageOption } from './active-filter-chips-labels';
import { MEDIA_TYPE_OPTIONS } from './filters-modal-validation';
import { FiltersDateRange } from './filters-date-range';
import { FiltersSizeRange } from './filters-size-range';

/** Пропсы полей модалки фильтров */
export interface FiltersModalFieldsProps {
  /** Черновик фильтров */
  draft: FileFilters;
  /** Частичное обновление черновика */
  onChange: (patch: Partial<FileFilters>) => void;
  /** Коллабораторы для селектора «Сотрудник» (Req 6.5) */
  collaborators: CollaboratorInfo[];
  /** Хранилища для селектора «Хранилище» (Req 6.6) */
  storages: StorageOption[];
}

/**
 * Секции полей модалки фильтров файлов.
 * @param props - Черновик, обработчик изменения и справочники
 * @returns JSX элемент с полями фильтров
 */
export function FiltersModalFields({ draft, onChange, collaborators, storages }: FiltersModalFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Поиск по названию файла — внутри модалки, не отдельной строкой (Req 6.2) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Название файла</Label>
        <Input
          value={draft.fileName ?? ''}
          onChange={(e) => onChange({ fileName: e.target.value })}
          placeholder="Поиск по имени"
          className="h-8"
          data-testid="filters-file-name"
        />
      </div>

      {/* Диапазон дат «от-до» (Req 6.3) */}
      <FiltersDateRange
        dateFrom={draft.dateFrom}
        dateTo={draft.dateTo}
        onChange={(dateFrom, dateTo) => onChange({ dateFrom, dateTo })}
      />

      {/* Тип медиа Telegram + обложка (Req 6.4) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Тип файла</Label>
        <Select
          value={draft.mediaType ?? 'all'}
          onValueChange={(v) => onChange({ mediaType: v as FileFilters['mediaType'] })}
        >
          <SelectTrigger className="h-8" data-testid="filters-media-type">
            <SelectValue placeholder="Все типы" />
          </SelectTrigger>
          <SelectContent>
            {MEDIA_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Сотрудник: выпадающий список коллабораторов с аватарами (Req 6.5) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Сотрудник</Label>
        <Select
          value={draft.uploadedBy !== undefined ? String(draft.uploadedBy) : 'all'}
          onValueChange={(v) => onChange({ uploadedBy: v === 'all' ? undefined : Number(v) })}
        >
          <SelectTrigger className="h-8" data-testid="filters-uploaded-by">
            <SelectValue placeholder="Все сотрудники" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сотрудники</SelectItem>
            {collaborators.map((c) => (
              <SelectItem key={c.userId} value={String(c.userId)}>
                <span className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    {c.photoUrl ? <AvatarImage src={c.photoUrl} alt={c.name} /> : null}
                    <AvatarFallback className="text-[10px]">{c.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Хранилище: все / конкретный local / конкретный S3 (Req 6.6) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Хранилище</Label>
        <Select
          value={draft.storageConfigId ?? 'all'}
          onValueChange={(v) => onChange({ storageConfigId: v })}
        >
          <SelectTrigger className="h-8" data-testid="filters-storage">
            <SelectValue placeholder="Все хранилища" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все хранилища</SelectItem>
            {storages.map((st) => (
              <SelectItem key={st.id} value={st.id}>
                {st.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Размер: Мин—Макс + единица KB/MB (Req 6.7) */}
      <FiltersSizeRange
        sizeMin={draft.sizeMin}
        sizeMax={draft.sizeMax}
        sizeUnit={draft.sizeUnit}
        onChange={(patch) => onChange(patch)}
      />
    </div>
  );
}
