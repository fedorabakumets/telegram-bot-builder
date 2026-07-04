/**
 * @fileoverview Модалка фильтров файлов `FiltersModal` (Req 6.2–6.7, 6.9).
 * Держит локальный черновик фильтров, инициализируемый из `value` при открытии;
 * по «Применить» вызывает onApply(draft) (кнопка активна только при валидном
 * черновике, Req 6.9), по «Сбросить фильтр» — onReset. Опции хранилища берёт из
 * useStorageConfigs (Req 6.6). Поля вынесены в FiltersModalFields; на shadcn/ui
 * Dialog/Button с иконками lucide-react без декоративных эмодзи (Req 13.2).
 * @module components/editor/files/panel/filters-modal
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FileFilters } from '../hooks/project-files-query-params';
import type { CollaboratorInfo } from '../hooks/use-project-collaborators';
import { useStorageConfigs } from '../hooks/use-storage-configs';
import type { StorageOption } from './active-filter-chips-labels';
import { FiltersModalFields } from './filters-modal-fields';
import { isFiltersValid } from './filters-modal-validation';

/** Пропсы модалки фильтров */
export interface FiltersModalProps {
  /** Открыта ли модалка */
  open: boolean;
  /** Текущие применённые фильтры (источник черновика) */
  value: FileFilters;
  /** Применить фильтры (только при валидном черновике) */
  onApply: (filters: FileFilters) => void;
  /** Сбросить все фильтры */
  onReset: () => void;
  /** Закрыть без применения */
  onOpenChange: (open: boolean) => void;
  /** Список коллабораторов для селектора «Сотрудник» (Req 6.5) */
  collaborators: CollaboratorInfo[];
}

/**
 * Модалка фильтров файлов с локальным черновиком и валидацией (Req 6.2–6.9).
 * @param props - Состояние открытия, текущие фильтры, колбэки и коллабораторы
 * @returns JSX элемент модалки фильтров
 */
export function FiltersModal({ open, value, onApply, onReset, onOpenChange, collaborators }: FiltersModalProps) {
  const [draft, setDraft] = useState<FileFilters>(value);
  const { configs } = useStorageConfigs();

  // Синхронизируем черновик с применёнными фильтрами при каждом открытии.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  /** Опции селектора «Хранилище» из реестра конфигов (Req 6.6) */
  const storages = useMemo<StorageOption[]>(
    () => configs.map((c) => ({ id: c.id, name: c.name })),
    [configs],
  );

  /** Частичное обновление черновика фильтров */
  const patchDraft = (patch: Partial<FileFilters>) => setDraft((prev) => ({ ...prev, ...patch }));

  /** Валиден ли черновик для применения (дизейбл кнопки «Применить», Req 6.9) */
  const valid = isFiltersValid(draft);

  /** Применение черновика и закрытие модалки */
  const handleApply = () => {
    if (!valid) return;
    onApply(draft);
    onOpenChange(false);
  };

  /** Полный сброс фильтров */
  const handleReset = () => {
    setDraft({});
    onReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="filters-modal">
        <DialogHeader>
          <DialogTitle>Фильтры файлов</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <FiltersModalFields
            draft={draft}
            onChange={patchDraft}
            collaborators={collaborators}
            storages={storages}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            data-testid="filters-reset"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Сбросить фильтр
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={!valid}
            data-testid="filters-apply"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
