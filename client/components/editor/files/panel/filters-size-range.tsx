/**
 * @fileoverview Выделенный виджет фильтра по размеру файла `FiltersSizeRange`
 * (Req 6.7). Полированная замена временного `filters-modal-size-field`: два
 * числовых Input (Мин/Макс) и переключатель единиц KB/MB (ToggleGroup). Контракт
 * пропсов совместим с прежним полем для минимальной подмены в
 * `filters-modal-fields`. Иконки lucide-react, без декоративных эмодзи (Req 13.2).
 * @module components/editor/files/panel/filters-size-range
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { SizeUnit } from '../hooks/project-files-query-params';

/** Пропсы виджета диапазона размера */
export interface FiltersSizeRangeProps {
  /** Минимальный размер (в единицах sizeUnit) */
  sizeMin?: number;
  /** Максимальный размер (в единицах sizeUnit) */
  sizeMax?: number;
  /** Единица измерения (по умолчанию KB) */
  sizeUnit?: SizeUnit;
  /** Изменение значений размера/единицы */
  onChange: (patch: { sizeMin?: number; sizeMax?: number; sizeUnit?: SizeUnit }) => void;
}

/**
 * Преобразует строковое значение Input в число либо undefined (для пустой строки).
 * @param raw - Сырое значение поля ввода
 * @returns Число или undefined
 */
function parseSize(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Виджет фильтра размера: минимум, максимум и единица KB/MB (Req 6.7).
 * @param props - Текущие значения размера и обработчик изменения
 * @returns JSX элемент поля диапазона размера
 */
export function FiltersSizeRange({ sizeMin, sizeMax, sizeUnit = 'KB', onChange }: FiltersSizeRangeProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Размер файла</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Мин"
          value={sizeMin ?? ''}
          onChange={(e) => onChange({ sizeMin: parseSize(e.target.value) })}
          className="h-8"
          data-testid="filters-size-min"
        />
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Макс"
          value={sizeMax ?? ''}
          onChange={(e) => onChange({ sizeMax: parseSize(e.target.value) })}
          className="h-8"
          data-testid="filters-size-max"
        />
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={sizeUnit}
          onValueChange={(v) => v && onChange({ sizeUnit: v as SizeUnit })}
          className="shrink-0"
          data-testid="filters-size-unit"
        >
          <ToggleGroupItem value="KB" className="h-8 px-2.5 text-xs">
            KB
          </ToggleGroupItem>
          <ToggleGroupItem value="MB" className="h-8 px-2.5 text-xs">
            MB
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
