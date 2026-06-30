/**
 * @fileoverview Чипы активных фильтров над таблицей `ActiveFilterChips`
 * (Req 6.8). Для каждого применённого фильтра (имя, дата, тип, сотрудник,
 * размер, хранилище) рендерит чип с крестиком для точечного снятия, плюс
 * кнопку «Сбросить всё». Подписи чипов строятся в active-filter-chips-labels.
 * Использует shadcn/ui Badge/Button и иконку lucide-react X (без эмодзи,
 * Req 13.2). Если активных фильтров нет — ничего не рендерит.
 * @module components/editor/files/panel/active-filter-chips
 */

import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FileFilters } from '../hooks/project-files-query-params';
import type { CollaboratorInfo } from '../hooks/use-project-collaborators';
import {
  buildActiveChips,
  type FilterKey,
  type StorageOption,
} from './active-filter-chips-labels';

/** Пропсы чипов активных фильтров */
export interface ActiveFilterChipsProps {
  /** Текущие фильтры */
  filters: FileFilters;
  /** Снять один фильтр по его ключам */
  onRemove: (keys: FilterKey[]) => void;
  /** Сбросить все фильтры */
  onResetAll: () => void;
  /** Коллабораторы для подписи «Сотрудник» (опционально) */
  collaborators?: CollaboratorInfo[];
  /** Хранилища для подписи «Хранилище» (опционально) */
  storages?: StorageOption[];
}

/**
 * Ряд чипов активных фильтров с точечным снятием и кнопкой «Сбросить всё».
 * @param props - Фильтры, колбэки снятия и справочники подписей
 * @returns JSX элемент с чипами или null, если активных фильтров нет
 */
export function ActiveFilterChips({
  filters,
  onRemove,
  onResetAll,
  collaborators = [],
  storages = [],
}: ActiveFilterChipsProps) {
  const chips = buildActiveChips(filters, collaborators, storages);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid="active-filter-chips">
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="secondary"
          className="gap-1 pl-2 pr-1"
          data-testid={`filter-chip-${chip.id}`}
        >
          <span className="truncate max-w-[16rem]">{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.keys)}
            className="rounded-sm p-0.5 hover:bg-background/60"
            aria-label={`Снять фильтр: ${chip.label}`}
            data-testid={`filter-chip-remove-${chip.id}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={onResetAll}
        data-testid="filters-reset-all"
      >
        Сбросить всё
      </Button>
    </div>
  );
}
